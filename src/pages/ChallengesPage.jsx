import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { challengesService } from '../services/challenges';
import { submissionsService } from '../services/submissions';
import Editor from '@monaco-editor/react';
import {
  FaCode,
  FaTrophy,
  FaStar,
  FaFilter,
  FaCheck,
  FaTimes,
  FaClock,
  FaUsers,
  FaChartLine,
  FaMedal,
  FaFire,
  FaLock,
  FaUnlock,
  FaArrowLeft,
  FaArrowRight
} from 'react-icons/fa';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const ChallengesPage = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [filters, setFilters] = useState({
    difficulty: 'all',
    category: 'all',
    search: ''
  });
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState(null);
  const [previousSubmissions, setPreviousSubmissions] = useState([]);
  const [challengeStats, setChallengeStats] = useState(null);
  const [activeTab, setActiveTab] = useState('challenges');
  const [solvedChallenges, setSolvedChallenges] = useState(new Set());

  useEffect(() => {
    fetchChallenges();
    fetchLeaderboard();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChallenge && user) {
      fetchPreviousSubmissions();
      fetchChallengeStats();
      checkIfSolved();
      setCode(selectedChallenge.starter_code || '# Write your solution here\n\ndef solve(input_data):\n    # Your code here\n    return input_data\n');
      setResults(null);
    }
  }, [selectedChallenge, user]);

  const fetchChallenges = async () => {
    setLoading(true);
    const { data } = await challengesService.getAll(filters);
    setChallenges(data || []);
    setLoading(false);
  };

  const fetchLeaderboard = async () => {
    const { data } = await submissionsService.getLeaderboard(20);
    setLeaderboard(data || []);
  };

  const fetchCategories = async () => {
    const { data } = await challengesService.getCategories();
    setCategories(data || []);
  };

  const fetchUserStats = async () => {
    if (!user) return;
    console.log('Fetching user stats for:', user.id);
    const { data } = await submissionsService.getUserStats(user.id);
    console.log('User stats received:', data);
    setUserStats(data);
    
    // Create set of solved challenges
    if (data && data.challenges_solved) {
      // In a real app, you'd fetch the actual solved challenge IDs
      // For now, we'll use the data we have
    }
  };

  const fetchPreviousSubmissions = async () => {
    if (!user || !selectedChallenge) return;
    const { data } = await submissionsService.getUserSubmissions(
      selectedChallenge.id,
      user.id
    );
    setPreviousSubmissions(data || []);
  };

  const fetchChallengeStats = async () => {
    if (!selectedChallenge) return;
    const { data } = await submissionsService.getChallengeStats(selectedChallenge.id);
    setChallengeStats(data);
  };

  const checkIfSolved = async () => {
    if (!user || !selectedChallenge) return;
    const { solved } = await submissionsService.hasUserSolved(
      selectedChallenge.id,
      user.id
    );
    if (solved) {
      setSolvedChallenges(prev => new Set([...prev, selectedChallenge.id]));
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please login to submit solutions');
      return;
    }

    if (!selectedChallenge) {
      toast.error('Please select a challenge');
      return;
    }

    setSubmitting(true);
    setResults(null);

    try {
      const result = await submissionsService.submit(
        selectedChallenge.id,
        user.id,
        code
      );

      console.log('Submission result:', result);

      if (result.success) {
        setResults(result.validation);
        
        if (result.passed) {
          toast.success('✅ Correct! Well done!', {
            duration: 5000,
            icon: '🏆'
          });
          // Refresh data
          await Promise.all([
            fetchLeaderboard(),
            fetchUserStats(),
            fetchPreviousSubmissions(),
            fetchChallengeStats()
          ]);
          // Mark as solved
          setSolvedChallenges(prev => new Set([...prev, selectedChallenge.id]));
        } else {
          toast.error('❌ Not quite right. Keep trying!', {
            duration: 4000
          });
        }
      } else {
        toast.error(result.error || 'Submission failed');
        setResults(result.validation);
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('An error occurred during submission');
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'easy': return 'text-green-600 bg-green-100 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'hard': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'expert': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch(difficulty) {
      case 'easy': return '🌱';
      case 'medium': return '🌿';
      case 'hard': return '🌳';
      case 'expert': return '🔥';
      default: return '📝';
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const applyFilters = () => {
    fetchChallenges();
  };

  const filteredChallenges = challenges.filter(challenge => {
    if (filters.difficulty !== 'all' && challenge.difficulty !== filters.difficulty) return false;
    if (filters.category !== 'all' && challenge.category !== filters.category) return false;
    if (filters.search && !challenge.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  if (loading && challenges.length === 0) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-12">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
            <FaCode className="text-3xl" />
            Coding Challenges
          </h1>
          <p className="text-xl opacity-90 max-w-2xl">
            Test your skills, earn points, and climb the leaderboard
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Tab Navigation */}
        <div className="flex border-b mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('challenges')}
            className={`px-6 py-3 font-medium flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'challenges'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaCode />
            Challenges
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-3 font-medium flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'leaderboard'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaTrophy />
            Leaderboard
          </button>
          {user && (
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-3 font-medium flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'stats'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaChartLine />
              My Stats
            </button>
          )}
        </div>

        {activeTab === 'challenges' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Challenges List Sidebar */}
            <div className="lg:col-span-1">
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FaFilter className="text-primary-600" />
                  Filters
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={filters.difficulty}
                      onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                      className="input-field text-sm"
                    >
                      <option value="all">All Difficulties</option>
                      <option value="easy">Easy 🌱</option>
                      <option value="medium">Medium 🌿</option>
                      <option value="hard">Hard 🌳</option>
                      <option value="expert">Expert 🔥</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="input-field text-sm"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search
                    </label>
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search challenges..."
                      className="input-field text-sm"
                    />
                  </div>

                  <button
                    onClick={applyFilters}
                    className="w-full btn-primary text-sm"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>

              {/* Challenges List */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                  {filteredChallenges.length > 0 ? (
                    filteredChallenges.map((challenge) => {
                      const isSolved = solvedChallenges.has(challenge.id);
                      
                      return (
                        <div
                          key={challenge.id}
                          onClick={() => setSelectedChallenge(challenge)}
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition relative ${
                            selectedChallenge?.id === challenge.id
                              ? 'bg-primary-50 border-l-4 border-primary-600'
                              : ''
                          }`}
                        >
                          {isSolved && (
                            <div className="absolute top-2 right-2">
                              <span className="bg-green-100 text-green-600 p-1 rounded-full">
                                <FaCheck size={12} />
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{getDifficultyIcon(challenge.difficulty)}</span>
                            <div className="flex-1">
                              <h4 className="font-semibold">{challenge.title}</h4>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {challenge.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(challenge.difficulty)}`}>
                                  {challenge.difficulty}
                                </span>
                                {challenge.category && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                    {challenge.category}
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-yellow-600 text-xs">
                                  <FaStar />
                                  {challenge.points} pts
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <FaUsers />
                                  {challenge.completed_count || 0} solved
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      No challenges found
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Code Editor Area */}
            <div className="lg:col-span-2">
              {selectedChallenge ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Challenge Header */}
                  <div className="border-b p-6 bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-2xl font-bold">{selectedChallenge.title}</h2>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(selectedChallenge.difficulty)}`}>
                        {selectedChallenge.difficulty}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 whitespace-pre-wrap mb-4">
                      {selectedChallenge.description}
                    </p>

                    {selectedChallenge.hints && selectedChallenge.hints.length > 0 && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <details>
                          <summary className="font-medium text-yellow-700 cursor-pointer">
                            Need a hint? (Click to reveal)
                          </summary>
                          <ul className="mt-2 space-y-1 text-sm text-yellow-800">
                            {selectedChallenge.hints.map((hint, i) => (
                              <li key={i}>💡 {hint}</li>
                            ))}
                          </ul>
                        </details>
                      </div>
                    )}

                    {/* Challenge Stats */}
                    {challengeStats && (
                      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        <div className="bg-white p-2 rounded border">
                          <span className="text-gray-500">Submissions</span>
                          <p className="font-bold">{challengeStats.total_submissions}</p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <span className="text-gray-500">Success Rate</span>
                          <p className="font-bold">{challengeStats.success_rate?.toFixed(1)}%</p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <span className="text-gray-500">Points</span>
                          <p className="font-bold">{selectedChallenge.points}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Code Editor */}
                  <div className="h-96">
                    <Editor
                      height="100%"
                      defaultLanguage="python"
                      theme="vs-dark"
                      value={code}
                      onChange={(value) => setCode(value)}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        suggestOnTriggerCharacters: true,
                        formatOnPaste: true,
                        formatOnType: true
                      }}
                    />
                  </div>

                  {/* Test Results */}
                  {results && (
                    <div className="border-t p-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        {results.passed ? (
                          <span className="text-green-600">✅ All Tests Passed!</span>
                        ) : (
                          <span className="text-red-600">❌ Test Results</span>
                        )}
                        <span className="text-sm text-gray-500 ml-auto">
                          {results.passedCount || 0}/{results.totalTests || 0} passed
                        </span>
                      </h3>
                      
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {results.results?.map((test, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded text-sm ${
                              test.passed
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-red-50 border border-red-200'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {test.passed ? (
                                <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                              ) : (
                                <FaTimes className="text-red-500 mt-1 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <p className="font-medium mb-1">Test Case {test.test || i + 1}</p>
                                {test.error ? (
                                  <p className="text-red-600 text-xs whitespace-pre-wrap">
                                    Error: {test.error}
                                  </p>
                                ) : (
                                  <>
                                    <p className="text-xs">
                                      Expected: <code className="bg-gray-100 px-1">{test.expected}</code>
                                    </p>
                                    <p className="text-xs">
                                      Got: <code className="bg-gray-100 px-1">{test.got}</code>
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {results.passed && (
                        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
                          <FaStar />
                          <span>You earned {results.points || selectedChallenge.points} points!</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Previous Submissions */}
                  {previousSubmissions.length > 0 && (
                    <div className="border-t p-4 bg-gray-50">
                      <details>
                        <summary className="font-medium cursor-pointer">
                          Previous Attempts ({previousSubmissions.length})
                        </summary>
                        <div className="mt-3 space-y-2">
                          {previousSubmissions.map((sub, i) => (
                            <div
                              key={i}
                              className={`p-2 rounded text-sm flex justify-between items-center ${
                                sub.status === 'correct'
                                  ? 'bg-green-100'
                                  : 'bg-red-100'
                              }`}
                            >
                              <span>Attempt #{sub.attempt_number}</span>
                              <span className="flex items-center gap-2">
                                {sub.status === 'correct' ? '✅' : '❌'}
                                <span className="text-xs text-gray-500">
                                  {new Date(sub.submitted_at).toLocaleString()}
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="border-t p-4 flex gap-3">
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-1 btn-primary py-3 text-lg"
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin">⚡</span>
                          Running...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <FaCode />
                          Submit Solution
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <FaCode className="text-6xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Select a Challenge
                  </h3>
                  <p className="text-gray-500">
                    Choose a challenge from the list to start coding
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-yellow-50 to-yellow-100">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FaTrophy className="text-yellow-500" />
                Leaderboard
              </h2>
              <p className="text-gray-600">Top performers</p>
            </div>

            <div className="divide-y divide-gray-200">
              {leaderboard.length > 0 ? (
                leaderboard.map((entry, index) => (
                  <div
                    key={entry.user_id || index}
                    className="p-4 flex items-center gap-4 hover:bg-gray-50 transition"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                      ${index === 0 ? 'bg-yellow-500 text-white' : 
                        index === 1 ? 'bg-gray-400 text-white' : 
                        index === 2 ? 'bg-orange-600 text-white' : 
                        'bg-gray-200 text-gray-700'}`}>
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-semibold">{entry.email?.split('@')[0] || 'Anonymous'}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{entry.solved_count || 0} solved</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <FaStar className="text-yellow-500" />
                          {entry.total_points || 0} points
                        </span>
                      </div>
                    </div>

                    {index === 0 && <FaMedal className="text-yellow-500 text-2xl" />}
                    {index === 1 && <FaMedal className="text-gray-400 text-2xl" />}
                    {index === 2 && <FaMedal className="text-orange-600 text-2xl" />}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No submissions yet. Be the first!
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stats' && user && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaChartLine className="text-primary-600" />
                Your Progress
              </h2>
              
              {userStats ? (
                <div className="space-y-4">
                  <div className="p-4 bg-primary-50 rounded-lg">
                    <p className="text-sm text-primary-600">Total Points</p>
                    <p className="text-3xl font-bold text-primary-700">
                      {userStats.total_points || 0}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600">Solved</p>
                      <p className="text-2xl font-bold text-green-700">
                        {userStats.challenges_solved || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600">Attempted</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {userStats.challenges_attempted || 0}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600">Success Rate</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {userStats.success_rate || 0}%
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Submissions</p>
                    <p className="text-2xl font-bold text-gray-700">
                      {userStats.total_submissions || 0}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No stats available yet. Start solving challenges!
                </div>
              )}
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaFire className="text-orange-500" />
                Achievements
              </h2>
              
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="font-semibold">First Steps</p>
                    <p className="text-sm text-gray-500">Solve your first challenge</p>
                  </div>
                  {userStats?.challenges_solved > 0 ? (
                    <span className="ml-auto text-green-500">✓ Earned</span>
                  ) : (
                    <span className="ml-auto text-gray-400">{userStats?.challenges_solved || 0}/1</span>
                  )}
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <p className="font-semibold">Rising Star</p>
                    <p className="text-sm text-gray-500">Solve 10 challenges</p>
                  </div>
                  <span className="ml-auto text-gray-400">{userStats?.challenges_solved || 0}/10</span>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="font-semibold">Challenge Master</p>
                    <p className="text-sm text-gray-500">Solve 50 challenges</p>
                  </div>
                  <span className="ml-auto text-gray-400">{userStats?.challenges_solved || 0}/50</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
              
              {userStats?.recent_submissions && userStats.recent_submissions.length > 0 ? (
                <div className="space-y-3">
                  {userStats.recent_submissions.map((sub, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{sub.challenges?.title || 'Unknown Challenge'}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(sub.submitted_at).toLocaleDateString()} at {new Date(sub.submitted_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {sub.status === 'correct' ? (
                          <>
                            <span className="text-green-600">Solved</span>
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm">
                              +{sub.points_earned} pts
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-500">Attempt #{sub.attempt_number}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No recent activity. Start solving challenges!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengesPage;
