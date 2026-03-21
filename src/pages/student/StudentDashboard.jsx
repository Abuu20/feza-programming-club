import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { submissionsService } from '../../services/submissions';
import { challengesService } from '../../services/challenges';
import { supabase } from '../../services/supabase';
import { 
  FaCode, 
  FaTrophy, 
  FaChartLine, 
  FaUser,
  FaStar,
  FaFire,
  FaCheckCircle,
  FaClock,
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaGlobe,
  FaCamera
} from 'react-icons/fa';
import Loader from '../../components/common/Loader';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentChallenges, setRecentChallenges] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchProfile();
      fetchRecentActivity();
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
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data } = await supabase
        .from('challenge_submissions')
        .select('*, challenges(*)')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(5);

      setRecentActivity(data || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultAvatar = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=002B5C&color=fff&size=128`;
  };

  if (loading) return <Loader />;

  return (
    <div className="container-custom py-8">
      {/* Welcome Header with Profile */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white rounded-2xl p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Profile Picture */}
          <div className="relative group">
            <Link to="/student/profile">
              <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white overflow-hidden cursor-pointer hover:scale-105 transition">
                {profile?.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={getDefaultAvatar(profile?.name || user?.email)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="absolute bottom-0 right-0 bg-secondary-500 p-1.5 rounded-full">
                <FaCamera size={12} />
              </div>
            </Link>
          </div>
          
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {profile?.name || user?.email?.split('@')[0]}!
            </h1>
            <p className="text-primary-100">
              Continue your coding journey with Feza Programming Club
            </p>
          </div>

          {/* Edit Profile Button */}
          <Link
            to="/student/profile"
            className="bg-white text-primary-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
          >
            <FaUser />
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Social Links (if any) */}
      {(profile?.github || profile?.linkedin || profile?.twitter || profile?.website) && (
        <div className="bg-white rounded-xl shadow-md p-4 mb-8">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Connect with me</h3>
          <div className="flex flex-wrap gap-4">
            {profile?.github && (
              <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition flex items-center gap-2">
                <FaGithub size={20} /> GitHub
              </a>
            )}
            {profile?.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition flex items-center gap-2">
                <FaLinkedin size={20} /> LinkedIn
              </a>
            )}
            {profile?.twitter && (
              <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition flex items-center gap-2">
                <FaTwitter size={20} /> Twitter
              </a>
            )}
            {profile?.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition flex items-center gap-2">
                <FaGlobe size={20} /> Website
              </a>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <FaTrophy className="text-yellow-500 text-2xl" />
            <span className="text-sm text-gray-500">Total Points</span>
          </div>
          <p className="text-3xl font-bold">{stats?.total_points || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <FaCheckCircle className="text-green-500 text-2xl" />
            <span className="text-sm text-gray-500">Solved</span>
          </div>
          <p className="text-3xl font-bold">{stats?.challenges_solved || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <FaCode className="text-blue-500 text-2xl" />
            <span className="text-sm text-gray-500">Attempted</span>
          </div>
          <p className="text-3xl font-bold">{stats?.challenges_attempted || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
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
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaClock className="text-primary-600" />
              Recent Activity
            </h2>
            
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{activity.challenges?.title || 'Unknown Challenge'}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(activity.submitted_at).toLocaleDateString()} at {new Date(activity.submitted_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {activity.status === 'correct' ? (
                        <>
                          <span className="text-green-600">✓ Solved</span>
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm">
                            +{activity.points_earned}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-500">Attempt #{activity.attempt_number}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No activity yet. Start solving challenges!
              </p>
            )}
          </div>
        </div>

        {/* Recommended Challenges */}
        <div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaStar className="text-yellow-500" />
              Recommended
            </h2>
            
            <div className="space-y-3">
              {recentChallenges.length > 0 ? (
                recentChallenges.map((challenge) => (
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
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No challenges available
                </p>
              )}
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

      {/* Quick Links */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/python-practice"
          className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition"
        >
          <FaCode className="text-2xl mx-auto mb-2" />
          <span className="font-semibold">Python Practice</span>
          <p className="text-sm opacity-90">Write and save your code</p>
        </Link>
        
        <Link
          to="/challenges"
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition"
        >
          <FaTrophy className="text-2xl mx-auto mb-2" />
          <span className="font-semibold">Coding Challenges</span>
          <p className="text-sm opacity-90">Test your skills</p>
        </Link>
        
        <Link
          to="/curriculum"
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition"
        >
          <FaChartLine className="text-2xl mx-auto mb-2" />
          <span className="font-semibold">Learning Path</span>
          <p className="text-sm opacity-90">Track your progress</p>
        </Link>
      </div>
    </div>
  );
};

export default StudentDashboard;
