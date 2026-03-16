import { supabase } from './supabase'

export const registrationsService = {
  // Create a new registration
  async create(registration) {
    const { data, error } = await supabase
      .from('activity_registrations')
      .insert([registration])
      .select()
    return { data, error }
  },

  // Check if user/email already registered for an activity
  async checkRegistration(activityId, email) {
    const { data, error } = await supabase
      .from('activity_registrations')
      .select('*')
      .eq('activity_id', activityId)
      .eq('email', email)
      .maybeSingle()
    return { data, error }
  },

  // Get all registrations for an activity (admin only)
  async getActivityRegistrations(activityId) {
    const { data, error } = await supabase
      .from('activity_registrations')
      .select('*')
      .eq('activity_id', activityId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Update registration status (admin only)
  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('activity_registrations')
      .update({ status, updated_at: new Date() })
      .eq('id', id)
      .select()
    return { data, error }
  },

  // Get user's registrations (if logged in)
  async getUserRegistrations(userId) {
    const { data, error } = await supabase
      .from('activity_registrations')
      .select('*, activities(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  }
}
