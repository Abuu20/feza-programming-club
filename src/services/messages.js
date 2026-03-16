import { supabase } from './supabase'

export const messagesService = {
  async create(message) {
    const { data, error } = await supabase
      .from('messages')
      .insert([message])
      .select()
    return { data, error }
  },

  async getAll() {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async markAsRead(id) {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', id)
    return { error }
  }
}
