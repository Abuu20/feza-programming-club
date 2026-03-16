import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { FaImage, FaDownload, FaExpand } from 'react-icons/fa';
import Loader from '../components/common/Loader';
import Lightbox from '../components/gallery/Lightbox';

const GalleryPage = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const openLightbox = (image) => {
    setSelectedImage(image);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedImage(null);
  };

  const downloadImage = async (imageUrl, filename) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'image.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container-custom py-12">
      <h1 className="text-4xl font-bold text-center mb-4">Gallery</h1>
      <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
        Explore moments from our coding workshops, events, and club activities
      </p>

      {/* Image Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer"
              onClick={() => openLightbox(image)}
            >
              <img
                src={image.image_url}
                alt={image.title || 'Gallery image'}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openLightbox(image);
                    }}
                    className="bg-white p-2 rounded-full hover:bg-primary-600 hover:text-white transition"
                  >
                    <FaExpand />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadImage(image.image_url, image.title || 'image.jpg');
                    }}
                    className="bg-white p-2 rounded-full hover:bg-primary-600 hover:text-white transition"
                  >
                    <FaDownload />
                  </button>
                </div>
              </div>

              {/* Image Info */}
              {image.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                  <p className="text-white text-sm font-medium truncate">{image.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <FaImage className="text-6xl text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No images in the gallery yet</p>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && selectedImage && (
        <Lightbox
          image={selectedImage}
          onClose={closeLightbox}
          onDownload={downloadImage}
        />
      )}
    </div>
  );
};

export default GalleryPage;
