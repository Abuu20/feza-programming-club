import React, { useState, useEffect } from 'react';
import { challengesService } from '../../services/challenges';
import { FaEdit, FaTrash, FaPlus, FaCopy, FaEye, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Loader from '../../components/common/Loader';
import ChallengeForm from '../../components/challenges/ChallengeForm';
import toast from 'react-hot-toast';

const AdminChallenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalSubmissions: 0
  });

  useEffect(() => {
    fetchChallenges();
    fetchStats();
  }, []);

  const fetchChallenges = async () => {
    const { data } = await challengesService.getAll({ includeInactive: true });
    setChallenges(data || []);
    setLoading(false);
  };

  const fetchStats = async () => {
    // This would fetch from a stats endpoint
  };

  const handleEdit = (challenge) => {
    setEditingChallenge(challenge);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this challenge?')) {
      const { error } = await challengesService.delete(id);
      if (!error) {
        toast.success('Challenge deleted');
        fetchChallenges();
      }
    }
  };

  const handleToggleActive = async (challenge) => {
    const { error } = await challengesService.update(challenge.id, {
      is_active: !challenge.is_active
    });
    if (!error) {
      toast.success(`Challenge ${challenge.is_active ? 'deactivated' : 'activated'}`);
      fetchChallenges();
    }
  };

  const handleDuplicate = async (challenge) => {
    const { title, description, difficulty, points, category, starter_code, test_cases } = challenge;
    const newChallenge = {
      title: `${title} (Copy)`,
      description,
      difficulty,
      points,
      category,
      starter_code,
      test_cases,
      is_active: false
    };
    
    const { error } = await challengesService.create(newChallenge);
    if (!error) {
      toast.success('Challenge duplicated');
      fetchChallenges();
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingChallenge(null);
    fetchChallenges();
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-orange-600 bg-orange-100';
      case 'expert': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Coding Challenges</h1>
          <p className="text-gray-600">Manage challenges, test cases, and view submissions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <FaPlus />
          Add Challenge
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Challenges</div>
          <div className="text-2xl font-bold">{challenges.length}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <div className="text-sm text-green-600">Active</div>
          <div className="text-2xl font-bold text-green-700">
            {challenges.filter(c => c.is_active).length}
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow">
          <div className="text-sm text-blue-600">Total Submissions</div>
          <div className="text-2xl font-bold text-blue-700">0</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow">
          <div className="text-sm text-purple-600">Avg. Success Rate</div>
          <div className="text-2xl font-bold text-purple-700">0%</div>
        </div>
      </div>

      {/* Challenges Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solved</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {challenges.map((challenge) => (
              <tr key={challenge.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium">{challenge.title}</div>
                  <div className="text-sm text-gray-500 line-clamp-1">{challenge.description}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(challenge.difficulty)}`}>
                    {challenge.difficulty}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium">{challenge.points}</td>
                <td className="px-6 py-4 text-sm">{challenge.category || '-'}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleActive(challenge)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                      challenge.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {challenge.is_active ? <FaToggleOn /> : <FaToggleOff />}
                    {challenge.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm">
                  {challenge.completed_count || 0}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(challenge)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDuplicate(challenge)}
                      className="text-green-600 hover:text-green-900"
                      title="Duplicate"
                    >
                      <FaCopy />
                    </button>
                    <button
                      onClick={() => handleDelete(challenge.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Challenge Form Modal */}
      {showForm && (
        <ChallengeForm
          challenge={editingChallenge}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default AdminChallenges;
