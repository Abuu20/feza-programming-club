import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { challengesService } from '../services/challenges';
import { submissionsService } from '../services/submissions';
import { supabase } from '../services/supabase';
import Editor from '@monaco-editor/react';
import {
  FaCode, FaTrophy, FaStar, FaFilter, FaCheck, FaTimes,
  FaClock, FaFire, FaMedal, FaLock, FaArrowLeft,
  FaChartLine, FaEye, FaEyeSlash, FaBolt, FaShieldAlt,
  FaExclamationTriangle, FaKeyboard
} from 'react-icons/fa';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

// ── Anti-AI typing analyser ──────────────────────────────────────────────────
// Tracks keystrokes. If > 50 chars appear in < 1 second it flags as a paste.
const useTypingAnalyser = () => {
  const events = useRef([]);
  const lastLen = useRef(0);

  const track = useCallback((newCode) => {
    const now = Date.now();
    const delta = newCode.length - lastLen.current;
    lastLen.current = newCode.length;
    if (delta > 0) events.current.push({ time: now, chars: delta });
    // keep only last 30 events
    if (events.current.length > 30) events.current.shift();
  }, []);

  const check = useCallback(() => {
    // Find any window where > 60 chars appeared within 800ms
    for (let i = 1; i < events.current.length; i++) {
      const window = events.current.slice(Math.max(0, i - 5), i + 1);
      const totalChars = window.reduce((a, e) => a + e.chars, 0);
      const timeSpan = window[window.length - 1].time - window[0].time;
      if (totalChars > 60 && timeSpan < 800) return true; // suspicious
    }
    return false;
  }, []);

  const reset = useCallback(() => {
    events.current = [];
    lastLen.current = 0;
  }, []);

  return { track, check, reset };
};

// ── Difficulty colours ────────────────────────────────────────────────────────
const DIFF_COLOUR = {
  easy:   'text-green-700  bg-green-100  border-green-200',
  medium: 'text-yellow-700 bg-yellow-100 border-yellow-200',
  hard:   'text-orange-700 bg-orange-100 border-orange-200',
  expert: 'text-red-700    bg-red-100    border-red-200',
};
const DIFF_ICON = { easy: '🌱', medium: '🌿', hard: '🌳', expert: '🔥' };

// ── Realtime leaderboard row ─────────────────────────────────────────────────
const LeaderRow = ({ entry, rank, isNew }) => (
  <div className={`flex items-center gap-4 p-4 transition-all duration-500
    ${isNew ? 'bg-yellow-50 animate-pulse' : 'hover:bg-gray-50'}
    ${rank < 3 ? 'bg-gradient-to-r from-yellow-50/60 to-transparent' : ''}`}>
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0
      ${rank === 0 ? 'bg-yellow-400 text-white' :
        rank === 1 ? 'bg-gray-400 text-white' :
        rank === 2 ? 'bg-orange-500 text-white' :
        'bg-gray-200 text-gray-700'}`}>
      {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : rank + 1}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-gray-900 truncate">{entry.name || `Student ${rank + 1}`}</p>
      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
        <span className="flex items-center gap-1"><FaCheck className="text-green-500" />{entry.solved} solved</span>
        <span className="flex items-center gap-1"><FaStar className="text-yellow-500" />{entry.points} pts</span>
      </div>
    </div>
    {isNew && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full animate-bounce">+pts!</span>}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const ChallengesPage = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [newEntryId, setNewEntryId] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [filters, setFilters] = useState({ difficulty: 'all', category: 'all', search: '' });
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState(null);
  const [previousSubmissions, setPreviousSubmissions] = useState([]);
  const [challengeStats, setChallengeStats] = useState(null);
  const [activeTab, setActiveTab] = useState('challenges');
  const [solvedChallenges, setSolvedChallenges] = useState(new Set());
  // Timer
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);
  // Anti-AI
  const { track, check: checkPaste, reset: resetTracker } = useTypingAnalyser();
  const [pasteWarning, setPasteWarning] = useState(false);
  const [pasteCount, setPasteCount] = useState(0);
  // Pre-check modal
  const [showPreCheck, setShowPreCheck] = useState(false);
  const [preCheckAnswer, setPreCheckAnswer] = useState('');
  const [preCheckQuestion, setPreCheckQuestion] = useState(null);
  // Hints visibility
  const [showHints, setShowHints] = useState(false);

  // ── Load data ──────────────────────────────────────────────
  useEffect(() => {
    fetchChallenges();
    fetchLeaderboard();
    fetchCategories();
    if (user) fetchUserStats();
  }, [user]);

  // ── Realtime leaderboard subscription ─────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-realtime')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'challenge_submissions',
        filter: 'status=eq.correct'
      }, () => {
        fetchLeaderboard(true);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // ── Timer countdown ────────────────────────────────────────
  useEffect(() => {
    if (timerActive && timeLeft !== null) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerActive(false);
            toast.error("⏰ Time's up! Challenge ended.", { duration: 5000 });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  const fetchChallenges = async () => {
    setLoading(true);
    const { data } = await challengesService.getAll({});
    setChallenges(data || []);
    setCategories([...new Set((data || []).map(c => c.category).filter(Boolean))]);
    setLoading(false);
  };

  const fetchLeaderboard = async (isUpdate = false) => {
    // Use left join (members) so students appear even if not in members table
    const { data, error } = await supabase
      .from('challenge_submissions')
      .select('user_id, points_earned, members(name, photo_url)')
      .eq('status', 'correct');

    if (error) { console.error('Leaderboard error:', error); return; }
    if (!data) return;

    const grouped = {};
    data.forEach(row => {
      const uid = row.user_id;
      if (!uid) return;
      if (!grouped[uid]) {
        grouped[uid] = {
          uid,
          name: row.members?.name || null,
          photo: row.members?.photo_url || null,
          points: 0,
          solved: 0,
        };
      }
      grouped[uid].points += row.points_earned || 0;
      grouped[uid].solved += 1;
    });

    const sorted = Object.values(grouped)
      .sort((a, b) => b.points - a.points)
      .slice(0, 20);

    if (isUpdate && sorted[0]?.uid !== leaderboard[0]?.uid) {
      setNewEntryId(sorted[0]?.uid);
      setTimeout(() => setNewEntryId(null), 4000);
    }
    setLeaderboard(sorted);
  };

  const fetchCategories = async () => {
    const { data } = await challengesService.getCategories?.() || { data: [] };
    if (data?.length) setCategories(data);
  };

  const fetchUserStats = async () => {
    const { data } = await submissionsService.getUserStats(user.id);
    setUserStats(data);
  };

  const fetchPreviousSubmissions = async () => {
    if (!user || !selectedChallenge) return;
    const { data } = await submissionsService.getUserSubmissions(selectedChallenge.id, user.id);
    setPreviousSubmissions(data || []);
  };

  const fetchChallengeStats = async () => {
    if (!selectedChallenge) return;
    const { data } = await submissionsService.getChallengeStats(selectedChallenge.id);
    setChallengeStats(data);
  };

  // ── Generate a quick pre-check question from the challenge ─
  const generatePreCheck = (challenge) => {
    const questions = [
      { q: `What is the name of the function you need to write for this challenge?`, a: 'solve' },
      { q: `What language are you using to solve this challenge?`, a: 'python' },
      { q: `In Python, what keyword do you use to define a function?`, a: 'def' },
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  };

  // ── Select a challenge ─────────────────────────────────────
  const handleSelectChallenge = (challenge) => {
    setSelectedChallenge(challenge);
    setCode(challenge.starter_code || '# Write your solution here\n\ndef solve(input_data):\n    # Your code here\n    return input_data\n');
    setResults(null);
    setShowHints(false);
    setPasteWarning(false);
    setPasteCount(0);
    resetTracker();
    fetchPreviousSubmissions();
    fetchChallengeStats();

    // Start timer for hard/expert challenges
    if (challenge.difficulty === 'hard' || challenge.difficulty === 'expert') {
      const mins = challenge.difficulty === 'expert' ? 45 : 30;
      setTimeLeft(mins * 60);
      setTimerActive(true);
      toast(`⏱ Timer started: ${mins} minutes`, { icon: '⏰', duration: 3000 });
    } else {
      setTimeLeft(null);
      setTimerActive(false);
    }
  };

  // ── Anti-AI: handle code changes ───────────────────────────
  const handleCodeChange = (value) => {
    setCode(value || '');
    track(value || '');
    if (checkPaste()) {
      setPasteWarning(true);
      setPasteCount(p => p + 1);
    }
  };

  // ── Submit: show pre-check first ──────────────────────────
  const handleSubmitClick = () => {
    if (!user) { toast.error('Please login to submit'); return; }
    if (timeLeft === 0) { toast.error("Time's up — you cannot submit."); return; }

    if (pasteCount >= 2) {
      toast.error('⚠️ Multiple paste events detected. Your submission has been flagged.', { duration: 6000 });
    }

    // Show pre-check question
    const q = generatePreCheck(selectedChallenge);
    setPreCheckQuestion(q);
    setPreCheckAnswer('');
    setShowPreCheck(true);
  };

  const handlePreCheckConfirm = async () => {
    if (preCheckAnswer.trim().toLowerCase() !== preCheckQuestion.a.toLowerCase()) {
      toast.error('Incorrect. Try again — make sure you understand what you wrote!');
      return;
    }
    setShowPreCheck(false);
    await doSubmit();
  };

  const doSubmit = async () => {
    setSubmitting(true);
    setResults(null);
    try {
      const result = await submissionsService.submit(
        selectedChallenge.id, user.id, code,
        { flagged: pasteCount >= 2, pasteCount }
      );
      if (result.success) {
        setResults(result.validation);
        if (result.passed) {
          toast.success('🏆 Correct! You earned points!', { duration: 5000 });
          setSolvedChallenges(prev => new Set([...prev, selectedChallenge.id]));
          setTimerActive(false);
          await Promise.all([fetchLeaderboard(), fetchUserStats(), fetchPreviousSubmissions(), fetchChallengeStats()]);
        } else {
          toast.error('❌ Not quite right. Keep trying!', { duration: 4000 });
        }
      } else {
        toast.error(result.error || 'Submission failed');
        setResults(result.validation);
      }
    } catch (err) {
      toast.error('An error occurred during submission');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredChallenges = challenges.filter(c => {
    if (filters.difficulty !== 'all' && c.difficulty !== filters.difficulty) return false;
    if (filters.category !== 'all' && c.category !== filters.category) return false;
    if (filters.search && !c.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (loading && challenges.length === 0) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-500 text-white py-10">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <FaTrophy className="text-yellow-400" /> Coding Challenges
              </h1>
              <p className="text-primary-100 text-lg">Test your Python skills, earn points, and climb the leaderboard</p>
            </div>
            {user && userStats && (
              <div className="flex items-center gap-4 bg-white bg-opacity-15 px-5 py-3 rounded-xl">
                <div className="text-center">
                  <div className="text-2xl font-bold">{userStats.total_points || 0}</div>
                  <div className="text-xs text-primary-100">Your Points</div>
                </div>
                <div className="w-px h-10 bg-white bg-opacity-30" />
                <div className="text-center">
                  <div className="text-2xl font-bold">{userStats.challenges_solved || 0}</div>
                  <div className="text-xs text-primary-100">Solved</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container-custom py-6">

        {/* Tab Navigation */}
        <div className="flex border-b mb-6 overflow-x-auto bg-white rounded-t-xl shadow-sm px-4">
          {[
            { key: 'challenges', label: 'Challenges', icon: FaCode },
            { key: 'leaderboard', label: 'Leaderboard', icon: FaTrophy },
            ...(user ? [{ key: 'stats', label: 'My Stats', icon: FaChartLine }] : []),
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-4 font-medium flex items-center gap-2 whitespace-nowrap border-b-2 transition
                ${activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <tab.icon size={14} /> {tab.label}
              {tab.key === 'leaderboard' && (
                <span className="ml-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live" />
              )}
            </button>
          ))}
        </div>

        {/* ── CHALLENGES TAB ────────────────────────────────── */}
        {activeTab === 'challenges' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Sidebar — filters + list */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-4">
              {/* Filters */}
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-700">
                  <FaFilter className="text-primary-500" /> Filter Challenges
                </h3>
                <div className="space-y-3">
                  <select value={filters.difficulty}
                    onChange={e => setFilters(p => ({...p, difficulty: e.target.value}))}
                    className="input-field text-sm">
                    <option value="all">All Difficulties</option>
                    <option value="easy">🌱 Easy</option>
                    <option value="medium">🌿 Medium</option>
                    <option value="hard">🌳 Hard</option>
                    <option value="expert">🔥 Expert</option>
                  </select>
                  {categories.length > 0 && (
                    <select value={filters.category}
                      onChange={e => setFilters(p => ({...p, category: e.target.value}))}
                      className="input-field text-sm">
                      <option value="all">All Categories</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                  <input type="text" value={filters.search}
                    onChange={e => setFilters(p => ({...p, search: e.target.value}))}
                    placeholder="Search…" className="input-field text-sm" />
                </div>
              </div>

              {/* Challenge list */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-3 bg-gray-50 border-b">
                  <p className="text-sm text-gray-600 font-medium">{filteredChallenges.length} challenges</p>
                </div>
                <div className="divide-y max-h-[60vh] overflow-y-auto">
                  {filteredChallenges.map(ch => {
                    const isSolved = solvedChallenges.has(ch.id);
                    return (
                      <button key={ch.id} onClick={() => handleSelectChallenge(ch)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition relative
                          ${selectedChallenge?.id === ch.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''}`}>
                        {isSolved && (
                          <span className="absolute top-3 right-3 bg-green-100 text-green-600 p-1 rounded-full">
                            <FaCheck size={10} />
                          </span>
                        )}
                        <div className="flex items-start gap-3">
                          <span className="text-xl flex-shrink-0 mt-0.5">{DIFF_ICON[ch.difficulty] || '📝'}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm truncate">{ch.title}</h4>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ch.description}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${DIFF_COLOUR[ch.difficulty] || ''}`}>
                                {ch.difficulty}
                              </span>
                              <span className="flex items-center gap-1 text-yellow-600 text-xs">
                                <FaStar size={10} /> {ch.points} pts
                              </span>
                              {(ch.difficulty === 'hard' || ch.difficulty === 'expert') && (
                                <span className="flex items-center gap-1 text-red-500 text-xs">
                                  <FaClock size={10} /> Timed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {filteredChallenges.length === 0 && (
                    <div className="p-8 text-center text-gray-500 text-sm">No challenges match your filters</div>
                  )}
                </div>
              </div>
            </div>

            {/* Main editor panel */}
            <div className="lg:col-span-8 xl:col-span-9">
              {selectedChallenge ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                  {/* Challenge header */}
                  <div className="border-b p-6 bg-gray-50">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h2 className="text-2xl font-bold text-gray-900">{selectedChallenge.title}</h2>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${DIFF_COLOUR[selectedChallenge.difficulty]}`}>
                          {DIFF_ICON[selectedChallenge.difficulty]} {selectedChallenge.difficulty}
                        </span>
                        <span className="flex items-center gap-1 text-yellow-600 font-bold text-sm bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                          <FaStar size={12} /> {selectedChallenge.points} pts
                        </span>
                      </div>
                    </div>

                    {/* Timer bar */}
                    {timeLeft !== null && (
                      <div className={`flex items-center gap-2 mb-4 px-4 py-2 rounded-lg font-mono font-bold text-lg
                        ${timeLeft < 300 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-primary-100 text-primary-700'}`}>
                        <FaClock />
                        {formatTime(timeLeft)}
                        <span className="text-xs font-normal ml-2 opacity-70">
                          {timeLeft < 300 ? '⚠️ Less than 5 minutes!' : 'Time remaining'}
                        </span>
                      </div>
                    )}

                    {/* Paste warning */}
                    {pasteWarning && (
                      <div className="flex items-start gap-2 mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                        <FaExclamationTriangle className="text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-orange-700">Large paste detected</p>
                          <p className="text-orange-600 text-xs mt-0.5">
                            We noticed code appeared very quickly. Make sure this is your own work — write the code yourself to learn effectively!
                          </p>
                        </div>
                      </div>
                    )}

                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedChallenge.description}</p>

                    {/* Challenge stats */}
                    {challengeStats && (
                      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        {[
                          { label: 'Submissions', val: challengeStats.total_submissions },
                          { label: 'Success Rate', val: `${challengeStats.success_rate?.toFixed(1) || 0}%` },
                          { label: 'Points', val: selectedChallenge.points },
                        ].map((s, i) => (
                          <div key={i} className="bg-white p-3 rounded-lg border text-center">
                            <p className="text-gray-500 text-xs">{s.label}</p>
                            <p className="font-bold text-gray-900">{s.val}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Hints */}
                    {selectedChallenge.hints?.length > 0 && (
                      <div className="mt-4">
                        <button onClick={() => setShowHints(!showHints)}
                          className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-lg hover:bg-yellow-100 transition">
                          {showHints ? <FaEyeSlash /> : <FaEye />}
                          {showHints ? 'Hide hints' : `Show hints (${selectedChallenge.hints.length})`}
                        </button>
                        {showHints && (
                          <ul className="mt-3 space-y-2">
                            {selectedChallenge.hints.map((hint, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-yellow-800 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                <span>💡</span> {hint}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Monaco editor */}
                  <div className="border-b">
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-400 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="ml-3 font-mono">solution.py</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaKeyboard size={11} />
                        <span>Python 3 • Write your own code</span>
                        {pasteCount > 0 && (
                          <span className="text-orange-400 flex items-center gap-1">
                            <FaShieldAlt size={10} /> {pasteCount} paste{pasteCount > 1 ? 's' : ''} detected
                          </span>
                        )}
                      </div>
                    </div>
                    <Editor
                      height="380px"
                      defaultLanguage="python"
                      theme="vs-dark"
                      value={code}
                      onChange={handleCodeChange}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        suggestOnTriggerCharacters: true,
                        formatOnPaste: true,
                        formatOnType: true,
                        tabSize: 4,
                        insertSpaces: true,
                      }}
                    />
                  </div>

                  {/* Test Results */}
                  {results && (
                    <div className="border-b p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          {results.passed
                            ? <span className="text-green-600 flex items-center gap-2"><FaCheck /> All Tests Passed!</span>
                            : <span className="text-red-600 flex items-center gap-2"><FaTimes /> Test Results</span>}
                        </h3>
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {results.passedCount || 0} / {results.totalTests || 0} passed
                        </span>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {results.results?.map((test, i) => (
                          <div key={i} className={`p-3 rounded-lg text-sm border
                            ${test.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-start gap-2">
                              {test.passed ? <FaCheck className="text-green-500 mt-0.5 flex-shrink-0" /> : <FaTimes className="text-red-500 mt-0.5 flex-shrink-0" />}
                              <div className="flex-1">
                                <p className="font-medium mb-1">Test Case {test.test || i + 1}</p>
                                {test.error ? (
                                  <p className="text-red-600 text-xs font-mono bg-red-100 p-2 rounded whitespace-pre-wrap">
                                    {test.error}
                                  </p>
                                ) : (
                                  <div className="space-y-1 text-xs font-mono">
                                    <p>Expected: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{test.expected}</code></p>
                                    <p>Got: <code className={`px-1.5 py-0.5 rounded ${test.passed ? 'bg-green-100' : 'bg-red-100'}`}>{test.got}</code></p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {results.passed && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl flex items-center gap-3">
                          <FaTrophy className="text-yellow-300 text-2xl" />
                          <div>
                            <p className="font-bold">Challenge Solved! 🎉</p>
                            <p className="text-sm opacity-90">+{results.points || selectedChallenge.points} points added to your score</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Previous Submissions */}
                  {previousSubmissions.length > 0 && (
                    <div className="border-b p-4 bg-gray-50">
                      <details>
                        <summary className="font-medium cursor-pointer text-sm flex items-center gap-2">
                          <FaChartLine className="text-primary-500" />
                          Previous Attempts ({previousSubmissions.length})
                        </summary>
                        <div className="mt-3 space-y-2">
                          {previousSubmissions.map((sub, i) => (
                            <div key={i} className={`p-3 rounded-lg text-sm flex justify-between items-center border
                              ${sub.status === 'correct' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                              <div className="flex items-center gap-2">
                                {sub.status === 'correct' ? <FaCheck className="text-green-500" /> : <FaTimes className="text-red-400" />}
                                <span>Attempt #{sub.attempt_number}</span>
                                {sub.flagged && <span className="text-xs text-orange-500 bg-orange-100 px-2 py-0.5 rounded">⚠️ flagged</span>}
                              </div>
                              <span className="text-xs text-gray-500">{new Date(sub.submitted_at).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}

                  {/* Submit bar */}
                  <div className="p-4 flex flex-wrap gap-3 items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FaShieldAlt className="text-primary-500" />
                      Academic integrity check enabled
                    </div>
                    <button onClick={handleSubmitClick} disabled={submitting || timeLeft === 0}
                      className="btn-primary px-8 py-3 text-base flex items-center gap-2 disabled:opacity-50">
                      {submitting
                        ? <><span className="animate-spin">⚡</span> Running tests...</>
                        : <><FaBolt /> Submit Solution</>}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a Challenge</h3>
                  <p className="text-gray-500">Choose a challenge from the list to start coding</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── LEADERBOARD TAB ──────────────────────────────── */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-b flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FaTrophy className="text-yellow-500" /> Global Leaderboard
                </h2>
                <p className="text-gray-600 text-sm mt-1">Updates in real-time as students submit solutions</p>
              </div>
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Live
              </div>
            </div>

            {/* Top 3 podium */}
            {leaderboard.length >= 3 && (
              <div className="flex items-end justify-center gap-4 p-8 bg-gradient-to-b from-gray-50 to-white border-b">
                {[leaderboard[1], leaderboard[0], leaderboard[2]].map((s, i) => {
                  const rank = [1, 0, 2][i];
                  const heights = ['h-24', 'h-32', 'h-20'];
                  const medals = ['🥈', '🥇', '🥉'];
                  const bgs = ['bg-gray-200', 'bg-yellow-400', 'bg-orange-400'];
                  return (
                    <div key={s.uid} className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-xl font-bold overflow-hidden">
                        {s.photo ? <img src={s.photo} alt={s.name} className="w-full h-full object-cover" /> : (s.name?.[0] || '?')}
                      </div>
                      <p className="text-sm font-semibold text-gray-800 max-w-[80px] truncate text-center">{s.name || 'Student'}</p>
                      <p className="text-xs text-gray-500">{s.points} pts</p>
                      <div className={`${heights[i]} w-20 ${bgs[i]} rounded-t-lg flex items-center justify-center text-2xl`}>
                        {medals[i]}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="divide-y">
              {leaderboard.length > 0 ? leaderboard.map((entry, rank) => (
                <LeaderRow key={entry.uid} entry={entry} rank={rank} isNew={newEntryId === entry.uid} />
              )) : (
                <div className="p-12 text-center text-gray-500">
                  <FaTrophy className="text-4xl text-gray-300 mx-auto mb-3" />
                  <p>No submissions yet. Be the first to solve a challenge!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STATS TAB ────────────────────────────────────── */}
        {activeTab === 'stats' && user && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
                <FaChartLine className="text-primary-600" /> Your Progress
              </h2>
              {userStats ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl">
                    <p className="text-sm opacity-90">Total Points</p>
                    <p className="text-4xl font-bold">{userStats.total_points || 0}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Solved', val: userStats.challenges_solved || 0, color: 'bg-green-50 text-green-700 border-green-100' },
                      { label: 'Attempted', val: userStats.challenges_attempted || 0, color: 'bg-blue-50 text-blue-700 border-blue-100' },
                      { label: 'Success %', val: `${userStats.success_rate || 0}%`, color: 'bg-purple-50 text-purple-700 border-purple-100' },
                    ].map((s, i) => (
                      <div key={i} className={`p-3 rounded-xl border text-center ${s.color}`}>
                        <p className="text-2xl font-bold">{s.val}</p>
                        <p className="text-xs mt-0.5 opacity-80">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No stats yet — start solving!</p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
                <FaFire className="text-orange-500" /> Achievements
              </h2>
              <div className="space-y-3">
                {[
                  { emoji: '🎯', title: 'First Steps', desc: 'Solve your first challenge', target: 1, field: 'challenges_solved' },
                  { emoji: '⭐', title: 'Rising Star', desc: 'Solve 10 challenges', target: 10, field: 'challenges_solved' },
                  { emoji: '🔥', title: 'On Fire', desc: 'Solve 25 challenges', target: 25, field: 'challenges_solved' },
                  { emoji: '🏆', title: 'Challenge Master', desc: 'Solve 50 challenges', target: 50, field: 'challenges_solved' },
                  { emoji: '💎', title: 'Point Collector', desc: 'Earn 1000 points', target: 1000, field: 'total_points' },
                ].map((a, i) => {
                  const current = userStats?.[a.field] || 0;
                  const done = current >= a.target;
                  const pct = Math.min(100, Math.round((current / a.target) * 100));
                  return (
                    <div key={i} className={`p-3 rounded-xl border flex items-center gap-3 transition
                      ${done ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                      <span className="text-2xl">{a.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">{a.title}</p>
                          {done
                            ? <span className="text-green-600 text-xs font-bold flex items-center gap-1"><FaCheck size={10} /> Earned</span>
                            : <span className="text-gray-400 text-xs">{current}/{a.target}</span>}
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{a.desc}</p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full transition-all ${done ? 'bg-green-500' : 'bg-primary-500'}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Pre-check modal ─────────────────────────────────── */}
      {showPreCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <FaShieldAlt className="text-primary-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Quick Check</h3>
                <p className="text-xs text-gray-500">Confirm you understand your solution</p>
              </div>
            </div>
            <p className="text-gray-700 mb-4 text-sm leading-relaxed">{preCheckQuestion?.q}</p>
            <input type="text" value={preCheckAnswer}
              onChange={e => setPreCheckAnswer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePreCheckConfirm()}
              placeholder="Type your answer..."
              autoFocus
              className="input-field mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowPreCheck(false)}
                className="flex-1 px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 transition text-sm">
                Cancel
              </button>
              <button onClick={handlePreCheckConfirm}
                className="flex-1 btn-primary text-sm">
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengesPage;