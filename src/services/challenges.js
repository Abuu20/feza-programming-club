import { supabase } from './supabase';

export const challengesService = {
  // Get all challenges with filters
  async getAll(filters = {}) {
    let query = supabase
      .from('challenges')
      .select('*')
      .order('difficulty', { ascending: true })
      .order('points', { ascending: true });
    
    if (filters.difficulty && filters.difficulty !== 'all') {
      query = query.eq('difficulty', filters.difficulty);
    }
    
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }
    
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    
    // Only show active challenges to public
    if (!filters.includeInactive) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query;
    return { data, error };
  },

  // Get single challenge by ID
  async getById(id) {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  // Create challenge (admin)
  async create(challenge) {
    const { data, error } = await supabase
      .from('challenges')
      .insert([challenge])
      .select();
    return { data, error };
  },

  // Update challenge (admin)
  async update(id, updates) {
    const { data, error } = await supabase
      .from('challenges')
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  },

  // Delete challenge (admin)
  async delete(id) {
    const { error } = await supabase
      .from('challenges')
      .delete()
      .eq('id', id);
    return { error };
  },

  // Get challenge categories
  async getCategories() {
    const { data, error } = await supabase
      .from('challenges')
      .select('category')
      .not('category', 'is', null);
    
    if (error) return { data: [], error };
    
    const categories = [...new Set(data.map(c => c.category).filter(Boolean))];
    return { data: categories, error: null };
  }
};
