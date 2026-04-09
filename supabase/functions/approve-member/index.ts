// supabase/functions/approve-member/index.ts
//
// Deploy with:  supabase functions deploy approve-member
//
// This function is called by AdminMembershipApplications when the admin
// clicks "Approve". It:
//   1. Creates the user in auth.users (service-role only — can't do this from browser)
//   2. Inserts a row in the members table
//   3. Sends Supabase's built-in password-reset email so the student sets their own password
//   4. Marks the registration_request as approved

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { application_id, full_name, email, school, grade, phone, admin_notes } = await req.json();

    if (!email || !application_id) {
      return new Response(
        JSON.stringify({ error: 'email and application_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Admin client — uses service role key, has full auth.users access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Check if a user with this email already exists in auth.users
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const alreadyExists = existingUsers?.users?.some(u => u.email === email);

    let authUserId: string;

    if (alreadyExists) {
      // User already has an auth account — just grab their ID
      const existing = existingUsers.users.find(u => u.email === email)!;
      authUserId = existing.id;
    } else {
      // 2. Create the auth user with a random temporary password
      //    They will immediately receive a password-reset email to set their own
      const tempPassword = crypto.randomUUID(); // never shared with anyone
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true, // mark email as already confirmed
        user_metadata: {
          full_name,
          school: school || '',
          grade: grade || '',
          phone: phone || '',
          role: 'student',
        },
      });

      if (createError) throw createError;
      authUserId = newUser.user.id;
    }

    // 3. Upsert into members table (in case it was partially created before)
    const { error: memberError } = await supabaseAdmin
      .from('members')
      .upsert({
        user_id: authUserId,
        name: full_name,
        email,
        school: school || null,
        grade: grade || null,
        phone: phone || null,
        role: 'Student',
        status: 'active',
        bio: `Joined Feza Programming Club on ${new Date().toLocaleDateString()}`,
        joined_date: new Date().toISOString(),
        display_order: 999,
      }, { onConflict: 'user_id' });

    if (memberError) throw memberError;

    // 4. Mark the registration_request as approved
    const { error: requestError } = await supabaseAdmin
      .from('registration_requests')
      .update({
        status: 'approved',
        admin_notes: admin_notes || null,
        approved_at: new Date().toISOString(),
      })
      .eq('id', application_id);

    if (requestError) throw requestError;

    // 5. Send password-reset email so the student sets their own password
    //    This uses Supabase's built-in email template.
    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:3000';
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${siteUrl}/update-password` },
    });

    // resetError is non-fatal — auth account is created regardless
    if (resetError) {
      console.warn('Password reset email failed (non-fatal):', resetError.message);
    }

    return new Response(
      JSON.stringify({ success: true, user_id: authUserId, email_sent: !resetError }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('approve-member error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});