import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import {
  FaFolder, FaFolderOpen, FaFile, FaFilePdf, FaFileImage,
  FaFileCode, FaFileArchive, FaFileAlt, FaUpload, FaPlus,
  FaTrash, FaDownload, FaShare, FaSearch, FaHome, FaChevronRight,
  FaEye, FaTimes, FaEdit, FaSpinner, FaCopy, FaUsers, FaUser,
  FaClock, FaHdd, FaInbox, FaCheck, FaExternalLinkAlt, FaLock
} from 'react-icons/fa';

// ── File type helpers ─────────────────────────────────────────────────────────
const getFileType = (name = '') => {
  const ext = name.split('.').pop().toLowerCase();
  if (['pdf'].includes(ext))                          return 'pdf';
  if (['png','jpg','jpeg','gif','webp','svg'].includes(ext)) return 'image';
  if (['py','js','jsx','ts','tsx','html','css','json','txt','md'].includes(ext)) return 'code';
  if (['zip','rar','7z','tar','gz'].includes(ext))    return 'archive';
  if (['mp4','mov','avi','mkv'].includes(ext))        return 'video';
  if (['mp3','wav','ogg'].includes(ext))              return 'audio';
  if (['doc','docx'].includes(ext))                   return 'word';
  if (['xls','xlsx'].includes(ext))                   return 'excel';
  if (['ppt','pptx'].includes(ext))                   return 'ppt';
  return 'file';
};

const FILE_ICONS = {
  pdf:     { icon: FaFilePdf,    color: 'text-red-500',    bg: 'bg-red-50'    },
  image:   { icon: FaFileImage,  color: 'text-purple-500', bg: 'bg-purple-50' },
  code:    { icon: FaFileCode,   color: 'text-green-500',  bg: 'bg-green-50'  },
  archive: { icon: FaFileArchive,color: 'text-yellow-600', bg: 'bg-yellow-50' },
  video:   { icon: FaFile,       color: 'text-blue-500',   bg: 'bg-blue-50'   },
  audio:   { icon: FaFile,       color: 'text-pink-500',   bg: 'bg-pink-50'   },
  word:    { icon: FaFileAlt,    color: 'text-blue-700',   bg: 'bg-blue-50'   },
  excel:   { icon: FaFileAlt,    color: 'text-green-700',  bg: 'bg-green-50'  },
  ppt:     { icon: FaFileAlt,    color: 'text-orange-600', bg: 'bg-orange-50' },
  file:    { icon: FaFile,       color: 'text-gray-500',   bg: 'bg-gray-50'   },
};

const FileIcon = ({ name, size = 20, className = '' }) => {
  const type = getFileType(name);
  const cfg  = FILE_ICONS[type] || FILE_ICONS.file;
  const Icon = cfg.icon;
  return <Icon size={size} className={`${cfg.color} ${className}`} />;
};

const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024*1024)  return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1024/1024).toFixed(1)} MB`;
};

const formatDate = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  const diff = Date.now() - d.getTime();
  if (diff < 60000)      return 'Just now';
  if (diff < 3600000)    return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000)   return `${Math.floor(diff/3600000)}h ago`;
  if (diff < 604800000)  return `${Math.floor(diff/86400000)}d ago`;
  return d.toLocaleDateString();
};

// Folder paths are database keys, so keep one canonical representation everywhere.
const normalizeFolderPath = (path = '/') => {
  const clean = String(path).trim().replace(/\/+/g, '/');
  if (!clean || clean === '/') return '/';
  return `/${clean.replace(/^\/+|\/+$/g, '')}/`;
};

const childFolderPath = (parentPath, name) =>
  normalizeFolderPath(`${normalizeFolderPath(parentPath)}${name}`);

// Older rows can be incomplete. Keep one bad database row from taking down the
// entire file-manager view in production.
const normalizeFileRecord = (file) => {
  if (!file) return null;
  return {
    ...file,
    name: typeof file.name === 'string' && file.name.trim() ? file.name : 'Untitled item',
    folder_path: normalizeFolderPath(file.folder_path),
  };
};

// ── Confirm Modal ─────────────────────────────────────────────────────────────
const ConfirmModal = ({ title, message, confirmLabel='Delete', confirmColor='bg-red-600 hover:bg-red-700', onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-5 whitespace-pre-line">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={onConfirm} className={`flex-1 py-2 rounded-xl text-sm text-white font-medium ${confirmColor}`}>{confirmLabel}</button>
      </div>
    </div>
  </div>
);

// ── File Preview Modal ────────────────────────────────────────────────────────
const PreviewModal = ({ file, onClose }) => {
  const type = getFileType(file.name);
  const fileUrl = file.access_url || file.public_url;
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900 flex-shrink-0">
        <div className="flex items-center gap-3 text-white">
          <FileIcon name={file.name} size={18} />
          <span className="font-semibold">{file.name}</span>
          <span className="text-gray-400 text-sm">{formatSize(file.size_bytes)}</span>
        </div>
        <div className="flex items-center gap-3">
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" download={file.name}
            className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition">
            <FaDownload size={13} /> Download
          </a>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1"><FaTimes size={18} /></button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        {type === 'image' && (
          <img src={fileUrl} alt={file.name}
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
        )}
        {type === 'pdf' && (
          <iframe src={fileUrl} title={file.name}
            className="w-full h-full rounded-xl" style={{ minHeight: '80vh' }} />
        )}
        {type === 'code' && fileUrl && (
          <div className="bg-gray-950 text-green-300 rounded-2xl p-6 max-w-3xl w-full max-h-full overflow-auto font-mono text-sm">
            <p className="text-gray-500 mb-3 text-xs">— {file.name} —</p>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer"
              className="text-primary-400 underline">Open in new tab to view code</a>
          </div>
        )}
        {!['image','pdf','code'].includes(type) && (
          <div className="text-center text-white">
            <FileIcon name={file.name} size={64} className="mx-auto mb-4 opacity-60" />
            <p className="text-lg font-semibold mb-1">{file.name}</p>
            <p className="text-gray-400 mb-6">{formatSize(file.size_bytes)}</p>
            <a href={fileUrl} download={file.name}
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition font-semibold">
              <FaDownload /> Download File
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// ── New Folder Modal ──────────────────────────────────────────────────────────
const NewFolderModal = ({ onConfirm, onCancel }) => {
  const [name, setName] = useState('');
  const ref = useRef(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FaFolder className="text-yellow-500" /> New Folder
        </h3>
        <input ref={ref} type="text" value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && onConfirm(name.trim())}
          placeholder="Folder name..." className="input-field mb-4" />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 border border-gray-300 rounded-xl text-sm text-gray-600">Cancel</button>
          <button onClick={() => name.trim() && onConfirm(name.trim())}
            className="flex-1 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Share Modal (admin only) ──────────────────────────────────────────────────
const ShareModal = ({ file, onShare, onCancel }) => {
  const [shareType, setShareType] = useState('all'); // 'all' | 'individual'
  const [members, setMembers]     = useState([]);
  const [selected, setSelected]   = useState([]);
  const [message, setMessage]     = useState('');
  const [sharing, setSharing]     = useState(false);

  useEffect(() => {
    supabase.from('members').select('user_id, name, email, photo_url').eq('status','active')
      .then(({ data }) => setMembers(data || []));
  }, []);

  const toggleMember = (uid) => setSelected(p => p.includes(uid) ? p.filter(i=>i!==uid) : [...p, uid]);

  const submit = async () => {
    setSharing(true);
    await onShare(file, shareType === 'all' ? null : selected, message);
    setSharing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <FaShare className="text-primary-500" /> Share File
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 mb-4">
          <FileIcon name={file.name} size={20} />
          <div>
            <p className="font-semibold text-sm text-gray-800">{file.name}</p>
            <p className="text-xs text-gray-400">{formatSize(file.size_bytes)}</p>
          </div>
        </div>

        {/* Share to */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Share to</label>
          <div className="flex gap-2">
            <button onClick={() => setShareType('all')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition
                ${shareType==='all' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              <FaUsers size={13} /> All Students
            </button>
            <button onClick={() => setShareType('individual')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition
                ${shareType==='individual' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              <FaUser size={13} /> Specific Students
            </button>
          </div>
        </div>

        {shareType === 'individual' && (
          <div className="mb-4 max-h-48 overflow-y-auto border border-gray-200 rounded-xl">
            {members.map(m => (
              <div key={m.user_id}
                onClick={() => toggleMember(m.user_id)}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition
                  ${selected.includes(m.user_id) ? 'bg-primary-50' : ''}`}>
                {m.photo_url ? <img src={m.photo_url} alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                  : <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">{m.name?.[0]}</div>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                  <p className="text-xs text-gray-400 truncate">{m.email}</p>
                </div>
                {selected.includes(m.user_id) && <FaCheck className="text-primary-600 flex-shrink-0" size={14} />}
              </div>
            ))}
          </div>
        )}

        <div className="mb-5">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Message (optional)</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2}
            placeholder="e.g. Study materials for this week's lesson"
            className="input-field text-sm resize-none" />
        </div>

        <button onClick={submit}
          disabled={sharing || (shareType==='individual' && selected.length===0)}
          className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50">
          {sharing ? <FaSpinner className="animate-spin" size={14} /> : <FaShare size={14} />}
          {shareType==='all' ? 'Share with All Students' : `Share with ${selected.length} student${selected.length!==1?'s':''}`}
        </button>
      </div>
    </div>
  );
};

// ── Main FileManagerPage ──────────────────────────────────────────────────────
const FileManagerPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.email === 'fezaclub@gmail.com';

  const [files, setFiles]           = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [sharedContext, setSharedContext] = useState(null);
  const [currentPath, setCurrentPath] = useState('/');
  const [view, setView]             = useState('my'); // 'my' | 'shared' | 'recent'
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [search, setSearch]         = useState('');
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [previewFile, setPreviewFile] = useState(null);
  const [shareFile, setShareFile]   = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [renaming, setRenaming]     = useState(null);
  const [renameVal, setRenameVal]   = useState('');
  const [dragOver, setDragOver]     = useState(false);
  const [unreadShares, setUnreadShares] = useState(0);
  const [viewMode, setViewMode]     = useState('grid'); // 'grid' | 'list'

  const fileInputRef = useRef(null);

  // ── Load files ─────────────────────────────────────────────────
  useEffect(() => {
    if (user) { fetchFiles(); fetchSharedFiles(); subscribeToShares(); }
  }, [user, currentPath, sharedContext?.path]);

  const fetchFiles = async () => {
    setLoading(true);
    const queryPath = normalizeFolderPath(currentPath);
    const { data, error } = await supabase
      .from('file_manager')
      .select('*')
      .eq('owner_id', user.id)
      .eq('folder_path', queryPath)
      .order('is_folder', { ascending: false })
      .order('name');
    if (error) console.error('fetchFiles error:', error.message, 'path:', queryPath);
    setFiles((data || []).map(normalizeFileRecord));
    setLoading(false);
  };

  const withAccessUrl = async (file) => {
    if (!file?.storage_path) return file;
    try {
      const { data: signed } = await supabase.storage
        .from('file-manager').createSignedUrl(file.storage_path, 86400);
      if (signed?.signedUrl) return { ...file, access_url: signed.signedUrl };
    } catch {}
    return { ...file, access_url: file.public_url };
  };

  const fetchSharedFiles = async () => {
    // Once a shared folder is opened, load its direct children rather than the
    // flat list of shares.  The RLS policy in the migration permits descendants.
    if (sharedContext) {
      const { data, error } = await supabase
        .from('file_manager')
        .select('*')
        .eq('owner_id', sharedContext.root.owner_id)
        .eq('folder_path', sharedContext.path)
        .order('is_folder', { ascending: false })
        .order('name');
      if (error) console.error('fetchSharedFolder error:', error.message, 'path:', sharedContext.path);
      const enriched = await Promise.all((data || []).map(withAccessUrl));
      setSharedFiles(enriched.map(file => ({
        id: `folder-${file.id}`, file_manager: normalizeFileRecord(file), is_read: true, shared_at: file.updated_at, isFolderChild: true,
      })));
      return;
    }

    const { data } = await supabase
      .from('file_shares')
      .select('*, file_manager(*)')
      .or(`shared_to.eq.${user.id},shared_to.is.null`)
      .order('shared_at', { ascending: false });
    if (!data) { setSharedFiles([]); setUnreadShares(0); return; }
    // Generate signed URLs so students can access files uploaded by admin
    const enriched = await Promise.all(data.map(async (share) => ({
      ...share, file_manager: normalizeFileRecord(await withAccessUrl(share.file_manager)),
    })));
    setSharedFiles(enriched);
    setUnreadShares(enriched.filter(s => !s.is_read).length);
  };

  const subscribeToShares = () => {
    const ch = supabase.channel(`shares-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'file_shares',
        filter: `shared_to=eq.${user.id}` }, () => {
        fetchSharedFiles();
        toast('📁 New file shared with you!', { icon: '📨' });
      }).subscribe();
    return () => supabase.removeChannel(ch);
  };

  // ── Upload files ────────────────────────────────────────────────
  const uploadFiles = async (fileList) => {
    if (!user) { toast.error('Please log in'); return; }
    const files = Array.from(fileList);
    if (!files.length) return;

    const invalidFiles = files.filter((f) => {
      const isVideo = f.type.startsWith('video/');
      const isImage = f.type.startsWith('image/');
      return isVideo || (isImage && f.size > 1 * 1024 * 1024);
    });

    if (invalidFiles.length > 0) {
      const message = invalidFiles.map((f) => {
        if (f.type.startsWith('video/')) return `${f.name} is a video and cannot be uploaded`;
        return `${f.name} is an image larger than 1MB`;
      }).join('; ');
      toast.error(message);
      return;
    }

    // Check 50MB limit per file
    for (const f of files) {
      if (f.size > 50*1024*1024) { toast.error(`${f.name} is too large (max 50MB)`); return; }
    }

    setUploading(true);
    let done = 0;
    const toastId = toast.loading(`Uploading ${files.length} file(s)...`);

    for (const file of files) {
      try {
        const ext  = file.name.split('.').pop();
        const safeName = file.name.replace(/[^a-zA-Z0-9._\-() ]/g, '_');
        const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from('file-manager').upload(storagePath, file);
        if (upErr) throw upErr;

        const { data: { publicUrl } } = supabase.storage
          .from('file-manager').getPublicUrl(storagePath);

        const { error: dbErr } = await supabase.from('file_manager').insert({
          owner_id: user.id,
          name: safeName,
          folder_path: normalizeFolderPath(currentPath),
          file_type: getFileType(file.name),
          size_bytes: file.size,
          storage_path: storagePath,
          public_url: publicUrl,
          is_folder: false,
        });

        if (dbErr && dbErr.code === '23505') {
          // File already exists — update it
          await supabase.from('file_manager').update({
            size_bytes: file.size, storage_path: storagePath, public_url: publicUrl
          }).eq('owner_id', user.id).eq('folder_path', normalizeFolderPath(currentPath)).eq('name', safeName);
        } else if (dbErr) throw dbErr;

        done++;
        setUploadProgress(Math.round((done / files.length) * 100));
      } catch (err) {
        toast.error(`Failed: ${file.name}`);
        console.error(err);
      }
    }

    toast.dismiss(toastId);
    toast.success(`${done} of ${files.length} file(s) uploaded!`);
    setUploading(false);
    setUploadProgress(0);
    fetchFiles();
  };

  // ── Create folder ───────────────────────────────────────────────
  const createFolder = async (name) => {
    setShowNewFolder(false);
    if (!name || name === '.' || name === '..' || /[\\/]/.test(name)) {
      toast.error('Folder names cannot contain slashes');
      return;
    }
    const { error } = await supabase.from('file_manager').insert({
      owner_id: user.id,
      name,
      folder_path: normalizeFolderPath(currentPath),
      file_type: 'folder',
      is_folder: true,
    });
    if (error && error.code === '23505') { toast.error('A folder with that name already exists'); return; }
    if (error) { toast.error('Failed to create folder'); return; }
    toast.success(`Folder "${name}" created`);
    fetchFiles();
  };

  // ── Navigate into folder ────────────────────────────────────────
  const openFolder = (folder) => {
    // Ignore a second click on a card from the previous folder while the
    // next folder's query is still loading.
    if (normalizeFolderPath(folder.folder_path) !== normalizeFolderPath(currentPath)) return;
    const newPath = childFolderPath(currentPath, folder.name);
    setCurrentPath(newPath);
    setSelectedFiles(new Set());
    setSearch('');
  };

  const openSharedFolder = (folder) => {
    const root = sharedContext?.root || folder;
    setSharedContext({ root, path: childFolderPath(folder.folder_path, folder.name) });
    setSearch('');
  };

  const leaveSharedFolder = () => {
    const pathParts = normalizeFolderPath(sharedContext.path).split('/').filter(Boolean);
    const rootParts = childFolderPath(sharedContext.root.folder_path, sharedContext.root.name).split('/').filter(Boolean);
    if (pathParts.length <= rootParts.length) setSharedContext(null);
    else setSharedContext(context => ({ ...context, path: normalizeFolderPath(pathParts.slice(0, -1).join('/')) }));
    setSearch('');
  };

  // ── Breadcrumb navigation ───────────────────────────────────────
  const getBreadcrumbs = () => {
    const parts = normalizeFolderPath(currentPath).split('/').filter(Boolean);
    const crumbs = [{ label: 'My Files', path: '/' }];
    let built = '/';
    parts.forEach(p => { built += p + '/'; crumbs.push({ label: p, path: built }); });
    return crumbs;
  };

  // ── Delete file/folder ──────────────────────────────────────────
  const deleteFile = (file) => {
    setConfirmModal({
      title: `Delete ${file.is_folder ? 'Folder' : 'File'}`,
      message: `Delete "${file.name}"?${file.is_folder ? '\nAll files inside will also be deleted.' : ''}\nThis cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(null);
        if (!file.is_folder && file.storage_path) {
          await supabase.storage.from('file-manager').remove([file.storage_path]);
        }
        await supabase.from('file_manager').delete().eq('id', file.id);
        setFiles(prev => prev.filter(f => f.id !== file.id));
        toast.success('Deleted');
      }
    });
  };

  // ── Delete selected ─────────────────────────────────────────────
  const deleteSelected = () => {
    const count = selectedFiles.size;
    setConfirmModal({
      title: `Delete ${count} items`,
      message: `Delete ${count} selected file${count>1?'s':''}? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(null);
        const toDelete = files.filter(f => selectedFiles.has(f.id));
        const storagePaths = toDelete.filter(f=>f.storage_path).map(f=>f.storage_path);
        if (storagePaths.length) await supabase.storage.from('file-manager').remove(storagePaths);
        await supabase.from('file_manager').delete().in('id', [...selectedFiles]);
        setSelectedFiles(new Set());
        fetchFiles();
        toast.success(`${count} items deleted`);
      }
    });
  };

  // ── Rename ──────────────────────────────────────────────────────
  const confirmRename = async (file) => {
    const newName = renameVal.trim();
    if (!newName || newName === file.name) { setRenaming(null); return; }
    const { error } = await supabase.from('file_manager').update({ name: newName }).eq('id', file.id);
    if (!error) {
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, name: newName } : f));
      toast.success('Renamed');
    }
    setRenaming(null);
  };

  // ── Share file (admin) ──────────────────────────────────────────
  const shareFileToStudents = async (file, recipients, message) => {
    setShareFile(null);
    const toastId = toast.loading('Sharing...');
    try {
      // Mark file as admin-shared
      await supabase.from('file_manager').update({ is_shared_by_admin: true }).eq('id', file.id);

      if (recipients === null) {
        // Share to all
        await supabase.from('file_shares').insert({
          file_id: file.id, shared_by: user.id, shared_to: null, message
        });
      } else {
        // Share to specific students
        const inserts = recipients.map(uid => ({
          file_id: file.id, shared_by: user.id, shared_to: uid, message
        }));
        await supabase.from('file_shares').insert(inserts);
      }
      toast.dismiss(toastId);
      toast.success(recipients === null ? 'Shared with all students!' : `Shared with ${recipients.length} student(s)!`);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Share failed: ' + err.message);
    }
  };

  // ── Mark shared files as read ───────────────────────────────────
  const markSharesRead = async () => {
    await supabase.from('file_shares')
      .update({ is_read: true })
      .or(`shared_to.eq.${user.id},shared_to.is.null`)
      .eq('is_read', false);
    setUnreadShares(0);
  };

  // ── Toggle select ───────────────────────────────────────────────
  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedFiles(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Drag & drop ─────────────────────────────────────────────────
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  };

  // ── Storage usage ───────────────────────────────────────────────
  const totalStorage = files.reduce((s, f) => s + (f.size_bytes || 0), 0);
  const MAX_STORAGE  = 100 * 1024 * 1024; // 100MB per student
  const storagePercent = Math.min(100, (totalStorage / MAX_STORAGE) * 100);

  // ── Filtered display ────────────────────────────────────────────
  const displayFiles = files.filter(f =>
    !search || f.name.toLowerCase().includes(search.toLowerCase())
  );

  const recentFiles = [...files].sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0,8);

  if (!user) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <FaLock className="text-5xl text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Login Required</h2>
        <p className="text-gray-500">Please log in to access your files.</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <div className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-black text-gray-900 text-lg flex items-center gap-2">
            <FaHdd className="text-primary-500" /> Files
          </h2>
        </div>

        <nav className="p-3 space-y-1 flex-1">
          {[
            { key: 'my',     icon: FaFolder,  label: 'My Files',      badge: null },
            { key: 'shared', icon: FaInbox,   label: 'Shared with me', badge: unreadShares || null },
            { key: 'recent', icon: FaClock,   label: 'Recent',         badge: null },
          ].map(item => (
            <button key={item.key}
              onClick={() => { setView(item.key); if (item.key==='shared') markSharesRead(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition
                ${view === item.key ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <item.icon size={15} className={view===item.key ? 'text-primary-500' : 'text-gray-400'} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Storage usage */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>Storage</span>
            <span>{formatSize(totalStorage)} / 100 MB</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`h-2 rounded-full transition-all ${storagePercent > 80 ? 'bg-red-500' : 'bg-primary-500'}`}
              style={{ width: `${storagePercent}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{(100 - storagePercent).toFixed(0)}% free</p>
        </div>
      </div>

      {/* ── Main area ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden"
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}>

        {/* Drag overlay */}
        {dragOver && (
          <div className="absolute inset-0 z-30 bg-primary-600/20 border-4 border-dashed border-primary-400 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
              <FaUpload className="text-5xl text-primary-500 mx-auto mb-3" />
              <p className="text-xl font-bold text-primary-700">Drop files here to upload</p>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-200 flex-shrink-0">
          {/* Breadcrumb */}
          {view === 'my' && (
            <div className="flex items-center gap-1 text-sm flex-1 min-w-0 overflow-x-auto no-scrollbar">
              {getBreadcrumbs().map((crumb, i, arr) => (
                <React.Fragment key={crumb.path}>
                  <button onClick={() => setCurrentPath(crumb.path)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg transition whitespace-nowrap
                      ${i === arr.length-1 ? 'text-gray-900 font-semibold bg-gray-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                    {i === 0 && <FaHome size={12} />}
                    {crumb.label}
                  </button>
                  {i < arr.length-1 && <FaChevronRight size={10} className="text-gray-300 flex-shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          )}

          {view !== 'my' && (
            <div className="font-bold text-gray-900 flex-1 flex items-center gap-2 min-w-0">
              {view === 'shared' && sharedContext && (
                <button onClick={leaveSharedFolder} className="text-sm text-primary-600 hover:text-primary-700 whitespace-nowrap">← Back</button>
              )}
              <h2 className="truncate">
                {view === 'shared'
                  ? (sharedContext ? `📁 ${sharedContext.path.split('/').filter(Boolean).slice(-1)[0]}` : '📨 Shared with me')
                  : '🕐 Recent Files'}
              </h2>
            </div>
          )}

          {/* Search */}
          <div className="relative flex-shrink-0">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search files..." className="pl-7 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 w-44" />
          </div>

          {/* View mode */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {['grid','list'].map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${viewMode===m ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>
                {m === 'grid' ? '⊞' : '≡'}
              </button>
            ))}
          </div>

          {/* Actions */}
          {view === 'my' && (
            <>
              {selectedFiles.size > 0 && (
                <button onClick={deleteSelected}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition">
                  <FaTrash size={12} /> Delete ({selectedFiles.size})
                </button>
              )}
              <button onClick={() => setShowNewFolder(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
                <FaPlus size={11} /> Folder
              </button>
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition cursor-pointer">
                {uploading ? <FaSpinner className="animate-spin" size={12} /> : <FaUpload size={12} />}
                Upload
                <input type="file" multiple className="hidden" ref={fileInputRef}
                  onChange={e => e.target.files.length && uploadFiles(e.target.files)} />
              </label>
            </>
          )}
        </div>

        {/* Upload progress */}
        {uploading && (
          <div className="px-5 py-2 bg-primary-50 border-b border-primary-100 flex items-center gap-3">
            <div className="flex-1 bg-primary-200 rounded-full h-2">
              <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
            <span className="text-xs text-primary-700 font-medium flex-shrink-0">{uploadProgress}%</span>
          </div>
        )}

        {/* File grid/list */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* MY FILES */}
          {view === 'my' && (
            loading ? (
              <div className="flex items-center justify-center h-40">
                <FaSpinner className="animate-spin text-primary-500 text-3xl" />
              </div>
            ) : displayFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="font-bold text-gray-700 mb-1">
                  {search ? 'No files match your search' : 'This folder is empty'}
                </h3>
                <p className="text-gray-400 text-sm mb-5">
                  {search ? 'Try a different search term' : 'Upload files or create a folder to get started'}
                </p>
                {!search && (
                  <label className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl cursor-pointer hover:bg-primary-700 transition font-semibold text-sm">
                    <FaUpload size={13} /> Upload Files
                    <input type="file" multiple className="hidden" onChange={e => uploadFiles(e.target.files)} />
                  </label>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {displayFiles.map(file => (
                  <FileGridCard key={file.id} file={file} selected={selectedFiles.has(file.id)}
                    onSelect={toggleSelect} onOpen={() => file.is_folder ? openFolder(file) : setPreviewFile(file)}
                    onDelete={() => deleteFile(file)} onShare={() => setShareFile(file)}
                    onRename={() => { setRenaming(file.id); setRenameVal(file.name.replace(/\.py$/,'')); }}
                    isAdmin={isAdmin} renaming={renaming===file.id} renameVal={renameVal}
                    setRenameVal={setRenameVal} onRenameConfirm={() => confirmRename(file)}
                    onRenameCancel={() => setRenaming(null)} />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {displayFiles.map(file => (
                  <FileListRow key={file.id} file={file} selected={selectedFiles.has(file.id)}
                    onSelect={toggleSelect} onOpen={() => file.is_folder ? openFolder(file) : setPreviewFile(file)}
                    onDelete={() => deleteFile(file)} onShare={() => setShareFile(file)}
                    onRename={() => { setRenaming(file.id); setRenameVal(file.name); }}
                    isAdmin={isAdmin} renaming={renaming===file.id} renameVal={renameVal}
                    setRenameVal={setRenameVal} onRenameConfirm={() => confirmRename(file)}
                    onRenameCancel={() => setRenaming(null)} />
                ))}
              </div>
            )
          )}

          {/* SHARED WITH ME */}
          {view === 'shared' && (
            sharedFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-6xl mb-4">📨</div>
                <h3 className="font-bold text-gray-700 mb-1">No shared files yet</h3>
                <p className="text-gray-400 text-sm">Files shared by your teacher will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sharedFiles.map(share => {
                  const file = share.file_manager;
                  if (!file) return null;
                  return (
                    <div key={share.id}
                      className={`bg-white rounded-2xl border p-4 flex items-center gap-4 hover:shadow-md transition cursor-pointer
                        ${!share.is_read ? 'border-primary-300 bg-primary-50/30' : 'border-gray-200'}`}
                      onClick={() => file.is_folder ? openSharedFolder(file) : setPreviewFile(file)}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${FILE_ICONS[getFileType(file.name)]?.bg || 'bg-gray-50'}`}>
                        <FileIcon name={file.name} size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 truncate">{file.name}</p>
                          {!share.is_read && <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">New</span>}
                        </div>
                        {share.message && <p className="text-sm text-gray-600 mt-0.5 truncate">"{share.message}"</p>}
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>{share.isFolderChild ? 'Inside shared folder' : 'Shared by Teacher'}</span>
                          <span>{formatDate(share.shared_at)}</span>
                          <span>{formatSize(file.size_bytes)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {!file.is_folder && <a href={file.access_url || file.public_url} download={file.name}
                          onClick={e => e.stopPropagation()}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition">
                          <FaDownload size={14} />
                        </a>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* RECENT */}
          {view === 'recent' && (
            recentFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-6xl mb-4">🕐</div>
                <h3 className="font-bold text-gray-700 mb-1">No recent files</h3>
                <p className="text-gray-400 text-sm">Your recently accessed files will appear here</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentFiles.map(file => (
                  <FileListRow key={file.id} file={file} selected={false}
                    onSelect={() => {}} onOpen={() => file.is_folder ? openFolder(file) : setPreviewFile(file)}
                    onDelete={() => deleteFile(file)} onShare={() => setShareFile(file)}
                    onRename={() => {}} isAdmin={isAdmin}
                    renaming={false} renameVal="" setRenameVal={() => {}}
                    onRenameConfirm={() => {}} onRenameCancel={() => {}} />
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────── */}
      {previewFile && <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
      {showNewFolder && <NewFolderModal onConfirm={createFolder} onCancel={() => setShowNewFolder(false)} />}
      {confirmModal && <ConfirmModal {...confirmModal} onCancel={() => setConfirmModal(null)} />}
      {shareFile && <ShareModal file={shareFile} onShare={shareFileToStudents} onCancel={() => setShareFile(null)} />}
    </div>
  );
};

// ── Grid card ─────────────────────────────────────────────────────────────────
const FileGridCard = ({ file, selected, onSelect, onOpen, onDelete, onShare, onRename, isAdmin, renaming, renameVal, setRenameVal, onRenameConfirm, onRenameCancel }) => {
  const type = getFileType(file.name);
  const cfg  = FILE_ICONS[type] || FILE_ICONS.file;
  return (
    <div
      className={`group relative rounded-2xl border-2 p-3 cursor-pointer transition-all duration-150 bg-white
        ${selected ? 'border-primary-400 bg-primary-50' : 'border-gray-100 hover:border-gray-300 hover:shadow-md'}`}
      onClick={onOpen}>
      {/* Checkbox */}
      <div className={`absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
        ${selected ? 'bg-primary-500 border-primary-500 opacity-100' : 'border-gray-300 opacity-0 group-hover:opacity-100 bg-white'}`}
        onClick={e => onSelect(file.id, e)}>
        {selected && <FaCheck size={9} className="text-white" />}
      </div>

      {/* Thumbnail or icon */}
      <div className="flex items-center justify-center h-16 mb-2">
        {type === 'image' && file.public_url ? (
          <img src={file.public_url} alt={file.name}
            className="h-16 w-full object-cover rounded-xl" />
        ) : file.is_folder ? (
          <FaFolderOpen size={40} className="text-yellow-500" />
        ) : (
          <div className={`w-12 h-12 rounded-xl ${cfg.bg} flex items-center justify-center`}>
            <FileIcon name={file.name} size={24} />
          </div>
        )}
      </div>

      {/* Name */}
      {renaming ? (
        <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
          onBlur={onRenameConfirm}
          onKeyDown={e => { if(e.key==='Enter') onRenameConfirm(); if(e.key==='Escape') onRenameCancel(); e.stopPropagation(); }}
          onClick={e => e.stopPropagation()}
          className="w-full text-xs text-center bg-white border border-primary-400 rounded px-1 py-0.5 outline-none" />
      ) : (
        <p className="text-xs font-medium text-gray-800 text-center truncate leading-tight">{file.name}</p>
      )}
      <p className="text-xs text-gray-400 text-center mt-0.5">{formatSize(file.size_bytes)}</p>

      {/* Hover actions */}
      <div className="absolute top-2 right-2 hidden group-hover:flex flex-col gap-1" onClick={e => e.stopPropagation()}>
        {!file.is_folder && (
          <a href={file.public_url} download={file.name}
            className="p-1.5 bg-white rounded-lg shadow text-gray-500 hover:text-primary-600 transition">
            <FaDownload size={11} />
          </a>
        )}
        {isAdmin && (
          <button onClick={onShare} className="p-1.5 bg-white rounded-lg shadow text-gray-500 hover:text-green-600 transition">
            <FaShare size={11} />
          </button>
        )}
        <button onClick={onRename} className="p-1.5 bg-white rounded-lg shadow text-gray-500 hover:text-blue-600 transition">
          <FaEdit size={11} />
        </button>
        <button onClick={onDelete} className="p-1.5 bg-white rounded-lg shadow text-gray-500 hover:text-red-500 transition">
          <FaTrash size={11} />
        </button>
      </div>
    </div>
  );
};

// ── List row ──────────────────────────────────────────────────────────────────
const FileListRow = ({ file, selected, onSelect, onOpen, onDelete, onShare, onRename, isAdmin, renaming, renameVal, setRenameVal, onRenameConfirm, onRenameCancel }) => (
  <div
    className={`group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all
      ${selected ? 'bg-primary-50 border border-primary-200' : 'bg-white border border-transparent hover:bg-gray-50 hover:border-gray-200'}`}
    onClick={onOpen}>
    {/* Checkbox */}
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
      ${selected ? 'bg-primary-500 border-primary-500' : 'border-gray-300 opacity-0 group-hover:opacity-100'}`}
      onClick={e => onSelect(file.id, e)}>
      {selected && <FaCheck size={9} className="text-white" />}
    </div>

    {/* Icon */}
    <div className="flex-shrink-0">
      {file.is_folder ? <FaFolderOpen size={20} className="text-yellow-500" />
        : <FileIcon name={file.name} size={18} />}
    </div>

    {/* Name */}
    {renaming ? (
      <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
        onBlur={onRenameConfirm}
        onKeyDown={e => { if(e.key==='Enter') onRenameConfirm(); if(e.key==='Escape') onRenameCancel(); e.stopPropagation(); }}
        onClick={e => e.stopPropagation()}
        className="flex-1 text-sm bg-white border border-primary-400 rounded px-2 py-0.5 outline-none" />
    ) : (
      <span className="flex-1 text-sm font-medium text-gray-800 truncate">{file.name}</span>
    )}

    {/* Meta */}
    <span className="text-xs text-gray-400 hidden sm:block flex-shrink-0">{formatSize(file.size_bytes)}</span>
    <span className="text-xs text-gray-400 hidden md:block flex-shrink-0">{formatDate(file.updated_at)}</span>

    {/* Actions */}
    <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
      {!file.is_folder && (
        <a href={file.public_url} download={file.name}
          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition">
          <FaDownload size={13} />
        </a>
      )}
      {isAdmin && (
        <button onClick={onShare} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition">
          <FaShare size={13} />
        </button>
      )}
      <button onClick={onRename} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
        <FaEdit size={13} />
      </button>
      <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
        <FaTrash size={13} />
      </button>
    </div>
  </div>
);

export default FileManagerPage;
