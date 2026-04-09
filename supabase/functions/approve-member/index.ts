// supabase/functions/approve-member/index.ts
// Deploy: supabase functions deploy approve-member

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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

    // SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Try to create the auth user.
    //    If email already exists, find them instead.
    let authUserId;

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { full_name, school: school || '', grade: grade || '', phone: phone || '', role: 'student' },
    });

    if (createError) {
      if (
        createError.message?.toLowerCase().includes('already been registered') ||
        createError.message?.toLowerCase().includes('already exists') ||
        createError.code === 'email_exists'
      ) {
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        if (listError) throw listError;
        const existing = users.find(u => u.email === email);
        if (!existing) throw new Error(`User ${email} exists but could not be found`);
        authUserId = existing.id;
      } else {
        throw createError;
      }
    } else {
      authUserId = newUser.user.id;
    }

    // 2. Upsert into members table
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

    if (memberError) throw new Error(`Members table error: ${memberError.message}`);

    // 3. Mark registration_request as approved (only columns that exist in schema)
    const { error: requestError } = await supabaseAdmin
      .from('registration_requests')
      .update({
        status: 'approved',
        admin_notes: admin_notes || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', application_id);

    if (requestError) throw new Error(`Request update error: ${requestError.message}`);

    // 4. Send password reset email so student sets their own password
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://feza-programming-club.vercel.app';
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/update-password`,
    });

    if (resetError) console.warn('Reset email non-fatal:', resetError.message);

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