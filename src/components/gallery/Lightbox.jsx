import React, { useEffect } from 'react';
import { FaTimes, FaDownload, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Lightbox = ({ image, onClose, onDownload, onNext, onPrev, hasNext, hasPrev }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
      >
        <FaTimes size={24} />
      </button>

      {/* Navigation buttons */}
      {hasPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
        >
          <FaChevronLeft size={32} />
        </button>
      )}
      
      {hasNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
        >
          <FaChevronRight size={32} />
        </button>
      )}

      {/* Image */}
      <div className="max-w-7xl max-h-screen p-4">
        <img
          src={image.image_url}
          alt={image.title || 'Gallery image'}
          className="max-w-full max-h-[90vh] object-contain mx-auto"
        />
      </div>

      {/* Image info and download */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6 text-white">
        <div className="container-custom flex justify-between items-end">
          <div>
            <h3 className="text-2xl font-bold mb-2">{image.title || 'Untitled'}</h3>
            {image.description && (
              <p className="text-gray-300">{image.description}</p>
            )}
          </div>
          <button
            onClick={() => onDownload(image.image_url, image.title || 'image.jpg')}
            className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
          >
            <FaDownload />
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lightbox;
