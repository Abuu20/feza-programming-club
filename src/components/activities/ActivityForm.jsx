// src/components/activities/ActivityForm.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { FaTimes, FaPlus, FaUpload, FaTrash, FaStar, FaSpinner, FaImage, FaCloudUploadAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ActivityForm = ({ activity, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    organizer: '',
    max_participants: '',
    requirements: '',
    agenda: '',
    status: 'upcoming'
  });
  
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    if (activity) {
      setFormData({
        title: activity.title || '',
        description: activity.description || '',
        date: activity.date ? activity.date.split('T')[0] : '',
        location: activity.location || '',
        organizer: activity.organizer || '',
        max_participants: activity.max_participants || '',
        requirements: activity.requirements || '',
        agenda: activity.agenda || '',
        status: activity.status || 'upcoming'
      });
      
      // Load existing images
      if (activity.id) {
        loadExistingImages(activity.id);
      }
    }
  }, [activity]);

  const loadExistingImages = async (activityId) => {
    try {
      const { data, error } = await supabase
        .from('activity_images')
        .select('*')
        .eq('activity_id', activityId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('Failed to load existing images');
    }
  };

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Validate files
    const validFiles = [];
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        toast.error(`"${file.name}" is not an image file`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 5MB limit`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    const toastId = toast.loading(`Uploading ${validFiles.length} image(s)...`);

    try {
      const newImages = [];
      
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        
        // Create unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExt = file.name.split('.').pop();
        const fileName = `activity-${timestamp}-${randomString}.${fileExt}`;
        const filePath = `activity-images/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('activities')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('activities')
          .getPublicUrl(filePath);

        setUploadProgress(prev => ({ ...prev, [file.name]: 'completed' }));
        
        newImages.push({
          image_url: publicUrl,
          caption: file.name,
          display_order: images.length + i,
          is_primary: images.length === 0 && i === 0, // First image becomes primary
          file_name: file.name,
          file_size: file.size
        });
      }

      // Update local state with new images
      setImages(prev => [...prev, ...newImages]);
      
      toast.dismiss(toastId);
      toast.success(`${validFiles.length} image(s) uploaded successfully`);
      
      // Clear progress
      setUploadProgress({});
    } catch (error) {
      console.error('Upload error:', error);
      toast.dismiss(toastId);
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (image) => {
    const imageId = image.id;
    const imageIndex = images.findIndex(img => img.id === imageId || img === image);
    
    if (window.confirm('Remove this image?')) {
      try {
        // If image has an ID (already saved to database), delete from storage and database
        if (imageId) {
          // Extract file path from URL
          const urlParts = image.image_url.split('/');
          const filePath = urlParts.slice(urlParts.indexOf('activity-images')).join('/');
          
          // Delete from storage
          const { error: storageError } = await supabase.storage
            .from('activities')
            .remove([filePath]);
          
          if (storageError) {
            console.error('Storage delete error:', storageError);
            // Continue even if storage delete fails
          }
          
          // Delete from database
          const { error: dbError } = await supabase
            .from('activity_images')
            .delete()
            .eq('id', imageId);
          
          if (dbError) throw dbError;
        }
        
        // Remove from local state
        setImages(prev => prev.filter((_, idx) => idx !== imageIndex));
        toast.success('Image removed');
      } catch (error) {
        console.error('Error removing image:', error);
        toast.error('Failed to remove image');
      }
    }
  };

  const handleSetPrimary = async (image) => {
    const imageId = image.id;
    const imageIndex = images.findIndex(img => img.id === imageId || img === image);
    
    try {
      if (imageId) {
        // Update database
        const { error: updateError } = await supabase
          .from('activity_images')
          .update({ is_primary: false })
          .eq('activity_id', activity?.id);

        if (updateError) throw updateError;

        const { error } = await supabase
          .from('activity_images')
          .update({ is_primary: true })
          .eq('id', imageId);

        if (error) throw error;
      }
      
      // Update local state
      setImages(prev => prev.map((img, idx) => ({
        ...img,
        is_primary: idx === imageIndex
      })));
      
      toast.success('Primary image updated');
    } catch (error) {
      console.error('Error setting primary image:', error);
      toast.error('Failed to update primary image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Activity title is required');
      return;
    }
    
    if (!formData.date) {
      toast.error('Activity date is required');
      return;
    }
    
    setLoading(true);
    const toastId = toast.loading(activity ? 'Updating activity...' : 'Creating activity...');

    try {
      let activityId = activity?.id;

      const activityData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        location: formData.location || null,
        organizer: formData.organizer || null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        requirements: formData.requirements || null,
        agenda: formData.agenda || null,
        status: formData.status,
        updated_at: new Date().toISOString()
      };

      if (!activityId) {
        // Create new activity
        activityData.created_at = new Date().toISOString();
        
        const { data, error } = await supabase
          .from('activities')
          .insert([activityData])
          .select()
          .single();

        if (error) throw error;
        activityId = data.id;
        toast.success('Activity created successfully');
      } else {
        // Update existing activity
        const { error } = await supabase
          .from('activities')
          .update(activityData)
          .eq('id', activityId);

        if (error) throw error;
        toast.success('Activity updated successfully');
      }

      // Save images that haven't been saved yet
      const unsavedImages = images.filter(img => !img.id);
      if (unsavedImages.length > 0) {
        const imagesToInsert = unsavedImages.map((img, idx) => ({
          activity_id: activityId,
          image_url: img.image_url,
          caption: img.caption || img.file_name || '',
          display_order: img.display_order,
          is_primary: img.is_primary || false,
          created_at: new Date().toISOString()
        }));

        const { error: imagesError } = await supabase
          .from('activity_images')
          .insert(imagesToInsert);

        if (imagesError) throw imagesError;
      }

      toast.dismiss(toastId);
      toast.success('Activity saved successfully!');
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving activity:', error);
      toast.dismiss(toastId);
      toast.error(error.message || 'Failed to save activity');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {activity ? 'Edit Activity' : 'Create New Activity'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Enter activity title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Describe the activity..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Online or physical location"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organizer</label>
                <input
                  type="text"
                  name="organizer"
                  value={formData.organizer}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Name of organizer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                <input
                  type="number"
                  name="max_participants"
                  value={formData.max_participants}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Leave empty for unlimited"
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="What participants need to bring or know..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agenda</label>
              <textarea
                name="agenda"
                value={formData.agenda}
                onChange={handleChange}
                rows="5"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Timeline of the event..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Images Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Event Images</h3>
            
            {/* Image Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition bg-gray-50">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(e.target.files)}
                className="hidden"
                id="image-upload"
                disabled={uploading}
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                {uploading ? (
                  <>
                    <FaSpinner className="animate-spin text-3xl text-primary-500" />
                    <span className="text-gray-600">Uploading images...</span>
                  </>
                ) : (
                  <>
                    <FaCloudUploadAlt className="text-4xl text-gray-400" />
                    <span className="text-gray-600 font-medium">Click or drag to upload images</span>
                    <span className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB each</span>
                  </>
                )}
              </label>
            </div>

            {/* Image Gallery */}
            {images.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    {images.length} Image{images.length > 1 ? 's' : ''}
                  </label>
                  <span className="text-xs text-gray-500">
                    ⭐ = Primary image (shown first)
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image, idx) => (
                    <div key={image.id || idx} className="relative group">
                      <img
                        src={image.image_url}
                        alt={image.caption || 'Event image'}
                        className="w-full h-32 object-cover rounded-lg border shadow-sm"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        {!image.is_primary && images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(image)}
                            className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                            title="Set as primary"
                          >
                            <FaStar />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(image)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                          title="Remove image"
                        >
                          <FaTrash />
                        </button>
                      </div>
                      {image.is_primary && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <FaStar size={10} /> Primary
                        </div>
                      )}
                      {image.file_name && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-b-lg truncate">
                          {image.file_name.length > 30 ? image.file_name.substring(0, 27) + '...' : image.file_name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {images.length === 0 && !uploading && (
              <div className="text-center py-8 bg-gray-50 rounded-lg border">
                <FaImage className="text-4xl text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No images uploaded yet</p>
                <p className="text-xs text-gray-400">Upload images to showcase your activity</p>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 flex items-center gap-2"
              disabled={loading}
            >
              {loading ? <FaSpinner className="animate-spin" /> : null}
              {activity ? 'Update Activity' : 'Create Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityForm;