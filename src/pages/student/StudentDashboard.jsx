import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { submissionsService } from '../../services/submissions';
import { challengesService } from '../../services/challenges';
import { Link } from 'react-router-dom';
import { 
  FaCode, 
  FaTrophy, 
  FaChartLine, 
  FaCalendarAlt,
  FaStar,
  FaFire,
  FaCheckCircle,
  FaClock
} from 'react-icons/fa';
import Loader from '../../components/common/Loader';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentChallenges, setRecentChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Get user stats
      const { data: userStats } = await submissionsService.getUserStats(user.id);
      setStats(userStats);

      // Get some challenges to recommend
      const { data: challenges } = await challengesService.getAll({ limit: 3 });
      setRecentChallenges(challenges || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container-custom py-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white rounded-lg p-8 mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.user_metadata?.full_name || 'Student'}!
        </h1>
        <p className="text-xl opacity-90">
          Continue your coding journey with Feza Programming Club
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <FaTrophy className="text-yellow-500 text-2xl" />
            <span className="text-sm text-gray-500">Total Points</span>
          </div>
          <p className="text-3xl font-bold">{stats?.total_points || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <FaCheckCircle className="text-green-500 text-2xl" />
            <span className="text-sm text-gray-500">Solved</span>
          </div>
          <p className="text-3xl font-bold">{stats?.challenges_solved || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <FaCode className="text-blue-500 text-2xl" />
            <span className="text-sm text-gray-500">Attempted</span>
          </div>
          <p className="text-3xl font-bold">{stats?.challenges_attempted || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <FaFire className="text-orange-500 text-2xl" />
            <span className="text-sm text-gray-500">Success Rate</span>
          </div>
          <p className="text-3xl font-bold">{stats?.success_rate || 0}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaClock className="text-primary-600" />
              Recent Activity
            </h2>
            
            {stats?.recent_submissions && stats.recent_submissions.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_submissions.map((sub, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{sub.challenges?.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(sub.submitted_at).toLocaleDateString()} at {new Date(sub.submitted_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.status === 'correct' ? (
                        <>
                          <span className="text-green-600">✓ Solved</span>
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm">
                            +{sub.points_earned}
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
              <p className="text-center text-gray-500 py-4">
                No activity yet. Start solving challenges!
              </p>
            )}
          </div>
        </div>

        {/* Recommended Challenges */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaStar className="text-yellow-500" />
              Recommended
            </h2>
            
            <div className="space-y-3">
              {recentChallenges.map((challenge) => (
                <Link
                  key={challenge.id}
                  to={`/challenges?challenge=${challenge.id}`}
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <h3 className="font-semibold">{challenge.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {challenge.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      challenge.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      challenge.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {challenge.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">
                      {challenge.points} pts
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <Link
              to="/challenges"
              className="mt-4 block text-center text-primary-600 hover:text-primary-700 font-medium"
            >
              View All Challenges →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
