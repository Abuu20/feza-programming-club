import { supabase } from './supabase'

export const membersService = {
  async getAll() {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('display_order', { ascending: true })
    return { data, error }
  },

  async create(member) {
    const { data, error } = await supabase
      .from('members')
      .insert([member])
      .select()
    return { data, error }
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  async delete(id) {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id)
    return { error }
  }
}
