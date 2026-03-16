import { supabase } from './supabase'

export const activitiesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('date', { ascending: false })
    return { data, error }
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  async create(activity) {
    const { data, error } = await supabase
      .from('activities')
      .insert([activity])
      .select()
    return { data, error }
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  async delete(id) {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)
    return { error }
  }
}
