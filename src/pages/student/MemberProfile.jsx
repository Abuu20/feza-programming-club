import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';
import { FaCamera, FaGithub, FaLinkedin, FaTwitter, FaGlobe, FaSave, FaTrash, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';

const MemberProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    github: '',
    linkedin: '',
    twitter: '',
    website: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      console.log('Fetching profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle to avoid 0 rows error

      if (error) {
        console.error('Fetch error:', error);
        throw error;
      }

      if (!data) {
        console.log('No profile found, creating one...');
        // Create a new profile if it doesn't exist
        const { data: newProfile, error: insertError } = await supabase
          .from('members')
          .insert({
            user_id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0],
            email: user.email,
            role: 'Member',
            status: 'active'
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setProfile(newProfile);
        setFormData({
          name: newProfile.name || '',
          bio: newProfile.bio || '',
          github: newProfile.github || '',
          linkedin: newProfile.linkedin || '',
          twitter: newProfile.twitter || '',
          website: newProfile.website || ''
        });
        setImagePreview(newProfile.photo_url || '');
      } else {
        setProfile(data);
        setFormData({
          name: data.name || '',
          bio: data.bio || '',
          github: data.github || '',
          linkedin: data.linkedin || '',
          twitter: data.twitter || '',
          website: data.website || ''
        });
        setImagePreview(data.photo_url || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return profile?.photo_url || '';

    setUploadingImage(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `member-photos/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('member-photos')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('member-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      let photoUrl = profile?.photo_url || '';
      
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        }
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('members')
        .update({
          name: formData.name,
          bio: formData.bio,
          github: formData.github,
          linkedin: formData.linkedin,
          twitter: formData.twitter,
          website: formData.website,
          photo_url: photoUrl,
          updated_at: new Date()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast.success('Profile updated successfully!');
      
      // Clear the image file after successful upload
      setImageFile(null);
      
      // Refresh profile data
      await fetchProfile();
      
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary-600 mb-8">My Profile</h1>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-8 text-white">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Profile Image */}
              <div className="relative group">
                <div 
                  className="w-32 h-32 rounded-full bg-white/20 border-4 border-white overflow-hidden cursor-pointer"
                  onClick={() => imagePreview && setShowImageModal(true)}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt={formData.name || 'Profile'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">
                      📸
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-secondary-500 p-2 rounded-full cursor-pointer hover:bg-secondary-600 transition">
                  <FaCamera className="text-white" size={14} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold">{formData.name || 'Set your name'}</h2>
                <p className="text-primary-100 mt-1">
                  Member since {profile?.joined_date ? new Date(profile.joined_date).toLocaleDateString() : 'today'}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows="4"
                className="input-field"
                placeholder="Tell us about yourself, your interests, and what you're learning..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FaGithub className="text-gray-600" />
                  GitHub
                </label>
                <input
                  type="url"
                  value={formData.github}
                  onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                  className="input-field"
                  placeholder="https://github.com/username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FaLinkedin className="text-gray-600" />
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  className="input-field"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FaTwitter className="text-gray-600" />
                  Twitter
                </label>
                <input
                  type="url"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  className="input-field"
                  placeholder="https://twitter.com/username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FaGlobe className="text-gray-600" />
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="input-field"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="submit"
                disabled={updating || uploadingImage}
                className="btn-primary flex items-center gap-2"
              >
                <FaSave />
                {updating || uploadingImage ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {showImageModal && imagePreview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={imagePreview}
              alt="Profile"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 bg-white p-2 rounded-full hover:bg-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberProfile;
