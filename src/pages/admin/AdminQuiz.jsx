import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import {
  FaPlus, FaTrash, FaEdit, FaPlay, FaStop, FaEye,
  FaImage, FaFont, FaCheck, FaTimes, FaSpinner,
  FaClock, FaUsers, FaTrophy, FaUpload, FaChevronDown,
  FaChevronUp, FaBolt
} from 'react-icons/fa';
import toast from 'react-hot-toast';

// ── Confirm Modal ─────────────────────────────────────────────────────────────
const ConfirmModal = ({ title, message, confirmLabel='Confirm', confirmColor='bg-red-600 hover:bg-red-700', onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm whitespace-pre-line mb-6">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">Cancel</button>
        <button onClick={onConfirm} className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium ${confirmColor}`}>{confirmLabel}</button>
      </div>
    </div>
  </div>
);

// ── Question Form ─────────────────────────────────────────────────────────────
const QuestionForm = ({ sessionId, question, onSaved, onCancel }) => {
  const [form, setForm] = useState({
    type: question?.type || 'text',
    question_text: question?.question_text || '',
    question_image_url: question?.question_image_url || '',
    option_a: question?.option_a || '',
    option_b: question?.option_b || '',
    option_c: question?.option_c || '',
    option_d: question?.option_d || '',
    correct_answer: question?.correct_answer || 'A',
    points: question?.points || 10,
    explanation: question?.explanation || '',
    order_num: question?.order_num || 1,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const uploadImage = async (file) => {
    if (!file.type.startsWith('image/')) { toast.error('Images only'); return; }
    if (file.size > 5*1024*1024) { toast.error('Max 5MB'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${sessionId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('quiz-images').upload(path, file);
    if (error) { toast.error('Upload failed'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('quiz-images').getPublicUrl(path);
    setForm(p => ({ ...p, question_image_url: publicUrl }));
    setUploading(false);
    toast.success('Image uploaded');
  };

  const save = async () => {
    if (!form.question_text.trim()) { toast.error('Question text required'); return; }
    if (!form.option_a.trim() || !form.option_b.trim()) { toast.error('At least options A and B required'); return; }
    setSaving(true);
    const payload = { ...form, session_id: sessionId, points: parseInt(form.points) };
    let error;
    if (question?.id) {
      ({ error } = await supabase.from('quiz_questions').update(payload).eq('id', question.id));
    } else {
      ({ error } = await supabase.from('quiz_questions').insert(payload));
    }
    if (error) toast.error('Save failed: ' + error.message);
    else { toast.success(question ? 'Updated' : 'Question added'); onSaved(); }
    setSaving(false);
  };

  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-gray-800">{question ? 'Edit Question' : 'New Question'}</h4>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
      </div>

      {/* Type toggle */}
      <div className="flex gap-2">
        {['text','image'].map(t => (
          <button key={t} onClick={() => setForm(p => ({...p, type: t}))}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border-2 transition
              ${form.type === t ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
            {t === 'text' ? <FaFont size={12} /> : <FaImage size={12} />}
            {t === 'text' ? 'Text Question' : 'Image Question'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">
            Question Text {form.type === 'image' ? '(caption shown above image)' : '*'}
          </label>
          <textarea value={form.question_text} onChange={e => setForm(p=>({...p, question_text: e.target.value}))}
            rows={3} placeholder="Type your question here... (use Enter for new lines, spaces for indentation)" className="input-field text-sm" />
        </div>

        {form.type === 'image' && (
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Question Image</label>
            {form.question_image_url ? (
              <div className="relative">
                <img src={form.question_image_url} alt="Question" className="w-full max-h-48 object-contain rounded-xl border bg-gray-100" />
                <button onClick={() => setForm(p=>({...p, question_image_url: ''}))}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600">
                  <FaTimes size={12} />
                </button>
              </div>
            ) : (
              <div onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 transition">
                {uploading ? <FaSpinner className="animate-spin text-primary-500 text-2xl mx-auto" />
                  : <><FaUpload className="text-gray-400 text-2xl mx-auto mb-2" /><p className="text-sm text-gray-400">Click to upload image</p></>}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} />
          </div>
        )}

        {/* Options */}
        {['A','B','C','D'].map(opt => (
          <div key={opt}>
            <label className="text-xs font-semibold mb-1 flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs text-white
                ${opt==='A'?'bg-blue-500':opt==='B'?'bg-purple-500':opt==='C'?'bg-orange-500':'bg-teal-500'}`}>{opt}</span>
              Option {opt} {opt==='A'||opt==='B' ? '*' : '(optional)'}
            </label>
            <input type="text" value={form[`option_${opt.toLowerCase()}`]}
              onChange={e => setForm(p=>({...p, [`option_${opt.toLowerCase()}`]: e.target.value}))}
              placeholder={`Option ${opt}`} className="input-field text-sm" />
          </div>
        ))}

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Correct Answer *</label>
          <select value={form.correct_answer} onChange={e => setForm(p=>({...p, correct_answer: e.target.value}))} className="input-field text-sm">
            <option value="A">A</option>
            <option value="B">B</option>
            {form.option_c && <option value="C">C</option>}
            {form.option_d && <option value="D">D</option>}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Points</label>
          <input type="number" value={form.points} onChange={e => setForm(p=>({...p, points: e.target.value}))}
            min={5} max={100} step={5} className="input-field text-sm" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Order #</label>
          <input type="number" value={form.order_num} onChange={e => setForm(p=>({...p, order_num: e.target.value}))}
            min={1} className="input-field text-sm" />
        </div>

        <div className="col-span-2">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Explanation (shown after quiz ends)</label>
          <input type="text" value={form.explanation} onChange={e => setForm(p=>({...p, explanation: e.target.value}))}
            placeholder="e.g. In Python, range() starts at 0 by default" className="input-field text-sm" />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 text-sm">Cancel</button>
        <button onClick={save} disabled={saving}
          className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm">
          {saving ? <FaSpinner className="animate-spin" size={12} /> : <FaCheck size={12} />}
          {question ? 'Update' : 'Add Question'}
        </button>
      </div>
    </div>
  );
};

// ── Session Card ──────────────────────────────────────────────────────────────
const SessionCard = ({ session, onRefresh }) => {
  const [questions, setQuestions] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingQ, setEditingQ] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    if (expanded) fetchQuestions();
  }, [expanded, session.id]);

  const fetchQuestions = async () => {
    const { data } = await supabase.from('quiz_questions').select('*')
      .eq('session_id', session.id).order('order_num');
    setQuestions(data || []);
    const { data: subs } = await supabase.from('quiz_submissions').select('user_id, points_earned, is_correct')
      .eq('session_id', session.id);
    setSubmissions(subs || []);
  };

  const startSession = async () => {
    if (questions.length === 0) { toast.error('Add at least one question first'); return; }
    const now = new Date();
    const ends = new Date(now.getTime() + session.duration_minutes * 60000);
    setLoading(true);
    const { error } = await supabase.from('quiz_sessions').update({
      status: 'active', starts_at: now.toISOString(), ends_at: ends.toISOString()
    }).eq('id', session.id);
    if (!error) { toast.success('Quiz started! Students can now join.'); onRefresh(); }
    else toast.error('Failed to start: ' + error.message);
    setLoading(false);
  };

  const endSession = async () => {
    setLoading(true);
    const { error } = await supabase.from('quiz_sessions').update({ status: 'ended' }).eq('id', session.id);
    if (!error) { toast.success('Quiz ended'); onRefresh(); }
    setLoading(false);
  };

  const deleteSession = async () => {
    setConfirmModal({
      title: 'Delete Session',
      message: `Delete "${session.title}"? All questions and submissions will be deleted.`,
      onConfirm: async () => {
        setConfirmModal(null);
        await supabase.from('quiz_sessions').delete().eq('id', session.id);
        onRefresh();
        toast.success('Session deleted');
      }
    });
  };

  const deleteQuestion = async (qId) => {
    await supabase.from('quiz_questions').delete().eq('id', qId);
    fetchQuestions();
    toast.success('Question deleted');
  };

  const statusColors = {
    scheduled: 'bg-gray-100 text-gray-600',
    active:    'bg-green-100 text-green-700 animate-pulse',
    ended:     'bg-blue-100 text-blue-700',
  };

  // Leaderboard from submissions
  const lb = Object.values(
    submissions.reduce((acc, s) => {
      if (!acc[s.user_id]) acc[s.user_id] = { points: 0, correct: 0 };
      acc[s.user_id].points += s.points_earned || 0;
      acc[s.user_id].correct += s.is_correct ? 1 : 0;
      return acc;
    }, {})
  ).sort((a,b) => b.points - a.points);

  const totalPoints = questions.reduce((s, q) => s + (q.points || 0), 0);

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Session header */}
        <div className={`h-1 ${session.status === 'active' ? 'bg-green-500' : session.status === 'ended' ? 'bg-blue-400' : 'bg-gray-300'}`} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-bold text-gray-900">{session.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColors[session.status]}`}>
                  {session.status === 'active' ? '🔴 LIVE' : session.status === 'ended' ? '✅ Ended' : '⏳ Scheduled'}
                </span>
              </div>
              {session.description && <p className="text-sm text-gray-500">{session.description}</p>}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1"><FaClock size={10} /> {session.duration_minutes} min</span>
                <span className="flex items-center gap-1"><FaUsers size={10} /> {lb.length} participants</span>
                <span className="flex items-center gap-1"><FaTrophy size={10} /> {totalPoints} total pts</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {session.status === 'scheduled' && (
                <button onClick={startSession} disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-50">
                  {loading ? <FaSpinner className="animate-spin" size={12} /> : <FaPlay size={12} />}
                  Start Quiz
                </button>
              )}
              {session.status === 'active' && (
                <button onClick={endSession} disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition">
                  <FaStop size={12} /> End Quiz
                </button>
              )}
              <button onClick={() => setExpanded(p => !p)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition">
                {expanded ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              <button onClick={deleteSession}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition">
                <FaTrash size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t border-gray-100 p-5 space-y-4">
            {/* Quick leaderboard */}
            {lb.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h4 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
                  <FaTrophy className="text-yellow-500" /> Current Leaderboard
                </h4>
                <div className="space-y-1.5">
                  {lb.slice(0,5).map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-5 text-center font-bold text-gray-500">
                        {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                      </span>
                      <span className="flex-1 text-gray-700">Student</span>
                      <span className="font-bold text-yellow-700">{entry.points} pts</span>
                      <span className="text-xs text-gray-400">{entry.correct} correct</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Questions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-800">Questions ({questions.length})</h4>
                {session.status === 'scheduled' && (
                  <button onClick={() => { setShowForm(true); setEditingQ(null); }}
                    className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-semibold">
                    <FaPlus size={11} /> Add Question
                  </button>
                )}
              </div>

              {showForm && (
                <QuestionForm
                  sessionId={session.id}
                  question={editingQ}
                  onSaved={() => { setShowForm(false); setEditingQ(null); fetchQuestions(); }}
                  onCancel={() => { setShowForm(false); setEditingQ(null); }}
                />
              )}

              <div className="space-y-2">
                {questions.map((q, i) => (
                  <div key={q.id} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {i+1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 line-clamp-2 whitespace-pre-wrap">{q.question_text}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">✓ {q.correct_answer}</span>
                        <span>{q.points} pts</span>
                        {q.type === 'image' && <span className="flex items-center gap-1"><FaImage size={9} /> has image</span>}
                      </div>
                    </div>
                    {session.status === 'scheduled' && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => { setEditingQ(q); setShowForm(true); }}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"><FaEdit size={12} /></button>
                        <button onClick={() => deleteQuestion(q.id)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"><FaTrash size={12} /></button>
                      </div>
                    )}
                  </div>
                ))}
                {questions.length === 0 && !showForm && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No questions yet. Click "Add Question" to get started.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {confirmModal && (
        <ConfirmModal {...confirmModal} confirmLabel="Delete" onCancel={() => setConfirmModal(null)} />
      )}
    </>
  );
};

// ── Main AdminQuiz ────────────────────────────────────────────────────────────
const AdminQuiz = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newSession, setNewSession] = useState({ title: '', description: '', duration_minutes: 10 });
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    const { data } = await supabase.from('quiz_sessions').select('*').order('created_at', { ascending: false });
    setSessions(data || []);
    setLoading(false);
  };

  const createSession = async () => {
    if (!newSession.title.trim()) { toast.error('Title required'); return; }
    setCreating(true);
    const { error } = await supabase.from('quiz_sessions').insert({
      ...newSession,
      duration_minutes: parseInt(newSession.duration_minutes),
      status: 'scheduled',
      created_by: user?.id,
    });
    if (!error) {
      toast.success('Quiz session created');
      setShowCreate(false);
      setNewSession({ title: '', description: '', duration_minutes: 10 });
      fetchSessions();
    } else toast.error('Failed: ' + error.message);
    setCreating(false);
  };

  const active = sessions.filter(s => s.status === 'active');
  const scheduled = sessions.filter(s => s.status === 'scheduled');
  const ended = sessions.filter(s => s.status === 'ended');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quiz Manager</h1>
          <p className="text-gray-500 text-sm">Create sessions, add questions, start live quizzes</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2">
          <FaPlus /> New Quiz Session
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Live Now', val: active.length, color: 'text-green-600 bg-green-50 border-green-200', icon: '🔴' },
          { label: 'Scheduled', val: scheduled.length, color: 'text-gray-600 bg-gray-50 border-gray-200', icon: '⏳' },
          { label: 'Completed', val: ended.length, color: 'text-blue-600 bg-blue-50 border-blue-200', icon: '✅' },
        ].map((s,i) => (
          <div key={i} className={`rounded-xl border p-4 text-center ${s.color}`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-black">{s.val}</div>
            <div className="text-xs mt-0.5 opacity-70">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
          <h3 className="font-bold text-gray-800 mb-4">New Quiz Session</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Session Title *</label>
              <input type="text" value={newSession.title}
                onChange={e => setNewSession(p=>({...p, title: e.target.value}))}
                placeholder="e.g. Week 5 Python Quiz" className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Description</label>
              <input type="text" value={newSession.description}
                onChange={e => setNewSession(p=>({...p, description: e.target.value}))}
                placeholder="e.g. Covering loops, functions and dictionaries" className="input-field" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Duration (minutes)</label>
              <select value={newSession.duration_minutes}
                onChange={e => setNewSession(p=>({...p, duration_minutes: e.target.value}))}
                className="input-field">
                {[5,10,15,20,30,45,60].map(m => <option key={m} value={m}>{m} minutes</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-600 text-sm">Cancel</button>
            <button onClick={createSession} disabled={creating}
              className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm">
              {creating ? <FaSpinner className="animate-spin" size={12} /> : <FaPlus size={12} />}
              Create Session
            </button>
          </div>
        </div>
      )}

      {/* Sessions */}
      {loading ? (
        <div className="flex justify-center py-12"><FaSpinner className="animate-spin text-primary-600 text-3xl" /></div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="text-5xl mb-3">🎯</div>
          <h3 className="font-bold text-gray-700 mb-1">No quiz sessions yet</h3>
          <p className="text-gray-400 text-sm mb-4">Create your first session to get started</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary inline-flex items-center gap-2">
            <FaPlus size={12} /> Create First Quiz
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map(s => <SessionCard key={s.id} session={s} onRefresh={fetchSessions} />)}
        </div>
      )}
    </div>
  );
};

export default AdminQuiz;