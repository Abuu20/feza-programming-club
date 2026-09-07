import { supabase } from './supabase';

export const announcementsService = {
  // Get all announcements
  async getAll() {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // Get latest announcements for homepage
  async getLatest(limit = 3) {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data, error };
  },

  // Get single announcement
  async getById(id) {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  // Create announcement (admin only)
  async create(announcement) {
    const { data, error } = await supabase
      .from('announcements')
      .insert([announcement])
      .select();
    return { data, error };
  },

  // Update announcement (admin only)
  async update(id, updates) {
    const { data, error } = await supabase
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  },

  // Delete announcement (admin only)
  async delete(id) {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);
    return { error };
  }
};
