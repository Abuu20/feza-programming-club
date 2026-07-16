import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import {
  FaPlus, FaTrash, FaEdit, FaImage, FaFont, FaEye,
  FaToggleOn, FaToggleOff, FaSpinner, FaTimes, FaCheck,
  FaUpload, FaCalendar, FaLightbulb, FaFire, FaCode, FaRocket
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'trick',      label: 'Python Trick',   icon: '✨', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'motivation', label: 'Motivation',      icon: '🔥', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'syntax',     label: 'Python Syntax',   icon: '🐍', color: 'bg-green-100  text-green-700  border-green-200'  },
  { value: 'project',    label: 'Project Idea',    icon: '🚀', color: 'bg-blue-100   text-blue-700   border-blue-200'   },
];

const ConfirmModal = ({ title, message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-6">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm">Cancel</button>
        <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">Delete</button>
      </div>
    </div>
  </div>
);

// ── Tip Form ──────────────────────────────────────────────────────────────────
const TipForm = ({ tip, onSaved, onCancel }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    type:       tip?.type       || 'text',
    title:      tip?.title      || '',
    content:    tip?.content    || '',
    image_url:  tip?.image_url  || '',
    category:   tip?.category   || 'trick',
    tag:        tip?.tag        || '',
    show_date:  tip?.show_date  || '',
    is_published: tip?.is_published ?? true,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [preview, setPreview]     = useState(false);
  const fileRef = useRef(null);

  const uploadImage = async (file) => {
    if (!file.type.startsWith('image/')) { toast.error('Images only'); return; }
    if (file.size > 8*1024*1024) { toast.error('Max 8MB'); return; }
    setUploading(true);
    const ext  = file.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('tips-images').upload(path, file);
    if (upErr) { toast.error('Upload failed'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('tips-images').getPublicUrl(path);
    setForm(p => ({ ...p, image_url: publicUrl }));
    setUploading(false);
    toast.success('Image uploaded!');
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (form.type === 'text' && !form.content.trim()) { toast.error('Content is required for text tips'); return; }
    if (form.type === 'image' && !form.image_url) { toast.error('Please upload an image'); return; }
    setSaving(true);
    const payload = { ...form, created_by: user?.id };
    let error;
    if (tip?.id) {
      ({ error } = await supabase.from('daily_tips').update(payload).eq('id', tip.id));
    } else {
      ({ error } = await supabase.from('daily_tips').insert(payload));
    }
    if (error) {
      if (error.code === '23505') toast.error('A tip is already scheduled for that date');
      else toast.error('Save failed: ' + error.message);
    } else {
      toast.success(tip ? 'Tip updated!' : 'Tip created!');
      onSaved();
    }
    setSaving(false);
  };

  const cat = CATEGORIES.find(c => c.value === form.category);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-lg">{tip ? 'Edit Tip' : 'New Daily Tip'}</h3>
        <div className="flex gap-2">
          <button onClick={() => setPreview(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition
              ${preview ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <FaEye size={12} /> {preview ? 'Hide Preview' : 'Preview'}
          </button>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1"><FaTimes /></button>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className={`rounded-2xl border-2 p-4 ${cat?.color || 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">{cat?.icon}</div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-60">{cat?.label}</p>
              <p className="font-bold text-lg">{form.title || 'Tip title...'}</p>
            </div>
          </div>
          {form.type === 'text' && <p className="text-sm leading-relaxed opacity-80">{form.content || 'Tip content...'}</p>}
          {form.type === 'image' && form.image_url && (
            <img src={form.image_url} alt="tip" className="w-full rounded-xl" />
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Type */}
        <div className="col-span-2">
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Tip Type</label>
          <div className="flex gap-2">
            {['text','image'].map(t => (
              <button key={t} onClick={() => setForm(p=>({...p, type: t}))}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border-2 transition
                  ${form.type === t ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {t === 'text' ? <FaFont size={12} /> : <FaImage size={12} />}
                {t === 'text' ? 'Text Tip' : 'Image Tip'}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="col-span-2">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Title *</label>
          <input type="text" value={form.title}
            onChange={e => setForm(p=>({...p, title: e.target.value}))}
            placeholder="e.g. Did you know? List comprehensions are faster!"
            className="input-field" />
        </div>

        {/* Content (text type) */}
        {form.type === 'text' && (
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Content *</label>
            <textarea value={form.content}
              onChange={e => setForm(p=>({...p, content: e.target.value}))}
              rows={5} placeholder="Write your tip, trick, or motivation here..."
              className="input-field resize-none text-sm" />
          </div>
        )}

        {/* Image upload */}
        {form.type === 'image' && (
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Tip Image *</label>
            {form.image_url ? (
              <div className="relative">
                <img src={form.image_url} alt="tip preview"
                  className="w-full max-h-72 object-contain rounded-2xl border bg-gray-50" />
                <button onClick={() => setForm(p=>({...p, image_url: ''}))}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600">
                  <FaTimes size={12} />
                </button>
              </div>
            ) : (
              <div onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition">
                {uploading
                  ? <><FaSpinner className="animate-spin text-primary-500 text-3xl mx-auto mb-2" /><p className="text-sm text-primary-500">Uploading...</p></>
                  : <><FaUpload className="text-gray-400 text-3xl mx-auto mb-2" /><p className="text-sm text-gray-500">Click to upload image</p><p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 8MB</p></>
                }
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} />
          </div>
        )}

        {/* Category */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Category</label>
          <select value={form.category} onChange={e => setForm(p=>({...p, category: e.target.value}))} className="input-field text-sm">
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
          </select>
        </div>

        {/* Tag */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Tag (optional)</label>
          <input type="text" value={form.tag}
            onChange={e => setForm(p=>({...p, tag: e.target.value}))}
            placeholder="e.g. loops, functions, OOP"
            className="input-field text-sm" />
        </div>

        {/* Show date */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">
            Schedule Date <span className="font-normal text-gray-400">(optional — leave blank for random rotation)</span>
          </label>
          <input type="date" value={form.show_date}
            onChange={e => setForm(p=>({...p, show_date: e.target.value || null}))}
            className="input-field text-sm" />
        </div>

        {/* Published */}
        <div className="flex items-center gap-3 pt-5">
          <button onClick={() => setForm(p=>({...p, is_published: !p.is_published}))}
            className={`relative w-12 h-6 rounded-full transition-all ${form.is_published ? 'bg-green-500' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.is_published ? 'left-6' : 'left-0.5'}`} />
          </button>
          <span className="text-sm font-medium text-gray-700">{form.is_published ? 'Published' : 'Draft'}</span>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-600 text-sm hover:bg-gray-50 transition">Cancel</button>
        <button onClick={save} disabled={saving || uploading}
          className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm py-2.5 disabled:opacity-50">
          {saving ? <FaSpinner className="animate-spin" size={12} /> : <FaCheck size={12} />}
          {tip ? 'Save Changes' : 'Create Tip'}
        </button>
      </div>
    </div>
  );
};

// ── Main AdminDailyTips ───────────────────────────────────────────────────────
const AdminDailyTips = () => {
  const [tips, setTips]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editingTip, setEditingTip] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [filter, setFilter]         = useState('all');

  useEffect(() => { fetchTips(); }, []);

  const fetchTips = async () => {
    const { data } = await supabase
      .from('daily_tips').select('*').order('created_at', { ascending: false });
    setTips(data || []);
    setLoading(false);
  };

  const togglePublished = async (tip) => {
    await supabase.from('daily_tips').update({ is_published: !tip.is_published }).eq('id', tip.id);
    setTips(prev => prev.map(t => t.id === tip.id ? { ...t, is_published: !t.is_published } : t));
    toast.success(tip.is_published ? 'Tip unpublished' : 'Tip published');
  };

  const deleteTip = (tip) => {
    setConfirmModal({
      title: 'Delete Tip',
      message: `Delete "${tip.title}"? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(null);
        await supabase.from('daily_tips').delete().eq('id', tip.id);
        setTips(prev => prev.filter(t => t.id !== tip.id));
        toast.success('Deleted');
      }
    });
  };

  const displayed = tips.filter(t => {
    if (filter === 'published') return t.is_published;
    if (filter === 'draft')     return !t.is_published;
    if (filter !== 'all')       return t.category === filter;
    return true;
  });

  const today = new Date().toISOString().split('T')[0];
  const todayTip = tips.find(t => t.show_date === today && t.is_published);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Daily Tips</h1>
          <p className="text-gray-500 text-sm">Manage Python tips, tricks and motivation shown to students daily</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingTip(null); }}
          className="btn-primary flex items-center gap-2">
          <FaPlus /> New Tip
        </button>
      </div>

      {/* Today's tip highlight */}
      {todayTip && (
        <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-indigo-50 border border-primary-200 rounded-2xl flex items-center gap-4">
          <div className="text-3xl">📅</div>
          <div className="flex-1">
            <p className="text-xs font-bold text-primary-500 uppercase tracking-wider">Showing Today</p>
            <p className="font-bold text-gray-800">{todayTip.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 capitalize">{todayTip.category} · {todayTip.type}</p>
          </div>
          <button onClick={() => { setEditingTip(todayTip); setShowForm(true); }}
            className="flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:text-primary-700">
            <FaEdit size={12} /> Edit
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Tips',  val: tips.length,                            color: 'bg-gray-50  border-gray-200'  },
          { label: 'Published',   val: tips.filter(t=>t.is_published).length,  color: 'bg-green-50 border-green-200' },
          { label: 'Scheduled',   val: tips.filter(t=>t.show_date).length,     color: 'bg-blue-50  border-blue-200'  },
          { label: 'Drafts',      val: tips.filter(t=>!t.is_published).length, color: 'bg-gray-50  border-gray-200'  },
        ].map((s,i) => (
          <div key={i} className={`rounded-xl border p-4 text-center ${s.color}`}>
            <div className="text-2xl font-black text-gray-800">{s.val}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { value: 'all',       label: 'All' },
          { value: 'published', label: '✅ Published' },
          { value: 'draft',     label: '📝 Drafts' },
          ...CATEGORIES.map(c => ({ value: c.value, label: `${c.icon} ${c.label}` })),
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition
              ${filter === f.value ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="mb-6">
          <TipForm
            tip={editingTip}
            onSaved={() => { setShowForm(false); setEditingTip(null); fetchTips(); }}
            onCancel={() => { setShowForm(false); setEditingTip(null); }}
          />
        </div>
      )}

      {/* Tips list */}
      {loading ? (
        <div className="flex justify-center py-12"><FaSpinner className="animate-spin text-primary-600 text-3xl" /></div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="text-5xl mb-3">💡</div>
          <h3 className="font-bold text-gray-700 mb-1">No tips yet</h3>
          <p className="text-gray-400 text-sm mb-4">Create your first daily tip for students</p>
          <button onClick={() => { setShowForm(true); setEditingTip(null); }}
            className="btn-primary inline-flex items-center gap-2">
            <FaPlus size={12} /> Create First Tip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayed.map(tip => {
            const cat = CATEGORIES.find(c => c.value === tip.category);
            return (
              <div key={tip.id}
                className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition hover:shadow-md
                  ${!tip.is_published ? 'opacity-60' : ''} ${tip.show_date === today ? 'border-primary-300' : 'border-gray-100'}`}>
                {/* Colour bar */}
                <div className={`h-1.5 ${tip.category === 'trick' ? 'bg-purple-500' : tip.category === 'motivation' ? 'bg-orange-500' : tip.category === 'syntax' ? 'bg-green-500' : 'bg-blue-500'}`} />

                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Preview thumbnail */}
                    {tip.type === 'image' && tip.image_url ? (
                      <img src={tip.image_url} alt="tip"
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-gray-100" />
                    ) : (
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 border ${cat?.color || 'bg-gray-100 border-gray-200'}`}>
                        {cat?.icon || '💡'}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${cat?.color || 'bg-gray-100 text-gray-600'}`}>
                          {cat?.label}
                        </span>
                        {tip.tag && <span className="text-xs text-gray-400">#{tip.tag}</span>}
                        {tip.show_date === today && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-bold">📅 Today</span>}
                        {tip.show_date && tip.show_date !== today && <span className="text-xs text-gray-400 flex items-center gap-1"><FaCalendar size={9} /> {tip.show_date}</span>}
                      </div>
                      <h3 className="font-bold text-gray-800 text-sm leading-tight">{tip.title}</h3>
                      {tip.type === 'text' && tip.content && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tip.content}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <button onClick={() => togglePublished(tip)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition
                          ${tip.is_published ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {tip.is_published ? <FaToggleOn size={12} /> : <FaToggleOff size={12} />}
                        {tip.is_published ? 'Published' : 'Draft'}
                      </button>
                      <span className="text-xs text-gray-400">{tip.type}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingTip(tip); setShowForm(true); }}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Edit">
                        <FaEdit size={13} />
                      </button>
                      <button onClick={() => deleteTip(tip)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition" title="Delete">
                        <FaTrash size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmModal && (
        <ConfirmModal {...confirmModal} onCancel={() => setConfirmModal(null)} />
      )}
    </div>
  );
};

export default AdminDailyTips;
