import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import {
  FaPlus, FaTrash, FaEdit, FaToggleOn, FaToggleOff,
  FaSpinner, FaTimes, FaCheck, FaGripVertical, FaExternalLinkAlt
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const GRADIENTS = [
  { label: 'Blue',    val: 'from-blue-500 to-blue-700'      },
  { label: 'Indigo',  val: 'from-indigo-500 to-indigo-700'  },
  { label: 'Violet',  val: 'from-violet-500 to-purple-700'  },
  { label: 'Green',   val: 'from-green-500 to-emerald-700'  },
  { label: 'Teal',    val: 'from-teal-500 to-cyan-700'      },
  { label: 'Orange',  val: 'from-orange-500 to-red-600'     },
  { label: 'Yellow',  val: 'from-yellow-500 to-orange-500'  },
  { label: 'Pink',    val: 'from-pink-500 to-rose-600'      },
  { label: 'Gray',    val: 'from-gray-600 to-gray-800'      },
  { label: 'Red',     val: 'from-red-500 to-red-700'        },
];

const ConfirmModal = ({ title, message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-5">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2 border border-gray-300 rounded-xl text-sm text-gray-600">Cancel</button>
        <button onClick={onConfirm} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium">Delete</button>
      </div>
    </div>
  </div>
);

// ── Site Form ─────────────────────────────────────────────────────────────────
const SiteForm = ({ site, onSaved, onCancel }) => {
  const [form, setForm] = useState({
    name:        site?.name        || '',
    url:         site?.url         || '',
    description: site?.description || '',
    emoji:       site?.emoji       || '🌐',
    color:       site?.color       || 'from-blue-500 to-blue-700',
    category:    site?.category    || 'learning',
    display_order: site?.display_order || 0,
    is_published: site?.is_published ?? true,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.url.trim())  { toast.error('URL is required'); return; }
    // Add https:// if missing
    let url = form.url.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    setSaving(true);
    const payload = { ...form, url };
    let error;
    if (site?.id) {
      ({ error } = await supabase.from('useful_sites').update(payload).eq('id', site.id));
    } else {
      ({ error } = await supabase.from('useful_sites').insert(payload));
    }
    if (error) toast.error('Save failed: ' + error.message);
    else { toast.success(site ? 'Updated!' : 'Site added!'); onSaved(); }
    setSaving(false);
  };

  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">{site ? 'Edit Site' : 'Add New Site'}</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Site Name *</label>
          <input type="text" value={form.name} onChange={e => setForm(p=>({...p, name: e.target.value}))}
            placeholder="e.g. Python Docs" className="input-field text-sm" />
        </div>

        {/* URL */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">URL *</label>
          <div className="relative">
            <input type="url" value={form.url} onChange={e => setForm(p=>({...p, url: e.target.value}))}
              placeholder="https://docs.python.org" className="input-field text-sm pr-9" />
            {form.url && (
              <a href={form.url.startsWith('http') ? form.url : 'https://'+form.url}
                target="_blank" rel="noopener noreferrer"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500">
                <FaExternalLinkAlt size={12} />
              </a>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Description</label>
          <input type="text" value={form.description} onChange={e => setForm(p=>({...p, description: e.target.value}))}
            placeholder="One line about what this site offers" className="input-field text-sm" />
        </div>

        {/* Emoji */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Emoji Icon</label>
          <input type="text" value={form.emoji} onChange={e => setForm(p=>({...p, emoji: e.target.value}))}
            placeholder="🌐" className="input-field text-sm" maxLength={4} />
          <p className="text-xs text-gray-400 mt-1">Paste any emoji</p>
        </div>

        {/* Colour */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Accent Colour</label>
          <select value={form.color} onChange={e => setForm(p=>({...p, color: e.target.value}))} className="input-field text-sm">
            {GRADIENTS.map(g => <option key={g.val} value={g.val}>{g.label}</option>)}
          </select>
          <div className={`h-1.5 rounded-full mt-2 bg-gradient-to-r ${form.color}`} />
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Category</label>
          <select value={form.category} onChange={e => setForm(p=>({...p, category: e.target.value}))} className="input-field text-sm">
            {['learning','reference','tools','games','courses','books','packages','general'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Order */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Display Order</label>
          <input type="number" value={form.display_order} min={0}
            onChange={e => setForm(p=>({...p, display_order: parseInt(e.target.value)||0}))}
            className="input-field text-sm" />
          <p className="text-xs text-gray-400 mt-1">Lower = shown first</p>
        </div>

        {/* Published toggle */}
        <div className="flex items-center gap-3 pt-5">
          <button onClick={() => setForm(p=>({...p, is_published: !p.is_published}))}
            className={`relative w-12 h-6 rounded-full transition-all ${form.is_published ? 'bg-green-500' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.is_published ? 'left-6' : 'left-0.5'}`} />
          </button>
          <span className="text-sm font-medium text-gray-700">{form.is_published ? 'Visible on homepage' : 'Hidden'}</span>
        </div>
      </div>

      {/* Preview */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Preview</p>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 max-w-xs hover:shadow-xl transition-all">
          <div className="text-3xl mb-3">{form.emoji || '🌐'}</div>
          <div className={`h-0.5 w-8 rounded-full mb-3 bg-gradient-to-r ${form.color}`} />
          <h3 className="font-bold text-gray-900 text-sm mb-1">{form.name || 'Site name'}</h3>
          <p className="text-gray-400 text-xs leading-relaxed">{form.description || 'Description here'}</p>
          <div className="mt-3 text-xs text-gray-300 flex items-center gap-1 font-medium">
            Visit <FaExternalLinkAlt size={9} />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-600 text-sm hover:bg-gray-50 transition">
          Cancel
        </button>
        <button onClick={save} disabled={saving}
          className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm py-2.5 disabled:opacity-50">
          {saving ? <FaSpinner className="animate-spin" size={12} /> : <FaCheck size={12} />}
          {site ? 'Save Changes' : 'Add Site'}
        </button>
      </div>
    </div>
  );
};

// ── Main AdminUsefulSites ─────────────────────────────────────────────────────
const AdminUsefulSites = () => {
  const [sites, setSites]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [confirm, setConfirm]     = useState(null);
  const [search, setSearch]       = useState('');
  const [filterCat, setFilterCat] = useState('all');

  useEffect(() => { fetchSites(); }, []);

  const fetchSites = async () => {
    const { data } = await supabase.from('useful_sites').select('*').order('display_order').order('name');
    setSites(data || []);
    setLoading(false);
  };

  const togglePublished = async (site) => {
    await supabase.from('useful_sites').update({ is_published: !site.is_published }).eq('id', site.id);
    setSites(prev => prev.map(s => s.id === site.id ? { ...s, is_published: !s.is_published } : s));
    toast.success(site.is_published ? 'Hidden from homepage' : 'Now visible on homepage');
  };

  const deleteSite = (site) => {
    setConfirm({
      title: `Delete "${site.name}"?`,
      message: 'It will be removed from the homepage immediately.',
      onConfirm: async () => {
        setConfirm(null);
        await supabase.from('useful_sites').delete().eq('id', site.id);
        setSites(prev => prev.filter(s => s.id !== site.id));
        toast.success('Deleted');
      }
    });
  };

  const categories = ['all', ...new Set(sites.map(s => s.category).filter(Boolean))];

  const displayed = sites.filter(s => {
    if (filterCat !== 'all' && s.category !== filterCat) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
        !s.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Useful Sites</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage the learning resources shown on the homepage</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="btn-primary flex items-center gap-2">
          <FaPlus size={12} /> Add Site
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Sites',   val: sites.length,                        color: 'bg-gray-50  border-gray-200'  },
          { label: 'Visible',       val: sites.filter(s=>s.is_published).length, color: 'bg-green-50 border-green-200' },
          { label: 'Hidden',        val: sites.filter(s=>!s.is_published).length,color: 'bg-gray-50  border-gray-200'  },
        ].map((s,i) => (
          <div key={i} className={`rounded-xl border p-4 text-center ${s.color}`}>
            <p className="text-2xl font-black text-gray-800">{s.val}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6">
          <SiteForm
            site={editing}
            onSaved={() => { setShowForm(false); setEditing(null); fetchSites(); }}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search sites..." className="input-field max-w-xs text-sm" />
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition
                ${filterCat===c ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><FaSpinner className="animate-spin text-primary-600 text-3xl" /></div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="text-5xl mb-3">🌐</div>
          <p className="text-gray-500 font-medium mb-1">No sites yet</p>
          <p className="text-gray-400 text-sm mb-5">Add useful Python learning resources for students</p>
          <button onClick={() => { setEditing(null); setShowForm(true); }}
            className="btn-primary inline-flex items-center gap-2 text-sm">
            <FaPlus size={11} /> Add First Site
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 divide-y">
            {displayed.map(site => (
              <div key={site.id} className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition ${!site.is_published ? 'opacity-55' : ''}`}>
                {/* Colour bar */}
                <div className={`w-1.5 h-12 rounded-full bg-gradient-to-b ${site.color} flex-shrink-0`} />

                {/* Emoji */}
                <div className="text-2xl flex-shrink-0 w-10 text-center">{site.emoji || '🌐'}</div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900 text-sm">{site.name}</p>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{site.category}</span>
                    {!site.is_published && <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Hidden</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate max-w-sm">{site.description}</p>
                  <a href={site.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-600 flex items-center gap-1 mt-0.5 w-fit">
                    {site.url.replace('https://','').replace('http://','').split('/')[0]}
                    <FaExternalLinkAlt size={9} />
                  </a>
                </div>

                {/* Order */}
                <span className="text-xs text-gray-300 flex-shrink-0 font-mono">#{site.display_order}</span>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => togglePublished(site)}
                    className={`p-1.5 rounded-lg transition ${site.is_published ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                    title={site.is_published ? 'Hide from homepage' : 'Show on homepage'}>
                    {site.is_published ? <FaToggleOn size={18} /> : <FaToggleOff size={18} />}
                  </button>
                  <button onClick={() => { setEditing(site); setShowForm(true); }}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                    title="Edit">
                    <FaEdit size={14} />
                  </button>
                  <button onClick={() => deleteSite(site)}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"
                    title="Delete">
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
};

export default AdminUsefulSites;
