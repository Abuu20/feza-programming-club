import { supabase } from './supabase'

export const membershipService = {
  // Submit a new membership application
  async apply(application) {
    try {
      const { data, error } = await supabase
        .from('membership_applications')
        .insert([application])
        .select()
      
      if (error) {
        console.error('Supabase error:', error)
        return { data: null, error: error }
      }
      
      return { data, error: null }
    } catch (err) {
      console.error('Application error:', err)
      return { data: null, error: err }
    }
  },

  // Get all applications (admin only)
  async getAllApplications() {
    const { data, error } = await supabase
      .from('membership_applications')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Get application counts by status
  async getApplicationCounts() {
    const { data, error } = await supabase
      .from('membership_applications')
      .select('status')
    
    if (error) return { data: null, error }
    
    const counts = {
      total: data.length,
      pending: data.filter(a => a.status === 'pending').length,
      approved: data.filter(a => a.status === 'approved').length,
      rejected: data.filter(a => a.status === 'rejected').length
    }
    
    return { data: counts, error: null }
  },

  // Get application by status (admin only)
  async getApplicationsByStatus(status) {
    const { data, error } = await supabase
      .from('membership_applications')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Update application status (admin only) - WITH AUTO-CREATE MEMBER
  async updateStatus(id, status, adminNotes = null) {
    try {
      console.log('Updating application status:', { id, status, adminNotes });
      
      // First, get the application details
      const { data: application, error: fetchError } = await supabase
        .from('membership_applications')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching application:', fetchError);
        throw fetchError;
      }

      console.log('Found application:', application);

      const updates = {
        status,
        reviewed_at: new Date(),
        ...(adminNotes && { admin_notes: adminNotes })
      };
      
      // Update the application status
      const { data: updatedApp, error: updateError } = await supabase
        .from('membership_applications')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating application:', updateError);
        throw updateError;
      }

      console.log('Application updated:', updatedApp);

      // If status is 'approved', create a member record
      if (status === 'approved' && application) {
        console.log('Creating member from application:', application);
        
        // Check if member already exists with this email
        const { data: existingMember, error: checkError } = await supabase
          .from('members')
          .select('*')
          .eq('email', application.email)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking existing member:', checkError);
        }

        console.log('Existing member check:', existingMember);

        if (!existingMember) {
          // Create new member from application data
          const memberData = {
            name: application.full_name,
            email: application.email,
            phone: application.phone || '',
            school: application.school || '',
            grade: application.grade || '',
            role: 'Member',
            bio: application.reason || `Joined via membership application. ${application.experience_level || 'Beginner'} level programmer.`,
            photo_url: null,
            display_order: 999,
            status: 'active'
          };

          console.log('Attempting to create member with data:', memberData);

          const { data: newMember, error: memberError } = await supabase
            .from('members')
            .insert([memberData])
            .select();

          if (memberError) {
            console.error('❌ Error creating member:', memberError);
            // Log the full error details
            console.error('Error details:', {
              message: memberError.message,
              details: memberError.details,
              hint: memberError.hint,
              code: memberError.code
            });
          } else {
            console.log('✅ Member created successfully:', newMember);
          }
        } else {
          console.log('Member already exists:', existingMember);
        }
      }

      return { data: updatedApp, error: null };
    } catch (error) {
      console.error('Error in updateStatus:', error);
      return { data: null, error };
    }
  },

  // Check if email already applied
  async checkExistingApplication(email) {
    const { data, error } = await supabase
      .from('membership_applications')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return { data, error }
  },

  // Delete application (admin only)
  async deleteApplication(id) {
    const { error } = await supabase
      .from('membership_applications')
      .delete()
      .eq('id', id)
    return { error }
  },

  // Directly add a member (for testing)
  async addTestMember(memberData) {
    const { data, error } = await supabase
      .from('members')
      .insert([memberData])
      .select()
    return { data, error }
  }
}
