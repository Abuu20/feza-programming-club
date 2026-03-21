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
    <div 
      className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-2 md:p-4"
      onClick={onClose}
    >
      {/* Close button - Larger for mobile */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition"
        style={{ touchAction: 'manipulation' }}
      >
        <FaTimes size={24} />
      </button>

      {/* Navigation buttons - Larger for mobile */}
      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition z-10"
          style={{ touchAction: 'manipulation' }}
        >
          <FaChevronLeft size={28} />
        </button>
      )}
      
      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition z-10"
          style={{ touchAction: 'manipulation' }}
        >
          <FaChevronRight size={28} />
        </button>
      )}

      {/* Image */}
      <div 
        className="relative w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={image.image_url}
          alt={image.title || 'Gallery image'}
          className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
          style={{ maxHeight: '85vh', maxWidth: '90vw' }}
        />
      </div>

      {/* Image info and download - Responsive */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 md:p-6 text-white">
        <div className="container-custom flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="text-center md:text-left">
            <h3 className="text-lg md:text-2xl font-bold mb-1">{image.title || 'Untitled'}</h3>
            {image.description && (
              <p className="text-sm md:text-base text-gray-300">{image.description}</p>
            )}
          </div>
          <button
            onClick={() => onDownload(image.image_url, image.title || 'image.jpg')}
            className="bg-white text-black px-4 md:px-6 py-2 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
            style={{ touchAction: 'manipulation' }}
          >
            <FaDownload />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Tap to close hint for mobile */}
      <div className="absolute bottom-20 left-0 right-0 text-center text-white text-xs opacity-50 pointer-events-none">
        Tap outside image to close
      </div>
    </div>
  );
};

export default Lightbox;
