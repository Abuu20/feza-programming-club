import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CalendarIcon, UserGroupIcon, AcademicCapIcon,
  LightBulbIcon, CodeBracketIcon, ChatBubbleLeftRightIcon, ArrowRightIcon
} from '@heroicons/react/24/outline';
import {
  FaBullhorn, FaWhatsapp, FaCalendar, FaGraduationCap,
  FaCode, FaTrophy, FaCommentDots, FaFire, FaStar, FaUsers
} from 'react-icons/fa';
import { announcementsService } from '../services/announcements';
import { useActivities } from '../hooks/useActivities';
import { supabase } from '../services/supabase';
import { formatDate } from '../utils/helpers';
import Loader from '../components/common/Loader';

const HomePage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState({ members: 0, challenges: 0, lessons: 0 });
  const { activities, loading: loadingActivities } = useActivities();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnnouncements();
    fetchLeaderboard();
    fetchStats();
  }, []);

  const fetchAnnouncements = async () => {
    const { data } = await announcementsService.getLatest(3);
    setAnnouncements(data || []);
    setLoadingAnnouncements(false);
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('challenge_submissions')
      .select('user_id, points_earned, members(name, photo_url)')
      .eq('status', 'correct')
      .order('points_earned', { ascending: false })
      .limit(5);
    // group by user
    const grouped = {};
    (data || []).forEach(row => {
      const uid = row.user_id;
      if (!uid) return;
      if (!grouped[uid]) grouped[uid] = {
        name: row.members?.name || null,
        photo_url: row.members?.photo_url || null,
        points: 0, solved: 0
      };
      grouped[uid].points += row.points_earned || 0;
      grouped[uid].solved += 1;
    });
    setLeaderboard(Object.values(grouped).sort((a,b) => b.points - a.points).slice(0, 5));
  };

  const fetchStats = async () => {
    const [{ count: members }, { count: challenges }, { count: lessons }] = await Promise.all([
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('challenges').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('curriculum').select('*', { count: 'exact', head: true }).eq('is_published', true),
    ]);
    setStats({ members: members || 0, challenges: challenges || 0, lessons: lessons || 0 });
  };

  const handleWhatsAppShare = (announcement) => {
    const text = `*${announcement.title}*\n\n${announcement.content.substring(0, 100)}...\n\nRead more: ${window.location.origin}/announcements`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const latestActivities = activities?.slice(0, 3) || [];

  const FEATURES = [
    { icon: CodeBracketIcon, title: 'Learn Python', desc: 'Master Python from basics to advanced with our interactive step-by-step curriculum and live code editor.', link: '/curriculum', cta: 'Start learning', color: 'text-primary-500', bg: 'bg-primary-50 group-hover:bg-primary-100' },
    { icon: FaTrophy, title: 'Coding Challenges', desc: 'Test your skills against real problems. Earn points, climb the leaderboard, and prove your coding abilities.', link: '/challenges', cta: 'Try a challenge', color: 'text-orange-500', bg: 'bg-orange-50 group-hover:bg-orange-100' },
    { icon: UserGroupIcon, title: 'Club Community', desc: 'Connect with fellow coders, share ideas, and collaborate. Our chat lets members help each other 24/7.', link: '/chat', cta: 'Join the chat', color: 'text-green-500', bg: 'bg-green-50 group-hover:bg-green-100' },
    { icon: CalendarIcon, title: 'Club Activities', desc: 'Workshops, hackathons, guest talks, and competitions. Always something exciting happening at Feza.', link: '/activities', cta: 'See events', color: 'text-blue-500', bg: 'bg-blue-50 group-hover:bg-blue-100' },
    { icon: AcademicCapIcon, title: 'Expert Mentors', desc: 'Get guidance from experienced developers who review your code and help you improve faster.', link: '/members', cta: 'Meet mentors', color: 'text-purple-500', bg: 'bg-purple-50 group-hover:bg-purple-100' },
    { icon: LightBulbIcon, title: 'Real Projects', desc: 'Build portfolio-worthy projects that solve real problems and showcase what you have learned.', link: '/gallery', cta: 'See gallery', color: 'text-yellow-500', bg: 'bg-yellow-50 group-hover:bg-yellow-100' },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white opacity-5 rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-secondary-400 opacity-10 rounded-full" />
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-white opacity-5 rounded-full" />

        <div className="container-custom relative py-24 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white bg-opacity-90 px-4 py-2 rounded-full mb-6">
                <FaFire className="text-orange-500 animate-pulse" />
                <span className="text-primary-700 text-sm font-semibold">Feza Boys' Programming Club</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Code. Build.
                <br />
                <span className="text-secondary-400">Compete.</span>
              </h1>
              <p className="text-lg text-primary-100 mb-8 max-w-lg leading-relaxed">
                Join Tanzania's most active school programming club. Learn Python, solve real challenges,
                earn achievements, and connect with fellow coders.
              </p>
              <div className="flex flex-wrap gap-4">
                <button onClick={() => navigate('/student/request')}
                  className="bg-secondary-500 text-primary-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-secondary-400 transition transform hover:scale-105 shadow-lg flex items-center gap-2">
                  Join the Club
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
                <button onClick={() => navigate('/curriculum')}
                  className="bg-white text-primary-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition flex items-center gap-2 shadow">
                  <FaGraduationCap />
                  View Curriculum
                </button>
              </div>
            </div>

            {/* Stats — clean cards, easy to read */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-lg border-b-4 border-blue-500">
                <div className="text-4xl font-extrabold text-blue-600">{stats.members}</div>
                <div className="text-gray-600 font-medium mt-1">Active Members</div>
                <div className="text-xs text-gray-400 mt-0.5">and growing every week</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border-b-4 border-orange-500">
                <div className="text-4xl font-extrabold text-orange-600">{stats.challenges}</div>
                <div className="text-gray-600 font-medium mt-1">Challenges</div>
                <div className="text-xs text-gray-400 mt-0.5">ready for you to solve</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border-b-4 border-green-500">
                <div className="text-4xl font-extrabold text-green-600">{stats.lessons}</div>
                <div className="text-gray-600 font-medium mt-1">Lessons</div>
                <div className="text-xs text-gray-400 mt-0.5">structured Python curriculum</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border-b-4 border-primary-500">
                <div className="text-4xl font-extrabold text-primary-600">100%</div>
                <div className="text-gray-600 font-medium mt-1">Free to Join</div>
                <div className="text-xs text-gray-400 mt-0.5">open to all Feza students</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Live Leaderboard strip ────────────────────────────── */}
      {leaderboard.length > 0 && (
        <section className="bg-gray-900 py-4 overflow-hidden">
          <div className="container-custom flex items-center gap-6 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 text-yellow-400 font-bold whitespace-nowrap flex-shrink-0">
              <FaFire className="animate-pulse" /> LIVE LEADERBOARD
            </div>
            {leaderboard.map((s, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full flex-shrink-0">
                <span className="text-sm">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
                <span className="text-white text-sm font-medium">{s.name || `#${i+1}`}</span>
                <span className="text-yellow-400 text-xs">{s.points} pts</span>
              </div>
            ))}
            <Link to="/challenges" className="text-primary-400 hover:text-primary-300 text-sm whitespace-nowrap flex-shrink-0 flex items-center gap-1">
              Full leaderboard <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>
        </section>
      )}

      {/* ── Announcements ────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-100 px-4 py-2 rounded-full mb-3">
                <FaBullhorn className="text-primary-600" />
                <span className="text-sm font-semibold text-primary-600">Club Updates</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Latest from the Club</h2>
            </div>
            <button onClick={() => navigate('/announcements')}
              className="mt-4 md:mt-0 text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-2 border border-primary-200 px-4 py-2 rounded-lg hover:bg-primary-50 transition">
              View All <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>

          {loadingAnnouncements ? <Loader /> : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {announcements.length > 0 ? announcements.map((a, i) => {
                const colors = [
                  { bar: 'bg-primary-500', icon: 'bg-primary-100 text-primary-600' },
                  { bar: 'bg-secondary-500', icon: 'bg-secondary-100 text-secondary-600' },
                  { bar: 'bg-green-500', icon: 'bg-green-100 text-green-600' },
                ];
                const c = colors[i % 3];
                return (
                  <div key={a.id} onClick={() => navigate('/announcements')}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-100 overflow-hidden group">
                    <div className={`h-1.5 ${c.bar}`} />
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-2.5 rounded-xl ${c.icon}`}>
                          <FaBullhorn size={16} />
                        </div>
                        <button onClick={e => { e.stopPropagation(); handleWhatsAppShare(a); }}
                          className="text-gray-400 hover:text-green-600 transition p-1">
                          <FaWhatsapp size={18} />
                        </button>
                      </div>
                      <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-primary-600 transition text-lg">
                        {a.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">{a.content}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <FaCalendar className="text-primary-400" />
                          {formatDate(a.created_at)}
                        </div>
                        <span className="text-primary-600 font-medium flex items-center gap-1">
                          Read more <ArrowRightIcon className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-3 text-center py-12 bg-gray-50 rounded-2xl">
                  <FaBullhorn className="text-4xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No announcements yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need to Grow</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From structured lessons to live competitions — Feza Programming Club has it all.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f, i) => (
              <Link key={i} to={f.link}
                className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-8 border border-gray-100 block">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition ${f.bg}`}>
                  {typeof f.icon === 'function' && f.icon.toString().includes('svg')
                    ? <f.icon className={`w-7 h-7 ${f.color}`} />
                    : <f.icon className={`text-2xl ${f.color}`} />
                  }
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-4">{f.desc}</p>
                <span className={`text-sm font-semibold flex items-center gap-1 ${f.color}`}>
                  {f.cta} <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Latest Activities ────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">Latest Activities</h2>
              <p className="text-gray-600">Join our upcoming events and workshops</p>
            </div>
            <button onClick={() => navigate('/activities')}
              className="mt-4 md:mt-0 text-primary-600 font-semibold flex items-center gap-2 hover:gap-3 transition-all">
              View All <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>

          {loadingActivities ? <Loader /> : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestActivities.length > 0 ? latestActivities.map(activity => (
                <div key={activity.id} onClick={() => navigate(`/activities/${activity.id}`)}
                  className="group bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all border border-gray-100">
                  <div className="relative h-52 overflow-hidden bg-primary-100">
                    {activity.image_url ? (
                      <img src={activity.image_url} alt={activity.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <CalendarIcon className="w-16 h-16 text-primary-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white flex items-center gap-2 text-sm">
                      <FaCalendar size={12} /> {formatDate(activity.date)}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{activity.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{activity.description}</p>
                    <span className="text-primary-600 font-medium flex items-center gap-1 text-sm">
                      Learn more <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              )) : (
                <div className="col-span-3 text-center py-16 bg-gray-50 rounded-2xl">
                  <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No upcoming activities yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-r from-primary-700 to-primary-500">
        <div className="container-custom text-center">
          <div className="text-5xl mb-6">🐍</div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Ready to Start Coding?</h2>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Join hundreds of students already learning, competing, and growing together at Feza Programming Club.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => navigate('/student/request')}
              className="bg-secondary-500 text-primary-700 px-10 py-4 rounded-xl font-bold text-lg hover:bg-secondary-400 transition transform hover:scale-105 shadow-lg">
              Join Now — It's Free
            </button>
            <button onClick={() => navigate('/student/login')}
              className="bg-white text-primary-700 px-10 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition shadow">
              Already a Member? Login
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;