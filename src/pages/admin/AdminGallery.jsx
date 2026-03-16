import React, { useState, useEffect } from 'react';
import { galleryService } from '../../services/gallery';
import { FaPlus, FaTrash, FaEdit, FaDownload, FaEye, FaImage, FaTimes } from 'react-icons/fa';
import UploadModal from '../../components/gallery/UploadModal';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const AdminGallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editingImage, setEditingImage] = useState(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    const { data, error } = await galleryService.getAll();
    if (error) {
      toast.error('Failed to load gallery');
    } else {
      setImages(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (image) => {
    if (window.confirm(`Are you sure you want to delete "${image.title || 'this image'}"?`)) {
      const { error } = await galleryService.deleteImage(image.id, image.image_url);
      if (!error) {
        toast.success('Image deleted successfully');
        fetchImages();
      } else {
        toast.error('Failed to delete image');
      }
    }
  };

  const handleDownload = async (image) => {
    try {
      const response = await fetch(image.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.title || 'gallery-image.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  const handleUpdateTitle = async (id, newTitle) => {
    if (!newTitle.trim()) return;
    
    const { error } = await galleryService.updateImage(id, { title: newTitle });
    if (!error) {
      toast.success('Title updated');
      fetchImages();
    }
    setEditingImage(null);
  };

  if (loading) return <Loader />;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gallery Management</h1>
          <p className="text-gray-600">Upload and manage club photos</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <FaPlus />
          Upload Images
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Images</div>
          <div className="text-3xl font-bold">{images.length}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500">Last Upload</div>
          <div className="text-lg font-medium">
            {images.length > 0 
              ? new Date(images[0].created_at).toLocaleDateString()
              : 'No images yet'}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500">Storage Used</div>
          <div className="text-lg font-medium">
            ~{images.length * 2} MB
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map((image) => (
            <div
              key={image.id}
              className="bg-white rounded-lg shadow-md overflow-hidden group relative"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-gray-100">
                <img
                  src={image.image_url}
                  alt={image.title || 'Gallery image'}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  onClick={() => setSelectedImage(image)}
                />
                
                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedImage(image)}
                      className="bg-white p-2 rounded-full hover:bg-primary-500 hover:text-white transition"
                      title="View"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleDownload(image)}
                      className="bg-white p-2 rounded-full hover:bg-primary-500 hover:text-white transition"
                      title="Download"
                    >
                      <FaDownload />
                    </button>
                    <button
                      onClick={() => handleDelete(image)}
                      className="bg-white p-2 rounded-full hover:bg-red-500 hover:text-white transition"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>

              {/* Image Info */}
              <div className="p-4">
                {editingImage === image.id ? (
                  <input
                    type="text"
                    defaultValue={image.title || 'Untitled'}
                    onBlur={(e) => handleUpdateTitle(image.id, e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateTitle(image.id, e.target.value);
                      }
                    }}
                    className="w-full px-2 py-1 border rounded"
                    autoFocus
                  />
                ) : (
                  <div className="flex justify-between items-center">
                    <h3 
                      className="font-medium truncate cursor-pointer hover:text-primary-600"
                      onClick={() => setEditingImage(image.id)}
                      title="Click to edit"
                    >
                      {image.title || 'Untitled'}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {new Date(image.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {image.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {image.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FaImage className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Images Yet</h3>
          <p className="text-gray-500 mb-6">
            Start by uploading images to your gallery
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <FaPlus />
            Upload First Image
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            fetchImages();
            setShowUploadModal(false);
          }}
        />
      )}

      {/* Lightbox for viewing images */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={selectedImage.image_url}
              alt={selectedImage.title}
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white p-2 rounded-full hover:bg-gray-200"
            >
              <FaTimes />
            </button>
            <div className="absolute bottom-4 left-4 right-4 text-center text-white">
              <h3 className="text-xl font-bold">{selectedImage.title}</h3>
              {selectedImage.description && (
                <p className="text-gray-300 mt-2">{selectedImage.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
