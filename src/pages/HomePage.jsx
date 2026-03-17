import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  LightBulbIcon,
  CodeBracketIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  BellIcon,
  SparklesIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { announcementsService } from '../services/announcements';
import { useActivities } from '../hooks/useActivities';
import { formatDate } from '../utils/helpers';
import Loader from '../components/common/Loader';
import JoinModal from '../components/common/JoinModal';
import ShareButtons from '../components/announcements/ShareButtons';
import toast from 'react-hot-toast';

const HomePage = () => {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [hoveredAnnouncement, setHoveredAnnouncement] = useState(null);
  const { activities, loading: loadingActivities } = useActivities();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const { data } = await announcementsService.getLatest(4); // Show 4 announcements
    setAnnouncements(data || []);
    setLoadingAnnouncements(false);
  };

  const handleJoinSuccess = (email) => {
    toast.success(`Application received! Check ${email} for updates.`);
  };

  // Get latest 3 activities for preview
  const latestActivities = activities?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section - Modern and Clean */}
      <section className="relative bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 text-white overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full animate-pulse"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-500 rounded-full animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-300 rounded-full filter blur-3xl opacity-20"></div>
        </div>
        
        <div className="container-custom relative py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <SparklesIcon className="w-5 h-5 text-secondary-500" />
              <span className="text-sm font-medium">Welcome to the Future of Coding</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Learn to Code,
              <br />
              <span className="text-secondary-500 bg-clip-text">Create & Innovate</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join Feza Programming Club and embark on an exciting journey into the world of technology. 
              Where young minds transform ideas into reality.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => setShowJoinModal(true)}
                className="group bg-secondary-500 text-primary-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-secondary-600 transition-all transform hover:scale-105 hover:shadow-2xl inline-flex items-center gap-3 shadow-lg"
              >
                <span>Start Your Journey</span>
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition" />
              </button>
              
              <button
                onClick={() => navigate('/activities')}
                className="group bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all inline-flex items-center gap-3 border border-white/20"
              >
                <CalendarIcon className="w-5 h-5" />
                <span>View Activities</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 mt-16 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-secondary-500">50+</div>
                <div className="text-sm md:text-base text-primary-200 mt-2">Active Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-secondary-500">20+</div>
                <div className="text-sm md:text-base text-primary-200 mt-2">Coding Challenges</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-secondary-500">10+</div>
                <div className="text-sm md:text-base text-primary-200 mt-2">Expert Mentors</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
            <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,170.7C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* Announcements Section - Beautiful Cards */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-full mb-4">
              <BellIcon className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-semibold text-primary-600">Latest Updates</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-primary-500 mb-4">
              Club Announcements
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Stay in the loop with our latest news, events, and opportunities
            </p>
          </div>

          {loadingAnnouncements ? (
            <Loader />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {announcements.length > 0 ? (
                announcements.map((announcement, index) => (
                  <div
                    key={announcement.id}
                    className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-2"
                    onMouseEnter={() => setHoveredAnnouncement(announcement.id)}
                    onMouseLeave={() => setHoveredAnnouncement(null)}
                  >
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                    
                    {/* Colored top bar */}
                    <div className={`h-2 bg-gradient-to-r ${
                      index % 4 === 0 ? 'from-primary-500 to-primary-600' :
                      index % 4 === 1 ? 'from-secondary-500 to-secondary-600' :
                      index % 4 === 2 ? 'from-green-500 to-green-600' :
                      'from-purple-500 to-purple-600'
                    }`}></div>
                    
                    <div className="p-6">
                      {/* Icon and Share */}
                      <div className="flex justify-between items-start mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          index % 4 === 0 ? 'bg-primary-100 text-primary-600' :
                          index % 4 === 1 ? 'bg-secondary-100 text-secondary-600' :
                          index % 4 === 2 ? 'bg-green-100 text-green-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          <BellIcon className="w-6 h-6" />
                        </div>
                        
                        {/* Share button - appears on hover */}
                        <div className={`transition-opacity duration-300 ${hoveredAnnouncement === announcement.id ? 'opacity-100' : 'opacity-0'}`}>
                          <ShareButtons 
                            announcement={announcement}
                            url={`${window.location.origin}/announcements`}
                            size={24}
                            showLabel={false}
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <h3 className="text-xl font-bold text-primary-500 mb-3 line-clamp-2 group-hover:text-primary-600 transition">
                        {announcement.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                        {announcement.content}
                      </p>

                      {/* Metadata */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                          <ClockIcon className="w-4 h-4" />
                          <span>{formatDate(announcement.created_at)}</span>
                        </div>
                        
                        <button
                          onClick={() => navigate('/announcements')}
                          className="flex items-center gap-1 text-secondary-500 hover:text-secondary-600 font-medium group/btn"
                        >
                          <span>Read more</span>
                          <ArrowRightIcon className="w-4 h-4 group-hover/btn:translate-x-1 transition" />
                        </button>
                      </div>

                      {/* Views count (optional) */}
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1 text-xs text-gray-400">
                        <EyeIcon className="w-3 h-3" />
                        <span>Shared by club</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-4 text-center py-16 bg-gray-50 rounded-2xl">
                  <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-4">No announcements yet</p>
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="text-secondary-500 hover:text-secondary-600 font-medium inline-flex items-center gap-2"
                  >
                    <span>Join the club to get notified</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* View All Link */}
          {announcements.length > 0 && (
            <div className="text-center mt-12">
              <button
                onClick={() => navigate('/announcements')}
                className="group inline-flex items-center gap-3 text-primary-600 hover:text-primary-700 font-semibold text-lg border-2 border-primary-200 hover:border-primary-300 px-8 py-3 rounded-full transition-all hover:shadow-lg"
              >
                <span>View All Announcements</span>
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Features Section - Beautiful Cards */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-full mb-4">
              <SparklesIcon className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-semibold text-primary-600">Why Choose Us</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-primary-500 mb-4">
              Unlock Your Potential
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover the benefits of being part of our programming community
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 - Learn Python */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 transform hover:-translate-y-2">
              <div className="bg-gradient-to-br from-primary-100 to-primary-200 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CodeBracketIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-primary-600 mb-3">Learn Python</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Master Python programming with our interactive editor and hands-on projects. 
                From basics to advanced concepts with real-world applications.
              </p>
              <div className="flex items-center text-secondary-500 font-medium group-hover:gap-2 transition-all">
                <span>Start coding</span>
                <ArrowRightIcon className="w-4 h-4" />
              </div>
            </div>
            
            {/* Card 2 - Community */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 transform hover:-translate-y-2">
              <div className="bg-gradient-to-br from-secondary-100 to-secondary-200 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <UserGroupIcon className="w-8 h-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-bold text-secondary-600 mb-3">Vibrant Community</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Connect with fellow coders, share ideas, and collaborate on exciting projects 
                in a supportive and inclusive environment.
              </p>
              <div className="flex items-center text-secondary-500 font-medium group-hover:gap-2 transition-all">
                <span>Meet members</span>
                <ArrowRightIcon className="w-4 h-4" />
              </div>
            </div>
            
            {/* Card 3 - Activities */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 transform hover:-translate-y-2">
              <div className="bg-gradient-to-br from-green-100 to-green-200 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CalendarIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-600 mb-3">Exciting Activities</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Participate in workshops, hackathons, and coding competitions. 
                Learn from industry experts and showcase your skills.
              </p>
              <div className="flex items-center text-secondary-500 font-medium group-hover:gap-2 transition-all">
                <span>View events</span>
                <ArrowRightIcon className="w-4 h-4" />
              </div>
            </div>

            {/* Card 4 - Projects */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 transform hover:-translate-y-2">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <LightBulbIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-purple-600 mb-3">Real Projects</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Build portfolio-worthy projects that solve real problems. 
                Get feedback from mentors and improve your skills.
              </p>
              <div className="flex items-center text-secondary-500 font-medium group-hover:gap-2 transition-all">
                <span>See projects</span>
                <ArrowRightIcon className="w-4 h-4" />
              </div>
            </div>

            {/* Card 5 - Mentorship */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 transform hover:-translate-y-2">
              <div className="bg-gradient-to-br from-red-100 to-red-200 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <AcademicCapIcon className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-red-600 mb-3">Expert Mentors</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Get guidance from experienced developers who are passionate 
                about teaching and helping you achieve your goals.
              </p>
              <div className="flex items-center text-secondary-500 font-medium group-hover:gap-2 transition-all">
                <span>Meet mentors</span>
                <ArrowRightIcon className="w-4 h-4" />
              </div>
            </div>

            {/* Card 6 - Networking */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 transform hover:-translate-y-2">
              <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-indigo-600 mb-3">Networking</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Connect with industry professionals, alumni, and peers who share 
                your passion for technology and innovation.
              </p>
              <div className="flex items-center text-secondary-500 font-medium group-hover:gap-2 transition-all">
                <span>Connect</span>
                <ArrowRightIcon className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Activities Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-full mb-4">
                <CalendarIcon className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-semibold text-primary-600">Upcoming Events</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-primary-500 mb-4">
                Latest Activities
              </h2>
              <p className="text-xl text-gray-600">Join our upcoming events and workshops</p>
            </div>
            <button
              onClick={() => navigate('/activities')}
              className="group mt-4 md:mt-0 inline-flex items-center gap-3 text-primary-600 hover:text-primary-700 font-semibold text-lg border-2 border-primary-200 hover:border-primary-300 px-6 py-3 rounded-full transition-all hover:shadow-lg"
            >
              <span>View All Activities</span>
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition" />
            </button>
          </div>

          {loadingActivities ? (
            <Loader />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestActivities.length > 0 ? (
                latestActivities.map((activity, index) => (
                  <div
                    key={activity.id}
                    onClick={() => navigate(`/activities/${activity.id}`)}
                    className="group bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                  >
                    <div className="relative h-48 overflow-hidden">
                      {activity.image_url ? (
                        <img
                          src={activity.image_url}
                          alt={activity.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${
                          index % 3 === 0 ? 'from-primary-400 to-primary-600' :
                          index % 3 === 1 ? 'from-secondary-400 to-secondary-600' :
                          'from-purple-400 to-purple-600'
                        } flex items-center justify-center`}>
                          <CalendarIcon className="w-16 h-16 text-white opacity-50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <div className="absolute bottom-4 left-4 text-white">
                        <div className="flex items-center gap-2 text-sm font-medium bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{formatDate(activity.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-primary-600 mb-2 group-hover:text-primary-700 transition">
                        {activity.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                        {activity.description}
                      </p>
                      <div className="flex items-center text-secondary-500 font-medium group-hover:gap-2 transition-all">
                        <span>Learn more</span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-16 bg-gray-50 rounded-2xl">
                  <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-4">No upcoming activities</p>
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="text-secondary-500 hover:text-secondary-600 font-medium inline-flex items-center gap-2"
                  >
                    <span>Join the club to get notified</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action - Beautiful Gradient */}
      <section className="py-20 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary-500 rounded-full filter blur-3xl"></div>
        </div>

        <div className="container-custom relative text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Your Coding Journey?
            </h2>
            <p className="text-xl text-primary-100 mb-10 leading-relaxed">
              Join Feza Programming Club today and unlock your potential in the world of technology. 
              Learn, create, and innovate with us!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowJoinModal(true)}
                className="group bg-secondary-500 text-primary-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-secondary-600 transition-all transform hover:scale-105 hover:shadow-2xl inline-flex items-center gap-3 shadow-lg"
              >
                <span>Apply for Membership</span>
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition" />
              </button>
              
              <button
                onClick={() => navigate('/contact')}
                className="group bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all inline-flex items-center gap-3 border border-white/20"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                <span>Contact Us</span>
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-6 mt-12 text-white/60 text-sm">
              <span className="flex items-center gap-2">✓ Free Membership</span>
              <span className="flex items-center gap-2">✓ All Skill Levels</span>
              <span className="flex items-center gap-2">✓ Expert Mentors</span>
              <span className="flex items-center gap-2">✓ Hands-on Learning</span>
            </div>
          </div>
        </div>
      </section>

      {/* Join Modal */}
      {showJoinModal && (
        <JoinModal
          onClose={() => setShowJoinModal(false)}
          onSuccess={handleJoinSuccess}
        />
      )}
    </div>
  );
};

export default HomePage;
