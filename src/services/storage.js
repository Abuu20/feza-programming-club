import { supabase } from './supabase';

export const storageService = {
  async uploadFile(bucket, path, file) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    return { data, error };
  },

  async getPublicUrl(bucket, path) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  },

  async deleteFile(bucket, path) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    return { error };
  },

  async listFiles(bucket, folder) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder);
    return { data, error };
  },

  // Upload member profile photo
  async uploadMemberPhoto(memberId, file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${memberId}-${Date.now()}.${fileExt}`;
    const filePath = `member-photos/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('member-photos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('member-photos')
      .getPublicUrl(filePath);

    return publicUrl;
  }
};
