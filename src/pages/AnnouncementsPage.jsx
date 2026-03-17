import React, { useState, useEffect } from 'react';
import { announcementsService } from '../services/announcements';
import { FaBullhorn, FaCalendar, FaArrowLeft, FaClock, FaWhatsapp } from 'react-icons/fa';
import { formatDate } from '../utils/helpers';
import Loader from '../components/common/Loader';

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const { data } = await announcementsService.getAll();
    setAnnouncements(data || []);
    setLoading(false);
  };

  const handleWhatsAppShare = (announcement) => {
    const text = `*${announcement.title}*\n\n${announcement.content.substring(0, 200)}...\n\nRead more: ${window.location.origin}/announcements`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  if (loading) return <Loader />;

  return (
    <div className="container-custom py-8 md:py-12">
      {/* Header */}
      <div className="text-center mb-8 md:mb-12">
        <div className="inline-flex items-center gap-2 bg-primary-100 px-4 py-2 rounded-full mb-4">
          <FaBullhorn className="text-primary-600" />
          <span className="text-sm font-semibold text-primary-600">Club Updates</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-primary-600 mb-4">
          Announcements
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto px-4">
          Stay updated with the latest news, events, and opportunities from Feza Programming Club
        </p>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
          <FaBullhorn className="text-5xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No announcements yet</p>
        </div>
      ) : (
        <>
          {/* Mobile View - Card List */}
          <div className="block md:hidden space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-white rounded-lg shadow-md p-5 border border-gray-100"
              >
                <h3 className="text-lg font-semibold text-primary-600 mb-2 line-clamp-2">
                  {announcement.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                  {announcement.content}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <FaCalendar className="text-primary-400" />
                    <span>{formatDate(announcement.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleWhatsAppShare(announcement)}
                      className="text-green-600 hover:text-green-700"
                      title="Share on WhatsApp"
                    >
                      <FaWhatsapp size={20} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAnnouncement(announcement);
                      }}
                      className="text-primary-600 text-sm font-medium"
                    >
                      Read more →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View - Split Layout */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {/* Left Column - Announcements List */}
            <div className="col-span-1">
              <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-24">
                <div className="p-4 bg-primary-600 text-white">
                  <h2 className="font-semibold flex items-center gap-2">
                    <FaBullhorn />
                    Latest Announcements
                  </h2>
                </div>
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      onClick={() => setSelectedAnnouncement(announcement)}
                      className={`p-4 cursor-pointer transition ${
                        selectedAnnouncement?.id === announcement.id
                          ? 'bg-primary-50 border-l-4 border-primary-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <h3 className={`font-medium mb-1 ${
                        selectedAnnouncement?.id === announcement.id
                          ? 'text-primary-600'
                          : 'text-gray-800'
                      }`}>
                        {announcement.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                        {announcement.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <FaCalendar className="text-xs" />
                          <span>{formatDate(announcement.created_at)}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWhatsAppShare(announcement);
                          }}
                          className="text-green-600 hover:text-green-700"
                          title="Share on WhatsApp"
                        >
                          <FaWhatsapp size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Selected Announcement */}
            <div className="col-span-2">
              {selectedAnnouncement ? (
                <div className="bg-white rounded-lg shadow-md p-8">
                  <h1 className="text-3xl font-bold text-primary-600 mb-4">
                    {selectedAnnouncement.title}
                  </h1>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 pb-6 border-b">
                    <FaCalendar className="text-primary-400" />
                    <span>{formatDate(selectedAnnouncement.created_at)}</span>
                    <span className="mx-2">•</span>
                    <FaClock className="text-primary-400" />
                    <span>Club Announcement</span>
                  </div>

                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-8">
                    {selectedAnnouncement.content}
                  </div>

                  {/* Share Options */}
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm text-gray-600 mb-3">Share this announcement:</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleWhatsAppShare(selectedAnnouncement)}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                      >
                        <FaWhatsapp size={18} />
                        <span>Share on WhatsApp</span>
                      </button>
                      <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                      >
                        <span>Copy Link</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <FaBullhorn className="text-5xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Select an Announcement
                  </h3>
                  <p className="text-gray-500">
                    Click on an announcement from the list to read more
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Modal for Mobile - When announcement selected */}
          {selectedAnnouncement && (
            <div className="fixed inset-0 bg-white z-50 overflow-y-auto md:hidden">
              <div className="p-5">
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="flex items-center gap-2 text-gray-600 mb-4"
                >
                  <FaArrowLeft />
                  <span>Back to announcements</span>
                </button>
                
                <div className="bg-white rounded-lg">
                  <h1 className="text-2xl font-bold text-primary-600 mb-3">
                    {selectedAnnouncement.title}
                  </h1>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 pb-4 border-b">
                    <FaCalendar />
                    <span>{formatDate(selectedAnnouncement.created_at)}</span>
                  </div>

                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-6">
                    {selectedAnnouncement.content}
                  </div>

                  {/* Mobile Share Options */}
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => handleWhatsAppShare(selectedAnnouncement)}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg flex items-center justify-center gap-2"
                    >
                      <FaWhatsapp size={20} />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="flex-1 bg-gray-600 text-white py-3 rounded-lg"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AnnouncementsPage;
