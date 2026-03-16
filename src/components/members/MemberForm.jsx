import React, { useState } from 'react';
import { FaTimes, FaUpload } from 'react-icons/fa';
import { membersService } from '../../services/members';
import { storageService } from '../../services/storage';
import { BUCKETS } from '../../utils/constants';
import toast from 'react-hot-toast';

const MemberForm = ({ member, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: member?.name || '',
    role: member?.role || '',
    bio: member?.bio || '',
    display_order: member?.display_order || 0,
    photo_url: member?.photo_url || ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(member?.photo_url || '');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return formData.photo_url;

    const fileName = `member-${Date.now()}-${imageFile.name}`;
    const { error } = await storageService.uploadFile(
      BUCKETS.MEMBERS,
      fileName,
      imageFile
    );

    if (error) {
      toast.error('Failed to upload image');
      return null;
    }

    const publicUrl = await storageService.getPublicUrl(BUCKETS.MEMBERS, fileName);
    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl = formData.photo_url;
      
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        }
      }

      const memberData = {
        ...formData,
        photo_url: photoUrl,
        display_order: parseInt(formData.display_order) || 0
      };

      if (member) {
        const { error } = await membersService.update(member.id, memberData);
        if (error) throw error;
        toast.success('Member updated successfully');
      } else {
        const { error } = await membersService.create(memberData);
        if (error) throw error;
        toast.success('Member added successfully');
      }

      onClose();
    } catch (error) {
      toast.error('Failed to save member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {member ? 'Edit Member' : 'Add New Member'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Enter member name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., President, Mentor, Member"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="3"
              className="input-field"
              placeholder="Short biography"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Order
            </label>
            <input
              type="number"
              name="display_order"
              value={formData.display_order}
              onChange={handleChange}
              className="input-field w-32"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo
            </label>
            <div className="flex items-center gap-4">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-20 h-20 rounded-full object-cover"
                />
              )}
              <label className="flex-1">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary-500 transition">
                  <FaUpload className="mx-auto text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">
                    Click to upload photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Saving...' : (member ? 'Update' : 'Add Member')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberForm;
