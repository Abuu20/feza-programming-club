import React, { useState, useEffect } from 'react';
import { membersService } from '../services/members';
import { FaGithub, FaLinkedin, FaTwitter, FaGlobe, FaExpand } from 'react-icons/fa';
import Loader from '../components/common/Loader';

const MembersPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

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

  const getDefaultAvatar = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=002B5C&color=fff&size=200`;
  };

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
          <div key={member.id} className="card text-center p-6 hover:shadow-xl transition group">
            <div className="relative">
              {/* Profile Image with Zoom Button */}
              <div className="relative w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden bg-gray-100 border-4 border-primary-100 group-hover:border-secondary-500 transition cursor-pointer">
                <img
                  src={member.photo_url || getDefaultAvatar(member.name)}
                  alt={member.name}
                  className="w-full h-full object-cover"
                  onClick={() => setSelectedImage(member.photo_url || getDefaultAvatar(member.name))}
                />
                {/* Zoom Icon Overlay */}
                <div 
                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center opacity-0 group-hover:opacity-100"
                  onClick={() => setSelectedImage(member.photo_url || getDefaultAvatar(member.name))}
                >
                  <FaExpand className="text-white text-2xl" />
                </div>
              </div>
              
              {/* Role Badge */}
              {member.role === 'mentor' && (
                <span className="absolute top-0 right-8 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Mentor
                </span>
              )}
            </div>
            
            <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
            <p className="text-primary-600 mb-3">{member.role || 'Club Member'}</p>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {member.bio || 'No bio available'}
            </p>
            
            {/* Social Links - Only show if they exist */}
            <div className="flex justify-center gap-4 text-gray-500">
              {member.github && (
                <a href={member.github} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 transition">
                  <FaGithub className="text-xl" />
                </a>
              )}
              {member.linkedin && (
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 transition">
                  <FaLinkedin className="text-xl" />
                </a>
              )}
              {member.twitter && (
                <a href={member.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 transition">
                  <FaTwitter className="text-xl" />
                </a>
              )}
              {member.website && (
                <a href={member.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 transition">
                  <FaGlobe className="text-xl" />
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

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Member"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white p-2 rounded-full hover:bg-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersPage;
