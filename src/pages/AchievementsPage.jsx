import React, { useState, useEffect } from 'react';
import { achievementsService } from '../services/achievements';
import { FaTrophy, FaStar, FaMedal, FaFire, FaRocket, FaCalendar, FaUserGraduate, FaChartLine } from 'react-icons/fa';
import Loader from '../components/common/Loader';

const AchievementsPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('achievements');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [achievementsRes, milestonesRes, leaderboardRes] = await Promise.all([
      achievementsService.getPublicAchievements(30),
      achievementsService.getPublicMilestones(30),
      achievementsService.getLeaderboard(20)
    ]);
    
    setAchievements(achievementsRes.data || []);
    setMilestones(milestonesRes.data || []);
    setLeaderboard(leaderboardRes.data || []);
    setLoading(false);
  };

  const getMilestoneIcon = (icon) => {
    const icons = {
      '🌟': '🌟', '📚': '📚', '⚡': '⚡', '🏆': '🏆', '🏅': '🏅'
    };
    return icons[icon] || '🏆';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container-custom">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-secondary-100 px-4 py-2 rounded-full mb-4">
            <FaTrophy className="text-secondary-600" />
            <span className="text-sm font-semibold text-secondary-600">Hall of Fame</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-primary-600 mb-4">
            Student Achievements
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Celebrating the amazing progress of our coding community. Every milestone is a step toward greatness!
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-4 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-yellow-700">{leaderboard.length}</div>
            <div className="text-sm text-gray-600">Active Achievers</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center">
            <div className="text-3xl mb-2">✨</div>
            <div className="text-2xl font-bold text-green-700">{achievements.length + milestones.length}</div>
            <div className="text-sm text-gray-600">Achievements Earned</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center">
            <div className="text-3xl mb-2">📚</div>
            <div className="text-2xl font-bold text-blue-700">1,000+</div>
            <div className="text-sm text-gray-600">Lessons Completed</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 text-center">
            <div className="text-3xl mb-2">💼</div>
            <div className="text-2xl font-bold text-purple-700">50+</div>
            <div className="text-sm text-gray-600">Projects Built</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-4 mb-8 border-b">
          <button
            onClick={() => setActiveTab('achievements')}
            className={`pb-3 px-6 font-semibold transition ${
              activeTab === 'achievements'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaStar className="inline mr-2" />
            Recent Achievements
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`pb-3 px-6 font-semibold transition ${
              activeTab === 'milestones'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaMedal className="inline mr-2" />
            Milestone Moments
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`pb-3 px-6 font-semibold transition ${
              activeTab === 'leaderboard'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaChartLine className="inline mr-2" />
            Leaderboard
          </button>
        </div>

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-4">
            {achievements.length > 0 ? (
              achievements.map((achievement, index) => (
                <div
                  key={achievement.id}
                  className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition border border-gray-100 animate-fadeIn"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{achievement.student_name}</span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <FaCalendar size={12} />
                            {formatDate(achievement.completed_at)}
                          </span>
                        </div>
                        <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
                          +10 XP
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-primary-600 mb-1">
                        {achievement.achievement_name}
                      </h3>
                      <p className="text-gray-600 text-sm">{achievement.achievement_description}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl">
                <FaStar className="text-5xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No achievements yet. Be the first!</p>
              </div>
            )}
          </div>
        )}

        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {milestones.length > 0 ? (
              milestones.map((milestone, index) => (
                <div
                  key={milestone.id}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-md p-6 hover:shadow-xl transition border border-gray-100 transform hover:-translate-y-1"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-center mb-4">
                    <div className="text-6xl mb-3 animate-bounce">
                      {getMilestoneIcon(milestone.milestone_icon)}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      {formatDate(milestone.completed_at)}
                    </div>
                    <h3 className="text-xl font-bold text-primary-600 mb-1">
                      {milestone.milestone_name}
                    </h3>
                    <p className="text-gray-600 text-sm">{milestone.milestone_description}</p>
                  </div>
                  <div className="border-t border-gray-200 pt-4 mt-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <FaUserGraduate className="text-primary-400" />
                      <span className="text-sm font-medium text-gray-700">{milestone.student_name}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 bg-white rounded-xl">
                <FaMedal className="text-5xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No milestones yet. First milestone coming soon!</p>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600 to-primary-500 text-white p-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FaFire className="text-yellow-400" />
                Top Achievers
              </h2>
              <p className="text-primary-100 mt-1">These students are leading the way!</p>
            </div>
            
            <div className="divide-y divide-gray-100">
              {leaderboard.length > 0 ? (
                leaderboard.map((student, index) => (
                  <div
                    key={student.user_id}
                    className={`p-5 hover:bg-gray-50 transition ${
                      index < 3 ? 'bg-gradient-to-r from-yellow-50/50 to-transparent' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 text-center">
                        {index === 0 && <span className="text-3xl">🥇</span>}
                        {index === 1 && <span className="text-3xl">🥈</span>}
                        {index === 2 && <span className="text-3xl">🥉</span>}
                        {index > 2 && <span className="text-xl font-bold text-gray-400">#{index + 1}</span>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-800">{student.email?.split('@')[0] || 'Student'}</h3>
                          <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
                            {student.lessons_completed || 0} lessons
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <FaStar className="text-yellow-500" />
                            {student.achievements_earned || 0} achievements
                          </span>
                          {student.last_achievement && (
                            <span className="flex items-center gap-1">
                              <FaCalendar />
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                          <FaRocket className="text-primary-600 text-2xl" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No leaderboard entries yet. Start coding!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-secondary-500 to-primary-500 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Want to See Your Name Here?</h3>
          <p className="mb-6">Join our coding community and start earning achievements today!</p>
          <a href="/student/request" className="inline-block bg-white text-primary-600 px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition">
            Join the Club →
          </a>
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage;
