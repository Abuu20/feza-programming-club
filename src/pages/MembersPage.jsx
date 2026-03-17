import React, { useState, useEffect } from 'react';
import { membersService } from '../services/members';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { generateAvatarUrl } from '../utils/helpers';
import Loader from '../components/common/Loader';

const MembersPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data } = await membersService.getAll();
    setMembers(data || []);
    setLoading(false);
  };

  const filteredMembers = filter === 'all' 
    ? members 
    : members.filter(m => m.role?.toLowerCase() === filter);

  if (loading) return <Loader />;

  return (
    <div className="container-custom py-12 min-h-[60vh]">
      <h1 className="text-4xl font-bold text-center mb-4">Our Members</h1>
      <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
        Meet the talented members of Feza Programming Club
      </p>

      {/* Filter Buttons */}
      <div className="flex justify-center gap-4 mb-12">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'all' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Members
        </button>
        <button
          onClick={() => setFilter('mentor')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'mentor' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Mentors
        </button>
        <button
          onClick={() => setFilter('member')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'member' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Members
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredMembers.map((member) => (
          <div key={member.id} className="card text-center p-6">
            <div className="relative">
              <img
                src={member.photo_url || generateAvatarUrl(member.name)}
                alt={member.name}
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-primary-100"
              />
              {member.role === 'mentor' && (
                <span className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Mentor
                </span>
              )}
            </div>
            
            <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
            <p className="text-primary-600 mb-3">{member.role || 'Club Member'}</p>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {member.bio || 'No bio available'}
            </p>
            
            <div className="flex justify-center gap-4 text-gray-500">
              {member.github && (
                <a 
                  href={member.github} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary-600 transition"
                  aria-label="GitHub"
                >
                  <FaGithub className="text-xl" />
                </a>
              )}
              {member.linkedin && (
                <a 
                  href={member.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary-600 transition"
                  aria-label="LinkedIn"
                >
                  <FaLinkedin className="text-xl" />
                </a>
              )}
              {member.twitter && (
                <a 
                  href={member.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary-600 transition"
                  aria-label="Twitter"
                >
                  <FaTwitter className="text-xl" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No members found</p>
        </div>
      )}
    </div>
  );
};

export default MembersPage;
