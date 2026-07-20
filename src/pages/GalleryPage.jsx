import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { FaImage, FaDownload, FaExpand, FaUpload, FaSpinner, FaTimes } from 'react-icons/fa';
import Loader from '../components/common/Loader';
import Lightbox from '../components/gallery/Lightbox';
import toast from 'react-hot-toast';

const GalleryPage = () => {
  const { user } = useAuth();
  const { can, loading: permLoading } = usePermissions();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '' });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileRef = useRef(null);

  useEffect(() => { fetchImages(); }, []);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const openLightbox = (image) => { setSelectedImage(image); setLightboxOpen(true); };
  const closeLightbox = () => { setLightboxOpen(false); setSelectedImage(null); };

  const downloadImage = async (imageUrl, filename) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename || 'image.jpg';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) { console.error('Error downloading:', error); }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const valid = files.filter((f) => {
      const isImage = f.type.startsWith('image/');
      const isUnderLimit = f.size <= 1 * 1024 * 1024;
      return isImage && isUnderLimit;
    });
    const invalid = files.filter((f) => {
      const isImage = f.type.startsWith('image/');
      return !isImage || f.size > 1 * 1024 * 1024;
    });

    if (invalid.length > 0) {
      const invalidMessage = invalid.map((f) => {
        if (!f.type.startsWith('image/')) return `${f.name} is not an image`;
        return `${f.name} exceeds 1MB`;
      }).join('; ');
      toast.error(invalidMessage);
    }

    setSelectedFiles(valid);
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) { toast.error('Select at least one image'); return; }
    setUploading(true);
    const toastId = toast.loading(`Uploading ${selectedFiles.length} image(s)...`);
    let success = 0;

    for (const file of selectedFiles) {
      try {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: upErr } = await supabase.storage.from('gallery').upload(path, file);
        if (upErr) throw upErr;

        const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(path);

        const { error: dbErr } = await supabase.from('gallery').insert({
          title: uploadForm.title || file.name,
          description: uploadForm.description || '',
          image_url: publicUrl,
          uploaded_by: user.id,
          display_order: 0,
        });
        if (dbErr) throw dbErr;
        success++;
      } catch (err) {
        toast.error(`Failed: ${file.name}`);
        console.error(err);
      }
    }

    toast.dismiss(toastId);
    toast.success(`${success} of ${selectedFiles.length} uploaded!`);
    setUploading(false);
    setShowUploadModal(false);
    setSelectedFiles([]);
    setUploadForm({ title: '', description: '' });
    fetchImages();
  };

  const handleDelete = async (image) => {
    if (!can('gallery_upload')) return;
    if (!window.confirm(`Delete "${image.title || 'this image'}"?`)) return;
    try {
      const path = image.image_url.split('/gallery/')[1];
      await supabase.storage.from('gallery').remove([path]);
      await supabase.from('gallery').delete().eq('id', image.id);
      setImages(prev => prev.filter(i => i.id !== image.id));
      toast.success('Deleted');
    } catch (err) { toast.error('Delete failed'); }
  };

  if (loading || permLoading) return <Loader />;

  return (
    <div className="container-custom py-12">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-4xl font-bold">Gallery</h1>
          <p className="text-gray-600 mt-1 max-w-2xl">
            Moments from our coding workshops, events, and club activities
          </p>
        </div>

        {/* Upload button — only visible to members with gallery_upload permission */}
        {can('gallery_upload') && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            <FaUpload /> Upload
          </button>
        )}
      </div>

      {/* Image Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div key={image.id}
              className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer"
              onClick={() => openLightbox(image)}>
              <img src={image.image_url} alt={image.title || 'Gallery image'}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />

              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-3">
                  <button onClick={e => { e.stopPropagation(); openLightbox(image); }}
                    className="bg-white p-2 rounded-full hover:bg-primary-600 hover:text-white transition">
                    <FaExpand />
                  </button>
                  <button onClick={e => { e.stopPropagation(); downloadImage(image.image_url, image.title || 'image.jpg'); }}
                    className="bg-white p-2 rounded-full hover:bg-primary-600 hover:text-white transition">
                    <FaDownload />
                  </button>
                  {can('gallery_upload') && (
                    <button onClick={e => { e.stopPropagation(); handleDelete(image); }}
                      className="bg-white p-2 rounded-full hover:bg-red-500 hover:text-white transition">
                      <FaTimes />
                    </button>
                  )}
                </div>
              </div>

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
        <Lightbox image={selectedImage} onClose={closeLightbox} onDownload={downloadImage} />
      )}

      {/* Upload Modal — only rendered if user has permission */}
      {showUploadModal && can('gallery_upload') && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Upload to Gallery</h3>
              <button onClick={() => { setShowUploadModal(false); setSelectedFiles([]); }}
                className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                <input type="text" value={uploadForm.title}
                  onChange={e => setUploadForm(p => ({...p, title: e.target.value}))}
                  className="input-field" placeholder="e.g. Python Workshop Day 1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea value={uploadForm.description} rows={2}
                  onChange={e => setUploadForm(p => ({...p, description: e.target.value}))}
                  className="input-field resize-none" placeholder="Brief description..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Files</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 transition">
                  <FaUpload className="text-gray-400 text-2xl mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {selectedFiles.length > 0
                      ? `${selectedFiles.length} image(s) selected`
                      : 'Click to select image files'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Multiple images supported, max 1MB each</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*"
                  multiple className="hidden" onChange={handleFileSelect} />
              </div>

              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                      <span className="truncate max-w-[120px]">{f.name}</span>
                      <button onClick={() => setSelectedFiles(p => p.filter((_,j) => j !== i))}
                        className="text-gray-400 hover:text-red-500 ml-1"><FaTimes size={10} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowUploadModal(false); setSelectedFiles([]); }}
                className="flex-1 px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleUpload} disabled={uploading || !selectedFiles.length}
                className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50">
                {uploading ? <><FaSpinner className="animate-spin" /> Uploading...</> : <><FaUpload /> Upload</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;