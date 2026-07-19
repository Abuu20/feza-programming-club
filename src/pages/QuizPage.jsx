import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import {
  FaTrophy, FaClock, FaCheck, FaTimes, FaFire, FaMedal,
  FaStar, FaLock, FaSpinner, FaUsers, FaBolt, FaChartBar,
  FaTimesCircle   // for close button
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
const OPTION_COLORS = {
  A: { base: 'border-blue-200   bg-blue-50   text-blue-800',   active: 'border-blue-500   bg-blue-500   text-white', correct: 'border-green-500 bg-green-500 text-white', wrong: 'border-red-400  bg-red-400  text-white' },
  B: { base: 'border-purple-200 bg-purple-50 text-purple-800', active: 'border-purple-500 bg-purple-500 text-white', correct: 'border-green-500 bg-green-500 text-white', wrong: 'border-red-400  bg-red-400  text-white' },
  C: { base: 'border-orange-200 bg-orange-50 text-orange-800', active: 'border-orange-500 bg-orange-500 text-white', correct: 'border-green-500 bg-green-500 text-white', wrong: 'border-red-400  bg-red-400  text-white' },
  D: { base: 'border-teal-200   bg-teal-50   text-teal-800',   active: 'border-teal-500   bg-teal-500   text-white', correct: 'border-green-500 bg-green-500 text-white', wrong: 'border-red-400  bg-red-400  text-white' },
};

// ── Leaderboard entry ─────────────────────────────────────────────────────────
const LeaderRow = ({ entry, rank, isMe, isNew }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500
    ${isMe ? 'bg-primary-50 border-2 border-primary-300' : 'bg-white border border-gray-100'}
    ${isNew ? 'animate-pulse' : ''}`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0
      ${rank === 0 ? 'bg-yellow-400 text-white' : rank === 1 ? 'bg-gray-400 text-white' : rank === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-600'}`}>
      {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : rank + 1}
    </div>
    <div className="flex-1 min-w-0">
      <p className={`font-bold text-sm truncate ${isMe ? 'text-primary-700' : 'text-gray-800'}`}>
        {entry.name} {isMe && <span className="text-xs font-normal text-primary-500">(you)</span>}
      </p>
      <p className="text-xs text-gray-400">{entry.correct}/{entry.total} correct</p>
    </div>
    <div className="text-right flex-shrink-0">
      <p className="font-black text-lg text-gray-900">{entry.points}</p>
      <p className="text-xs text-gray-400">pts</p>
    </div>
    {isNew && <FaBolt className="text-yellow-500 animate-bounce flex-shrink-0" size={14} />}
  </div>
);

// ── Main QuizPage ─────────────────────────────────────────────────────────────
const QuizPage = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [results, setResults] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [phase, setPhase] = useState('lobby');
  const [loading, setLoading] = useState(true);
  const [newLeaderEntry, setNewLeaderEntry] = useState(null);
  const [myScore, setMyScore] = useState({ points: 0, correct: 0 });
  const [zoomedImage, setZoomedImage] = useState(null); // NEW for zoom

  useEffect(() => {
    if (!zoomedImage) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setZoomedImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedImage]);

  const timerRef = useRef(null);
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';

  // ── Load sessions ──────────────────────────────────────────────
  useEffect(() => {
    fetchSessions();
    const ch = supabase.channel('quiz-sessions-watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_sessions' }, fetchSessions)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const fetchSessions = async () => {
    const { data } = await supabase
      .from('quiz_sessions')
      .select('*')
      .in('status', ['scheduled', 'active', 'ended'])
      .order('created_at', { ascending: false })
      .limit(10);
    setSessions(data || []);
    setLoading(false);
    const active = (data || []).find(s => s.status === 'active');
    if (active && (!activeSession || activeSession.id !== active.id)) {
      joinSession(active);
    }
  };

  // ── Join a session ─────────────────────────────────────────────
  const joinSession = async (session) => {
    setActiveSession(session);
    setAnswers({});
    setSubmitted({});
    setResults({});
    setMyScore({ points: 0, correct: 0 });

    const { data: qs } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('session_id', session.id)
      .order('order_num');
    setQuestions(qs || []);

    if (session.status === 'active') {
      setPhase('active');
      startTimer(session);
    } else if (session.status === 'ended') {
      setPhase('ended');
    } else {
      setPhase('lobby');
    }

    fetchLeaderboard(session.id);
    subscribeToLeaderboard(session.id);
  };

  // ── Timer ──────────────────────────────────────────────────────
  const startTimer = (session) => {
    if (!session.ends_at) return;
    clearInterval(timerRef.current);
    const tick = () => {
      const left = Math.max(0, Math.floor((new Date(session.ends_at) - new Date()) / 1000));
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(timerRef.current);
        setPhase('ended');
        toast.error("⏰ Time's up! Quiz ended.", { duration: 5000 });
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── Leaderboard ────────────────────────────────────────────────
  const fetchLeaderboard = async (sessionId) => {
    const { data } = await supabase
      .from('quiz_submissions')
      .select('user_id, display_name, points_earned, is_correct')
      .eq('session_id', sessionId);

    if (!data) return;
    const grouped = {};
    data.forEach(r => {
      if (!grouped[r.user_id]) grouped[r.user_id] = { name: r.display_name || 'Student', points: 0, correct: 0, total: 0 };
      grouped[r.user_id].points += r.points_earned || 0;
      grouped[r.user_id].total += 1;
      if (r.is_correct) grouped[r.user_id].correct += 1;
    });
    const sorted = Object.entries(grouped)
      .map(([uid, v]) => ({ uid, ...v }))
      .sort((a, b) => b.points - a.points);
    setLeaderboard(sorted);

    const me = sorted.find(e => e.uid === user?.id);
    if (me) setMyScore({ points: me.points, correct: me.correct });
  };

  const subscribeToLeaderboard = (sessionId) => {
    const ch = supabase.channel(`quiz-lb-${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'quiz_submissions',
        filter: `session_id=eq.${sessionId}`
      }, () => {
        fetchLeaderboard(sessionId);
        setNewLeaderEntry(Date.now());
        setTimeout(() => setNewLeaderEntry(null), 3000);
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  };

  // ── Submit answer ──────────────────────────────────────────────
  const submitAnswer = async (question, answer) => {
    if (!user) { toast.error('Please log in to participate'); return; }
    if (submitted[question.id]) return;
    if (phase !== 'active') return;

    const isCorrect = answer === question.correct_answer;
    const pointsEarned = isCorrect ? question.points : 0;

    setSubmitted(p => ({ ...p, [question.id]: true }));
    setResults(p => ({ ...p, [question.id]: { correct: isCorrect, pointsEarned, correctAnswer: question.correct_answer } }));
    setMyScore(p => ({
      points: p.points + pointsEarned,
      correct: p.correct + (isCorrect ? 1 : 0),
    }));

    const { error } = await supabase.from('quiz_submissions').insert({
      session_id: activeSession.id,
      question_id: question.id,
      user_id: user.id,
      display_name: displayName,
      selected_answer: answer,
      is_correct: isCorrect,
      points_earned: pointsEarned,
    });

    if (error && error.code !== '23505') {
      toast.error('Submit failed');
      setSubmitted(p => { const n = {...p}; delete n[question.id]; return n; });
    } else {
      if (isCorrect) {
        toast.success(`✅ Correct! +${pointsEarned} points`, { duration: 2000 });
      } else {
        toast.error(`❌ Wrong. Answer was ${question.correct_answer}`, { duration: 2000 });
      }
    }

    if (currentQ < questions.length - 1) {
      setTimeout(() => setCurrentQ(p => p + 1), 1500);
    }
  };

  const q = questions[currentQ];
  const myRank = leaderboard.findIndex(e => e.uid === user?.id);

  // ── RENDER ─────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900 flex items-center justify-center">
      <FaSpinner className="animate-spin text-white text-4xl" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900">

      {/* ── Hero header ─────────────────────────────────────────── */}
      <div className="text-center pt-10 pb-6 px-4">
        <div className="inline-flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 px-4 py-2 rounded-full text-sm font-semibold mb-4">
          <FaBolt className="animate-pulse" /> Live Quiz Arena
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
          {activeSession?.title || 'Python Quiz'}
        </h1>
        {activeSession?.description && (
          <p className="text-primary-200 text-lg max-w-xl mx-auto">{activeSession.description}</p>
        )}
      </div>

      <div className="container-custom pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Question area ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* No session */}
            {!activeSession && (
              <div className="bg-white/10 backdrop-blur rounded-3xl p-8 text-center text-white">
                <FaClock className="text-6xl mx-auto mb-4 text-primary-300 animate-pulse" />
                <h2 className="text-2xl font-bold mb-2">No Active Quiz</h2>
                <p className="text-primary-200 mb-6">Wait for your teacher to start a quiz session. The page updates automatically.</p>

                {sessions.filter(s => s.status === 'scheduled').length > 0 && (
                  <div className="space-y-2 text-left max-w-sm mx-auto">
                    <p className="text-sm text-primary-300 font-semibold mb-2">Upcoming sessions:</p>
                    {sessions.filter(s => s.status === 'scheduled').map(s => (
                      <div key={s.id} className="bg-white/10 px-4 py-3 rounded-xl flex items-center justify-between">
                        <span className="font-medium">{s.title}</span>
                        <span className="text-xs text-primary-300 bg-white/10 px-2 py-1 rounded-full">Scheduled</span>
                      </div>
                    ))}
                  </div>
                )}

                {sessions.filter(s => s.status === 'ended').length > 0 && (
                  <div className="mt-6 space-y-2 text-left max-w-sm mx-auto">
                    <p className="text-sm text-primary-300 font-semibold mb-2">Past sessions — view results:</p>
                    {sessions.filter(s => s.status === 'ended').map(s => (
                      <button key={s.id} onClick={() => joinSession(s)}
                        className="w-full bg-white/10 hover:bg-white/20 px-4 py-3 rounded-xl flex items-center justify-between transition">
                        <span className="font-medium text-white">{s.title}</span>
                        <span className="text-xs text-primary-300">View Results →</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Lobby */}
            {activeSession && phase === 'lobby' && (
              <div className="bg-white/10 backdrop-blur rounded-3xl p-8 text-center text-white">
                <div className="text-6xl mb-4 animate-bounce">⏳</div>
                <h2 className="text-2xl font-bold mb-2">Quiz Starting Soon</h2>
                <p className="text-primary-200">Your teacher will start the quiz. Stay on this page!</p>
                <div className="mt-4 text-lg font-mono text-yellow-300 animate-pulse">
                  Waiting for teacher to begin...
                </div>
              </div>
            )}

            {/* Active quiz */}
            {activeSession && phase === 'active' && q && (
              <div className="space-y-4">
                {/* Progress + Timer */}
                <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold text-lg">Q{currentQ + 1}</span>
                    <div className="flex gap-1">
                      {questions.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-all ${
                          i < currentQ ? 'bg-green-400' : i === currentQ ? 'bg-yellow-400 scale-125' : 'bg-white/30'}`} />
                      ))}
                    </div>
                    <span className="text-primary-200 text-sm">{currentQ + 1} of {questions.length}</span>
                  </div>
                  {timeLeft !== null && (
                    <div className={`flex items-center gap-2 font-mono font-bold text-xl
                      ${timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-yellow-300'}`}>
                      <FaClock size={16} />
                      {fmt(timeLeft)}
                    </div>
                  )}
                </div>

                {/* Question card */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                  {/* Question header */}
                  <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-primary-200 text-sm font-semibold">Question {currentQ + 1}</span>
                      <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                        ⭐ {q.points} points
                      </span>
                    </div>

                    {/* Question content – with zoomable image */}
                    {q.type === 'image' && q.question_image_url ? (
                      <div>
                        <p className="text-white font-semibold mb-3 text-lg">{q.question_text}</p>
                        <div className="relative">
                          <img
                            src={q.question_image_url}
                            alt="Question"
                            className="w-full rounded-2xl max-h-[70vh] object-contain bg-white/10 select-none cursor-zoom-in transition hover:brightness-110"
                            draggable={false}
                            onClick={() => setZoomedImage(q.question_image_url)}
                            onContextMenu={e => e.preventDefault()}
                            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => setZoomedImage(q.question_image_url)}
                            className="absolute top-4 right-4 inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-xs text-white font-semibold backdrop-blur transition hover:bg-black/80"
                          >
                            Zoom image
                          </button>
                        </div>
                        <p className="text-xs text-primary-300 mt-2 text-center opacity-60">
                          Tap the image or the button to open zoom view
                        </p>
                      </div>
                    ) : (
                      <p className="text-white font-bold text-xl leading-relaxed select-none"
                        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                        {q.question_text}
                      </p>
                    )}
                  </div>

                  {/* Options */}
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['A','B','C','D'].map(opt => {
                      const text = q[`option_${opt.toLowerCase()}`];
                      if (!text) return null;
                      const isSelected = answers[q.id] === opt;
                      const isSubmitted = submitted[q.id];
                      const res = results[q.id];
                      const isCorrect = res?.correctAnswer === opt;
                      const isWrong = isSelected && res && !res.correct;

                      let colorClass = OPTION_COLORS[opt].base;
                      if (isSubmitted) {
                        if (isCorrect) colorClass = OPTION_COLORS[opt].correct;
                        else if (isWrong) colorClass = OPTION_COLORS[opt].wrong;
                      } else if (isSelected) {
                        colorClass = OPTION_COLORS[opt].active;
                      }

                      return (
                        <button key={opt}
                          onClick={() => {
                            if (!isSubmitted) {
                              setAnswers(p => ({ ...p, [q.id]: opt }));
                              submitAnswer(q, opt);
                            }
                          }}
                          disabled={isSubmitted}
                          className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 text-left
                            transition-all duration-200 font-medium select-none
                            ${colorClass}
                            ${!isSubmitted ? 'hover:scale-[1.02] cursor-pointer active:scale-[0.98]' : 'cursor-default'}
                            ${isSubmitted && !isCorrect && !isSelected ? 'opacity-50' : ''}`}
                          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                          <span className="w-8 h-8 rounded-xl bg-white/30 flex items-center justify-center font-black text-sm flex-shrink-0">
                            {isSubmitted && isCorrect ? <FaCheck size={14} /> : isSubmitted && isWrong ? <FaTimes size={14} /> : opt}
                          </span>
                          <span className="text-sm leading-tight">{text}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Result feedback */}
                  {submitted[q.id] && (
                    <div className={`mx-6 mb-4 p-4 rounded-2xl flex items-center gap-3
                      ${results[q.id]?.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      {results[q.id]?.correct
                        ? <><FaCheck className="text-green-500 text-xl flex-shrink-0" />
                            <div>
                              <p className="font-bold text-green-700">Correct! +{results[q.id]?.pointsEarned} points</p>
                              {q.explanation && <p className="text-sm text-green-600 mt-0.5">{q.explanation}</p>}
                            </div></>
                        : <><FaTimes className="text-red-500 text-xl flex-shrink-0" />
                            <div>
                              <p className="font-bold text-red-700">Wrong! The answer was <strong>{results[q.id]?.correctAnswer}</strong></p>
                              {q.explanation && <p className="text-sm text-red-600 mt-0.5">{q.explanation}</p>}
                            </div></>
                      }
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="px-6 pb-6 flex items-center justify-between">
                    <button onClick={() => setCurrentQ(p => Math.max(0, p-1))} disabled={currentQ === 0}
                      className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 transition">
                      ← Previous
                    </button>
                    {currentQ < questions.length - 1 ? (
                      <button onClick={() => setCurrentQ(p => p+1)}
                        className="px-6 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition">
                        Next Question →
                      </button>
                    ) : (
                      <div className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-semibold">
                        ✅ Last question
                      </div>
                    )}
                  </div>
                </div>

                {/* My score bar */}
                <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-3 flex items-center gap-4 text-white">
                  <FaStar className="text-yellow-400" />
                  <span className="font-semibold">My Score:</span>
                  <span className="text-2xl font-black text-yellow-300">{myScore.points}</span>
                  <span className="text-primary-200">pts</span>
                  <span className="ml-auto text-primary-200 text-sm">{myScore.correct} correct</span>
                  {myRank >= 0 && (
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold
                      ${myRank === 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20'}`}>
                      #{myRank + 1}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ended / Results */}
            {activeSession && phase === 'ended' && (
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-8 text-center">
                  <div className="text-6xl mb-3">🏆</div>
                  <h2 className="text-3xl font-black text-yellow-900">Quiz Complete!</h2>
                  <p className="text-yellow-800 mt-1">{activeSession.title}</p>
                </div>
                <div className="p-6 text-center">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-primary-50 rounded-2xl p-4">
                      <p className="text-3xl font-black text-primary-700">{myScore.points}</p>
                      <p className="text-xs text-primary-500 mt-1">Total Points</p>
                    </div>
                    <div className="bg-green-50 rounded-2xl p-4">
                      <p className="text-3xl font-black text-green-700">{myScore.correct}</p>
                      <p className="text-xs text-green-500 mt-1">Correct</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <p className="text-3xl font-black text-gray-700">#{myRank >= 0 ? myRank + 1 : '—'}</p>
                      <p className="text-xs text-gray-400 mt-1">Your Rank</p>
                    </div>
                  </div>
                  {/* Answer review */}
                  {questions.length > 0 && (
                    <div className="space-y-3 text-left">
                      <h3 className="font-bold text-gray-800 mb-3">Answer Review</h3>
                      {questions.map((q, i) => {
                        const res = results[q.id];
                        return (
                          <div key={q.id} className={`p-4 rounded-xl border ${res?.correct ? 'bg-green-50 border-green-200' : res ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-bold text-gray-500 flex-shrink-0">Q{i+1}.</span>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">{q.question_text}</p>
                                {res ? (
                                  <p className={`text-xs mt-1 ${res.correct ? 'text-green-600' : 'text-red-600'}`}>
                                    {res.correct ? `✅ Correct! +${res.pointsEarned} pts` : `❌ Wrong. Answer: ${res.correctAnswer}`}
                                  </p>
                                ) : (
                                  <p className="text-xs mt-1 text-gray-400">Not answered</p>
                                )}
                                {q.explanation && (
                                  <p className="text-xs text-gray-500 mt-1 italic">{q.explanation}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Live Leaderboard ─────────────────────────── */}
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur rounded-3xl overflow-hidden sticky top-20">
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <FaTrophy className="text-yellow-200" />
                  <span className="font-black text-lg">Live Leaderboard</span>
                </div>
                <div className="flex items-center gap-1.5 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>
              </div>

              {/* Podium — top 3 */}
              {leaderboard.length >= 3 && (
                <div className="bg-gradient-to-b from-yellow-50/20 to-transparent px-4 pt-4 pb-2 flex items-end justify-center gap-2">
                  {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, i) => {
                    const medals = ['🥈','🥇','🥉'];
                    const heights = ['h-16','h-24','h-12'];
                    const colors = ['bg-gray-400','bg-yellow-400','bg-orange-400'];
                    return (
                      <div key={entry.uid} className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold text-white overflow-hidden">
                          {entry.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="text-white text-xs font-medium truncate max-w-[60px] text-center">{entry.name}</span>
                        <span className="text-yellow-300 text-xs font-bold">{entry.points}p</span>
                        <div className={`${heights[i]} w-12 ${colors[i]} rounded-t-xl flex items-center justify-center text-lg`}>
                          {medals[i]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Full list */}
              <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-white/50">
                    <FaUsers className="text-4xl mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No submissions yet</p>
                    <p className="text-xs mt-1">Be the first to answer!</p>
                  </div>
                ) : leaderboard.map((entry, rank) => (
                  <LeaderRow
                    key={entry.uid}
                    entry={entry}
                    rank={rank}
                    isMe={entry.uid === user?.id}
                    isNew={newLeaderEntry && rank < 3}
                  />
                ))}
              </div>

              {/* Stats footer */}
              {activeSession && (
                <div className="border-t border-white/10 px-4 py-3 flex items-center justify-between text-white/60 text-xs">
                  <span className="flex items-center gap-1"><FaUsers size={10} /> {leaderboard.length} participants</span>
                  <span className="flex items-center gap-1"><FaChartBar size={10} /> {questions.length} questions</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Image Zoom Modal ────────────────────────────────────── */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative w-full h-full max-w-[95vw] max-h-[95vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 z-[1000] text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-full p-2 transition"
              aria-label="Close zoom"
            >
              <FaTimesCircle size={28} />
            </button>

            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={5}
              centerOnInit
              pinch={{ step: 5 }}
              wheel={{ step: 0.2 }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="absolute left-4 top-4 z-[1000] flex items-center gap-2 rounded-full bg-black/40 p-2 backdrop-blur text-white text-xs">
                    <button
                      type="button"
                      onClick={zoomIn}
                      className="rounded-full bg-white/10 px-2 py-1 hover:bg-white/20 transition"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={zoomOut}
                      className="rounded-full bg-white/10 px-2 py-1 hover:bg-white/20 transition"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={resetTransform}
                      className="rounded-full bg-white/10 px-2 py-1 hover:bg-white/20 transition"
                    >
                      Reset
                    </button>
                  </div>
                  <TransformComponent
                    wrapperStyle={{ width: '100%', height: '100%' }}
                    contentStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <img
                      src={zoomedImage}
                      alt="Zoomed question"
                      className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl select-none"
                      draggable={false}
                      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                    />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizPage;