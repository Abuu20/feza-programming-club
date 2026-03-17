import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  LightBulbIcon,
  CodeBracketIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { FaBullhorn } from 'react-icons/fa';
import { announcementsService } from '../services/announcements';
import { useActivities } from '../hooks/useActivities';
import { formatDate } from '../utils/helpers';
import Loader from '../components/common/Loader';
import JoinModal from '../components/common/JoinModal';
import toast from 'react-hot-toast';

const HomePage = () => {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const { activities, loading: loadingActivities } = useActivities();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const { data } = await announcementsService.getLatest(3);
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
      {/* Hero Section */}
      <section className="relative bg-primary-500 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-500 rounded-full"></div>
        </div>
        
        <div className="container-custom relative py-20 md:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Learn to Code,
              <br />
              <span className="text-secondary-500">Create & Innovate</span>
            </h1>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl">
              Join Feza Programming Club and embark on an exciting journey into the world of technology.
            </p>
            <button
              onClick={() => setShowJoinModal(true)}
              className="bg-secondary-500 text-primary-500 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-secondary-600 transition transform hover:scale-105 inline-flex items-center gap-2 shadow-lg"
            >
              <span>Start Your Journey</span>
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Announcements Section - Polished */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          {/* Section Header */}
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-primary-500 mb-2 flex items-center gap-2">
                <FaBullhorn className="text-primary-500" />
                Latest Announcements
              </h2>
              <p className="text-gray-600">Stay updated with club news</p>
            </div>
            <button
              onClick={() => navigate('/announcements')}
              className="text-secondary-500 hover:text-secondary-600 font-semibold flex items-center gap-1"
            >
              View All
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>

          {loadingAnnouncements ? (
            <Loader />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 border border-gray-100"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-primary-100 p-3 rounded-lg">
                        <FaBullhorn className="text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-primary-600 mb-2">
                          {announcement.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                          {announcement.content}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {formatDate(announcement.created_at)}
                          </p>
                          <button
                            onClick={() => navigate('/announcements')}
                            className="text-secondary-500 hover:text-secondary-600 text-sm font-medium flex items-center gap-1"
                          >
                            Read more
                            <ArrowRightIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No announcements yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary-500 mb-4">Why Join Us?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover the benefits of being part of our programming community
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 - Learn Python */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition p-8 border border-gray-100">
              <div className="bg-primary-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-100 transition">
                <CodeBracketIcon className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-bold text-primary-500 mb-3">Learn Python</h3>
              <p className="text-gray-600 leading-relaxed">
                Master Python programming with our interactive editor and hands-on projects. 
                From basics to advanced concepts.
              </p>
              <div className="mt-4 flex items-center text-secondary-500 text-sm font-medium">
                <span>Start coding</span>
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </div>
            </div>
            
            {/* Card 2 - Community */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition p-8 border border-gray-100">
              <div className="bg-primary-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-100 transition">
                <UserGroupIcon className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-bold text-primary-500 mb-3">Vibrant Community</h3>
              <p className="text-gray-600 leading-relaxed">
                Connect with fellow coders, share ideas, and collaborate on exciting projects 
                in a supportive environment.
              </p>
              <div className="mt-4 flex items-center text-secondary-500 text-sm font-medium">
                <span>Meet members</span>
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </div>
            </div>
            
            {/* Card 3 - Activities */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition p-8 border border-gray-100">
              <div className="bg-primary-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-100 transition">
                <CalendarIcon className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-bold text-primary-500 mb-3">Exciting Activities</h3>
              <p className="text-gray-600 leading-relaxed">
                Participate in workshops, hackathons, and coding competitions. 
                Learn from mentors and industry experts.
              </p>
              <div className="mt-4 flex items-center text-secondary-500 text-sm font-medium">
                <span>View events</span>
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Card 4 - Projects */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition p-8 border border-gray-100">
              <div className="bg-primary-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-100 transition">
                <LightBulbIcon className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-bold text-primary-500 mb-3">Real Projects</h3>
              <p className="text-gray-600 leading-relaxed">
                Build portfolio-worthy projects that solve real problems. 
                Get feedback and improve your skills.
              </p>
              <div className="mt-4 flex items-center text-secondary-500 text-sm font-medium">
                <span>See projects</span>
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Card 5 - Mentorship */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition p-8 border border-gray-100">
              <div className="bg-primary-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-100 transition">
                <AcademicCapIcon className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-bold text-primary-500 mb-3">Expert Mentors</h3>
              <p className="text-gray-600 leading-relaxed">
                Get guidance from experienced developers who are passionate 
                about teaching and helping you grow.
              </p>
              <div className="mt-4 flex items-center text-secondary-500 text-sm font-medium">
                <span>Meet mentors</span>
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Card 6 - Networking */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition p-8 border border-gray-100">
              <div className="bg-primary-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-100 transition">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-bold text-primary-500 mb-3">Networking</h3>
              <p className="text-gray-600 leading-relaxed">
                Connect with industry professionals, alumni, and like-minded 
                peers who share your passion for technology.
              </p>
              <div className="mt-4 flex items-center text-secondary-500 text-sm font-medium">
                <span>Connect</span>
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Activities Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-bold text-primary-500 mb-4">Latest Activities</h2>
              <p className="text-xl text-gray-600">Join our upcoming events and workshops</p>
            </div>
            <button
              onClick={() => navigate('/activities')}
              className="text-secondary-500 hover:text-secondary-600 font-semibold flex items-center gap-1"
            >
              View All Activities
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>

          {loadingActivities ? (
            <Loader />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestActivities.length > 0 ? (
                latestActivities.map((activity) => (
                  <div
                    key={activity.id}
                    onClick={() => navigate(`/activities/${activity.id}`)}
                    className="group bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition"
                  >
                    <div className="relative h-48 overflow-hidden bg-primary-100">
                      {activity.image_url ? (
                        <img
                          src={activity.image_url}
                          alt={activity.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <CalendarIcon className="w-16 h-16 text-primary-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 text-white">
                        <CalendarIcon className="w-5 h-5 inline mr-2" />
                        <span className="text-sm">{formatDate(activity.date)}</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-primary-500 mb-2">{activity.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">{activity.description}</p>
                      <div className="flex items-center text-secondary-500 font-medium">
                        <span>Learn more</span>
                        <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-2 transition" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12 bg-white rounded-2xl">
                  <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No upcoming activities</p>
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="text-secondary-500 mt-4 hover:underline"
                  >
                    Join the club to get notified!
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-primary-500">
        <div className="container-custom text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Start Coding?</h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join Feza Programming Club today and begin your journey into the world of technology.
          </p>
          <button
            onClick={() => setShowJoinModal(true)}
            className="bg-secondary-500 text-primary-500 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-secondary-600 transition transform hover:scale-105 shadow-lg"
          >
            Apply for Membership
          </button>
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
