import { supabase } from './supabase'

export const codesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('codes')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async getUserCodes(userId) {
    const { data, error } = await supabase
      .from('codes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async create(code) {
    const { data, error } = await supabase
      .from('codes')
      .insert([code])
      .select()
    return { data, error }
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('codes')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  async delete(id) {
    const { error } = await supabase
      .from('codes')
      .delete()
      .eq('id', id)
    return { error }
  }
}
