import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { isEditableTextFile } from '../utils/fileManager';
import { FaArrowLeft, FaSave, FaSpinner } from 'react-icons/fa';

const FileEditorPage = () => {
  const { fileId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState('text');

  useEffect(() => {
    const fetchFile = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('file_manager')
        .select('*')
        .eq('id', fileId)
        .eq('owner_id', user.id)
        .single();

      if (error || !data) {
        toast.error('File not found');
        navigate('/student/files');
        return;
      }

      if (!isEditableTextFile(data.name)) {
        toast.error('This file type cannot be edited online');
        navigate('/student/files');
        return;
      }

      setFile(data);
      const ext = data.name.split('.').pop()?.toLowerCase();
      if (['py'].includes(ext)) setLanguage('python');
      else if (['html'].includes(ext)) setLanguage('html');
      else if (['css'].includes(ext)) setLanguage('css');
      else if (['js','jsx','ts','tsx','json'].includes(ext)) setLanguage('javascript');
      else if (['md'].includes(ext)) setLanguage('markdown');

      try {
        const response = await fetch(data.public_url);
        const text = response.ok ? await response.text() : '';
        setContent(text);
      } catch (err) {
        setContent('');
      }
      setLoading(false);
    };

    fetchFile();
  }, [fileId, user, navigate]);

  const handleSave = async () => {
    if (!file?.storage_path) return;
    setSaving(true);
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const { error: upErr } = await supabase.storage.from('file-manager').upload(file.storage_path, blob, {
        upsert: true,
        contentType: 'text/plain;charset=utf-8',
      });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('file-manager').getPublicUrl(file.storage_path);
      const { error: dbErr } = await supabase.from('file_manager').update({
        size_bytes: blob.size,
        public_url: publicUrl,
      }).eq('id', file.id).eq('owner_id', user.id);

      if (dbErr) throw dbErr;

      toast.success(`Saved ${file.name}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const editorExtensions = useMemo(() => (language === 'python' ? [python()] : []), [language]);

  if (!user) {
    return <div className="p-8 text-center text-gray-600">Please log in to edit files.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/student/files')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="font-bold text-gray-900">{file?.name || 'Editor'}</h1>
              <p className="text-sm text-gray-500">Edit your file directly in the browser</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-gray-50">
              <option value="text">Text</option>
              <option value="python">Python</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="javascript">JavaScript</option>
              <option value="markdown">Markdown</option>
            </select>
            <button onClick={handleSave} disabled={saving || loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-60">
              {saving ? <FaSpinner className="animate-spin" /> : <FaSave />} Save
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="h-[70vh] flex items-center justify-center text-gray-500">Loading file…</div>
          ) : (
            <CodeMirror
              value={content}
              height="70vh"
              theme={oneDark}
              extensions={editorExtensions}
              onChange={(value) => setContent(value)}
              basicSetup={{ lineNumbers: true, foldGutter: true, autocompletion: true }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FileEditorPage;
