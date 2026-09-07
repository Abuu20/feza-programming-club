import { supabase } from './supabase';

export const galleryService = {
  // Get all gallery images
  async getAll() {
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // Upload image to storage and save to database
  async uploadImage(file, metadata = {}) {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      // Save to gallery table
      const { data: galleryData, error: dbError } = await supabase
        .from('gallery')
        .insert([{
          title: metadata.title || file.name,
          description: metadata.description || '',
          image_url: publicUrl,
          display_order: metadata.display_order || 0
        }])
        .select();

      if (dbError) throw dbError;

      return { data: galleryData, error: null };
    } catch (error) {
      console.error('Error uploading image:', error);
      return { data: null, error };
    }
  },

  // Delete image
  async deleteImage(id, imageUrl) {
    try {
      // Extract file path from URL
      const fileName = imageUrl.split('/').pop();
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('gallery')
        .remove([fileName]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      return { error: null };
    } catch (error) {
      console.error('Error deleting image:', error);
      return { error };
    }
  },

  // Update image metadata
  async updateImage(id, updates) {
    const { data, error } = await supabase
      .from('gallery')
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  }
};
