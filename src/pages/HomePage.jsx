import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { announcementsService } from '../services/announcements';
import { useActivities } from '../hooks/useActivities';
import { formatDate } from '../utils/helpers';
import {
  FaBullhorn, FaCalendar, FaCode,
  FaTrophy, FaFire, FaStar, FaUsers,
  FaArrowRight, FaQuoteLeft, FaLightbulb,
  FaRocket, FaHeart, FaCheckCircle, FaWhatsapp
} from 'react-icons/fa';
import {
  AcademicCapIcon, CalendarIcon, ArrowRightIcon,
} from '@heroicons/react/24/outline';

// ── Animated counter ──────────────────────────────────────────────
const Counter = ({ end, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const tick = () => {
          const p = Math.min((Date.now() - start) / 1500, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setCount(Math.floor(ease * end));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);
  return <span ref={ref}>{count}{suffix}</span>;
};

// ── Member card ───────────────────────────────────────────────────
const MemberCard = ({ member, index }) => {
  const bgs = ['bg-blue-500','bg-purple-600','bg-green-600','bg-orange-500','bg-pink-600','bg-teal-600','bg-red-500','bg-indigo-600','bg-yellow-600'];
  return (
    <div className="member-holo-card group relative overflow-hidden rounded-2xl aspect-square shadow-lg transition-all duration-300 group-hover:shadow-2xl" style={{ animationDelay: `${index * -0.55}s` }}>
      {member.photo_url
        ? <img src={member.photo_url} alt={member.name} className="member-holo-image w-full h-full object-cover" style={{ animationDelay: `${index * -0.7}s` }} />
        : <div className={`w-full h-full ${bgs[index % bgs.length]} flex items-center justify-center`}>
            <span className="text-white font-black text-3xl">{member.name?.[0]?.toUpperCase() || "?"}</span>
          </div>}
      <div className="member-scan" />
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full border border-white/20 bg-slate-950/45 px-2 py-1 text-[8px] font-bold tracking-wider text-cyan-100 backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" /> NODE {String(index + 1).padStart(2, '0')}
      </div>
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
        <p className="text-white font-bold text-sm leading-tight">{member.name}</p>
        <p className="text-white/70 text-xs">{member.role || "Member"}</p>
      </div>
    </div>
  );
};

// ── Feature card ──────────────────────────────────────────────────
const FeatureCard = ({ emoji, title, desc, link, color }) => (
  <Link to={link}
    className="future-card group relative rounded-3xl p-6 overflow-hidden">
    <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-10 blur-2xl bg-gradient-to-br ${color}`} />
    <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
      <span className="text-2xl">{emoji}</span>
    </div>
    <p className="relative text-[10px] uppercase tracking-[0.2em] text-primary-500 font-bold mb-2">Club tools</p>
    <h3 className="relative text-lg font-bold text-slate-950 mb-2">{title}</h3>
    <p className="relative text-slate-500 text-sm leading-relaxed mb-5">{desc}</p>
    <div className={`relative flex items-center gap-2 text-sm font-semibold bg-gradient-to-r ${color} bg-clip-text text-transparent group-hover:gap-3 transition-all`}>
      Explore <FaArrowRight size={12} />
    </div>
  </Link>
);

const FEATURES = [
  { emoji:"📚", title:"Python Curriculum",  desc:"Structured step-by-step lessons from basics to advanced programming.", link:"/curriculum",       color:"from-blue-500 to-indigo-600"  },
  { emoji:"🏆", title:"Coding Challenges",  desc:"Test your skills with timed problems. Earn points and climb the leaderboard.", link:"/challenges",  color:"from-orange-500 to-red-600"   },
  { emoji:"🐍", title:"Code Lab",           desc:"Write and run Python code right in your browser. Experiment freely.", link:"/python-practice",   color:"from-green-500 to-emerald-600"},
  { emoji:"🎯", title:"Live Quizzes",       desc:"10-minute timed quizzes with instant scoring and live leaderboard.", link:"/quiz",              color:"from-purple-500 to-pink-600"  },
  { emoji:"💬", title:"Club Chat",          desc:"Chat with fellow members, share code, ask questions anytime.", link:"/chat",                  color:"from-cyan-500 to-blue-600"    },
  { emoji:"📁", title:"My Files",           desc:"Personal file manager. Store, organise and share your Python projects.", link:"/student/files", color:"from-yellow-500 to-orange-600"},
];

const TESTIMONIALS = [
  { text:"Before this club I had never written a single line of code. Now I can build real programs. This club changed my life.", name:"Feza Student", grade:"Form 3" },
  { text:"The challenges push you to think. Every time I solve one I feel so proud. The leaderboard keeps me motivated!", name:"Club Member", grade:"Form 4" },
  { text:"I love the Python Lab. I can write code and see results immediately without installing anything.", name:"New Member", grade:"Form 2" },
];

const HomePage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [members, setMembers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState({ members:0, challenges:0, lessons:0, submissions:0 });
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [dailyTip, setDailyTip] = useState(null);
  const { activities, loading: loadingActivities } = useActivities();
  const navigate = useNavigate();

  useEffect(() => { fetchAll(); }, []);

  // Gallery auto-slide
  useEffect(() => {
    if (galleryImages.length < 2) return;
    const timer = setInterval(() => setGalleryIdx(p => (p+1) % galleryImages.length), 3500);
    return () => clearInterval(timer);
  }, [galleryImages.length]);

  const fetchAll = async () => {
    const [ann, mems, lb, sm, sc, sl, ss, gal] = await Promise.all([
      announcementsService.getLatest(4),
      supabase.from("members").select("id,name,photo_url,role,grade,status").eq("status","active").order("display_order").limit(12),
      supabase.from("challenge_submissions").select("user_id,points_earned,members(name,photo_url)").eq("status","correct").limit(200),
      supabase.from("members").select("*",{count:"exact",head:true}).eq("status","active"),
      supabase.from("challenges").select("*",{count:"exact",head:true}).eq("is_active",true),
      supabase.from("curriculum").select("*",{count:"exact",head:true}).eq("is_published",true),
      supabase.from("challenge_submissions").select("*",{count:"exact",head:true}),
      supabase.from("gallery").select("id,image_url,title").order("created_at",{ascending:false}).limit(12),
    ]);
    setAnnouncements(ann.data || []);
    setMembers((mems.data||[]).filter(m => m.status !== "inactive"));
    const grouped = {};
    (lb.data||[]).forEach(r => {
      if (!r.user_id) return;
      if (!grouped[r.user_id]) grouped[r.user_id] = { name:r.members?.name, photo:r.members?.photo_url, points:0, solved:0 };
      grouped[r.user_id].points += r.points_earned||0;
      grouped[r.user_id].solved++;
    });
    setLeaderboard(Object.values(grouped).sort((a,b)=>b.points-a.points).slice(0,5));
    setStats({ members:sm.count||0, challenges:sc.count||0, lessons:sl.count||0, submissions:ss.count||0 });
    setGalleryImages((gal.data||[]).filter(g=>g.image_url));
    // Fetch today's tip
    const today = new Date().toISOString().split('T')[0];
    let { data: tip } = await supabase.from('daily_tips').select('*').eq('show_date', today).eq('is_published', true).maybeSingle();
    if (!tip) {
      const { data: all } = await supabase.from('daily_tips').select('*').eq('is_published', true).order('created_at', {ascending: false}).limit(30);
      if (all?.length) {
        const day = Math.floor((new Date() - new Date(new Date().getFullYear(),0,0)) / 86400000);
        tip = all[day % all.length];
      }
    }
    setDailyTip(tip);
  };

  const handleWhatsApp = (a) => {
    const text = `*${a.title}*\n\n${a.content?.substring(0,100)}...\n\nFeza Code Club`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="future-home min-h-screen bg-[#f4f7ff] overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="future-hero relative min-h-screen overflow-hidden flex items-center">
        <div className="future-grid absolute inset-0 opacity-30" />
        <div className="future-scanline absolute inset-x-0 top-0 h-px bg-cyan-200/70" />
        <div className="absolute top-0 left-0 w-[32rem] h-[32rem] bg-cyan-400/15 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[36rem] h-[36rem] bg-indigo-500/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-24 left-8 future-glass rounded-2xl px-4 py-3 text-xs font-mono hidden xl:block animate-float">
          <div className="text-cyan-300">def <span className="text-yellow-300">solve</span>():</div>
          <div className="ml-2 text-emerald-300">return <span className="text-white">your_future</span></div>
        </div>
        <div className="container-custom relative z-10 py-24 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="mb-5 text-xs font-mono font-bold tracking-[0.26em] text-cyan-200/80 uppercase">01 // Feza digital campus</p>
              <div className="inline-flex items-center gap-2 future-glass px-4 py-2 rounded-full mb-7">
                <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75 animate-ping"/><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-300"/></span>
                <span className="text-white text-xs tracking-[0.16em] font-bold uppercase">Feza Boys' Programming Club · Live</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.055em] text-white leading-[0.94] mb-7">
                Learn.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 to-yellow-300">Build.</span><br />
                <span className="text-white/80">Compete.</span>
              </h1>
              <p className="text-lg md:text-xl text-blue-100/85 mb-9 max-w-xl leading-relaxed">
                Tanzania's most active school programming club. Master Python, solve real challenges, and build your future — one line of code at a time.
              </p>
              <div className="flex flex-wrap gap-4 mb-10">
                <button onClick={() => navigate("/student/register")}
                  className="group flex items-center gap-3 bg-secondary-500 hover:bg-secondary-400 text-primary-900 px-8 py-4 rounded-2xl font-black text-lg transition-all duration-300 hover:scale-[1.03] shadow-2xl shadow-secondary-500/30">
                  <FaRocket className="group-hover:rotate-12 transition-transform" /> Join the Club
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => navigate("/curriculum")}
                  className="flex items-center gap-3 future-glass text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all">
                  <AcademicCapIcon className="w-5 h-5" /> View Curriculum
                </button>
              </div>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                {[{val:stats.members,label:"Members",icon:"👥"},{val:stats.lessons,label:"Lessons",icon:"📚"},{val:stats.submissions,label:"Submissions",icon:"⚡"}].map((s,i)=>(
                  <div key={i} className="future-glass rounded-2xl px-3 py-2.5 flex items-center gap-2">
                    <span className="text-lg">{s.icon}</span>
                    <div>
                      <div className="text-2xl font-black text-white"><Counter end={s.val} suffix="+" /></div>
                      <div className="text-blue-200/80 text-[10px] uppercase tracking-wider">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative lg:pl-4">
              <div className="future-orbit future-orbit-one" />
              <div className="future-orbit future-orbit-two" />
              <div className="absolute -inset-4 rounded-[2rem] bg-cyan-400/15 blur-2xl" />
              {members.length > 0 ? (
                <div className="relative grid grid-cols-3 gap-3 p-3 future-glass rounded-[2rem]">
                  {members.slice(0,9).map((m,i) => (
                    <div key={m.id} className="member-holo-card group relative overflow-hidden rounded-2xl aspect-square shadow-xl ring-1 ring-white/15" style={{ animationDelay: `${i * -0.48}s` }}>
                      {m.photo_url
                        ? <img src={m.photo_url} alt={m.name} className="member-holo-image w-full h-full object-cover" style={{ animationDelay: `${i * -0.62}s` }} />
                        : <div className={`w-full h-full flex items-center justify-center font-black text-2xl text-white ${["bg-blue-500","bg-purple-600","bg-green-600","bg-orange-500","bg-pink-600","bg-teal-600","bg-red-500","bg-indigo-600","bg-yellow-600"][i%9]}`}>
                            {m.name?.[0]?.toUpperCase()||"?"}
                          </div>}
                      <div className="member-scan" />
                      <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full border border-white/20 bg-slate-950/50 px-1.5 py-1 text-[7px] font-bold tracking-wider text-cyan-100 backdrop-blur">
                        <span className="h-1 w-1 rounded-full bg-cyan-300 shadow-[0_0_6px_#67e8f9]" /> LIVE
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-white text-xs font-semibold truncate">{m.name?.split(" ")[0]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative grid grid-cols-3 gap-3 p-3 future-glass rounded-[2rem]">
                  {["👨‍💻","👩‍💻","🧑‍💻","💻","🐍","⚡","🏆","🚀","🎯"].map((e,i)=>(
                    <div key={i} className={`aspect-square rounded-2xl flex items-center justify-center text-4xl ${["bg-blue-500/40","bg-purple-500/40","bg-green-500/40","bg-orange-500/40","bg-pink-500/40","bg-teal-500/40","bg-red-500/40","bg-indigo-500/40","bg-yellow-500/40"][i]}`}>{e}</div>
                  ))}
                </div>
              )}
              <div className="absolute -bottom-5 -left-3 sm:-left-5 bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-4 flex items-center gap-3 ring-1 ring-white/70">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-primary-500 rounded-xl flex items-center justify-center">
                  <FaCode className="text-white text-xl" />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-sm">100% Free</p>
                  <p className="text-gray-400 text-xs">Open to all Feza students</p>
                </div>
              </div>
              {leaderboard[0] && (
                <div className="absolute -top-4 -right-3 bg-gradient-to-br from-yellow-300 to-secondary-500 rounded-2xl shadow-2xl p-3 flex items-center gap-2 ring-1 ring-yellow-200">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="text-yellow-900 font-black text-xs">Top Coder</p>
                    <p className="text-yellow-900/80 text-xs">{leaderboard[0].name?.split(" ")[0]}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────── */}
      <section className="relative bg-[#030b19] border-y border-cyan-200/10 py-8 overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{backgroundImage:"linear-gradient(90deg, rgba(34,211,238,.05) 1px, transparent 1px)",backgroundSize:"4rem 100%"}} />
        <div className="container-custom relative grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[{val:stats.members,suffix:"+",label:"Active Members",icon:"👥"},{val:stats.challenges,suffix:"+",label:"Challenges",icon:"🏆"},{val:stats.lessons,suffix:"+",label:"Python Lessons",icon:"📚"},{val:stats.submissions,suffix:"+",label:"Code Submitted",icon:"⚡"}].map((s,i)=>(
            <div key={i} className={`flex flex-col items-center gap-1 relative ${i < 3 ? 'md:after:absolute md:after:right-0 md:after:top-2 md:after:h-12 md:after:w-px md:after:bg-white/10' : ''}`}>
              <span className="text-2xl">{s.icon}</span>
              <div className="text-3xl md:text-4xl font-black text-white"><Counter end={s.val} suffix={s.suffix} /></div>
              <div className="text-gray-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ANNOUNCEMENTS ─────────────────────────────────────────── */}
      {announcements.length > 0 && (
        <section className="future-light-grid py-24">
          <div className="container-custom">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-3"><FaBullhorn size={13}/> Latest Updates</div>
                <h2 className="text-4xl font-black text-gray-900">From the Club</h2>
              </div>
              <Link to="/announcements" className="hidden md:flex items-center gap-2 text-primary-600 font-semibold hover:gap-3 transition-all">View all <FaArrowRight size={14}/></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {announcements.map((a,i) => {
                const gradients = ["from-primary-500 to-indigo-600","from-secondary-500 to-orange-600","from-green-500 to-emerald-600","from-purple-500 to-pink-600"];
                return (
                  <div key={a.id} className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer" onClick={()=>navigate("/announcements")}>
                    <div className={`h-2 bg-gradient-to-r ${gradients[i%4]}`} />
                    <div className="p-5">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[i%4]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}><FaBullhorn className="text-white" size={14}/></div>
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">{a.title}</h3>
                      <p className="text-gray-500 text-sm line-clamp-3 mb-4 leading-relaxed">{a.content}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 flex items-center gap-1"><FaCalendar size={10}/> {formatDate(a.created_at)}</span>
                        <button onClick={e=>{e.stopPropagation();handleWhatsApp(a);}} className="text-green-500 hover:text-green-600 transition p-1"><FaWhatsapp size={18}/></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURES ──────────────────────────────────────────────── */}
      <section className="relative py-24 bg-[#070f23] overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="container-custom">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 px-4 py-1.5 rounded-full text-sm font-semibold mb-4"><FaLightbulb size={13}/> Your coding ecosystem</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">Built for Student Coders</h2>
            <p className="text-xl text-blue-100/60 max-w-2xl mx-auto">From your first "Hello World" to building real projects — every tool is ready for you.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f,i) => <FeatureCard key={i} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── MEMBERS SHOWCASE ──────────────────────────────────────── */}
      {members.length > 0 && (
        <section className="future-void py-24 overflow-hidden">
          <div className="container-custom">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="inline-flex items-center gap-2 border border-emerald-300/25 bg-emerald-300/10 text-emerald-200 px-4 py-1.5 rounded-full text-sm font-semibold mb-3"><FaUsers size={13}/> Our Community</div>
                <h2 className="text-4xl font-black text-white">Meet the Coders</h2>
                <p className="text-blue-100/60 mt-2">The brilliant minds of Feza Programming Club</p>
              </div>
              <Link to="/members" className="hidden md:flex items-center gap-2 text-cyan-300 font-semibold hover:gap-3 transition-all">All members <FaArrowRight size={14}/></Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {members.slice(0,12).map((m,i) => <MemberCard key={m.id} member={m} index={i} />)}
            </div>
            <div className="text-center mt-8">
              <Link to="/members" className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-2xl font-semibold hover:bg-gray-700 transition-all hover:gap-3">
                See all {stats.members} members <FaArrowRight size={14}/>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── LEADERBOARD ───────────────────────────────────────────── */}
      {leaderboard.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-gray-900 to-primary-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{backgroundImage:"radial-gradient(circle at 25% 25%, white 1px, transparent 1px)",backgroundSize:"40px 40px"}} />
          <div className="container-custom relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/30 text-yellow-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-4"><FaFire size={13} className="animate-pulse"/> Live Rankings</div>
                <h2 className="text-4xl font-black text-white mb-4">Top Coders</h2>
                <p className="text-gray-300 mb-8 leading-relaxed">Every challenge you solve earns points. Every quiz you ace climbs the board. Who will be champion?</p>
                <Link to="/challenges" className="inline-flex items-center gap-3 bg-secondary-500 text-primary-900 px-8 py-4 rounded-2xl font-black hover:bg-secondary-400 transition-all hover:scale-105 shadow-xl">
                  <FaTrophy/> Start Competing
                </Link>
              </div>
              <div className="space-y-3">
                {leaderboard.map((entry,rank) => (
                  <div key={rank} className={`flex items-center gap-4 rounded-2xl p-4 border transition-all ${rank===0?"bg-gradient-to-r from-yellow-500/20 to-orange-500/10 border-yellow-500/30":"bg-white/5 border-white/10 hover:bg-white/10"}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 ${rank===0?"bg-yellow-400 text-yellow-900":rank===1?"bg-gray-400 text-white":rank===2?"bg-orange-500 text-white":"bg-white/10 text-gray-400"}`}>
                      {rank===0?"🥇":rank===1?"🥈":rank===2?"🥉":rank+1}
                    </div>
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                      {entry.photo
                        ? <img src={entry.photo} alt={entry.name} className="w-full h-full object-cover"/>
                        : <div className="w-full h-full bg-primary-600 flex items-center justify-center text-white font-bold">{entry.name?.[0]?.toUpperCase()||"?"}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate">{entry.name||`Student ${rank+1}`}</p>
                      <p className="text-gray-400 text-xs">{entry.solved} solved</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-black text-xl ${rank===0?"text-yellow-400":"text-white"}`}>{entry.points}</p>
                      <p className="text-gray-500 text-xs">pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
      <section className="future-light-grid py-24">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4"><FaHeart size={13}/> Student Voices</div>
            <h2 className="text-4xl font-black text-gray-900">What Members Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t,i) => (
              <div key={i} className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <FaQuoteLeft className="text-primary-200 text-3xl mb-4"/>
                <p className="text-gray-700 leading-relaxed mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">F</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.grade}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">{Array(5).fill(0).map((_,j)=><FaStar key={j} className="text-yellow-400" size={12}/>)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACTIVITIES ────────────────────────────────────────────── */}
      {!loadingActivities && activities?.length > 0 && (
        <section className="future-void py-24 overflow-hidden">
          <div className="container-custom">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="inline-flex items-center gap-2 border border-cyan-300/25 bg-cyan-300/10 text-cyan-200 px-4 py-1.5 rounded-full text-sm font-semibold mb-3"><CalendarIcon className="w-4 h-4"/> Events</div>
                <h2 className="text-4xl font-black text-white">Latest Activities</h2>
              </div>
              <Link to="/activities" className="hidden md:flex items-center gap-2 text-cyan-300 font-semibold hover:gap-3 transition-all">All events <FaArrowRight size={14}/></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activities.slice(0,3).map(a => (
                <div key={a.id} onClick={()=>navigate(`/activities/${a.id}`)} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
                  <div className="relative h-48 overflow-hidden bg-primary-100">
                    {a.image_url
                      ? <img src={a.image_url} alt={a.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                      : <div className="w-full h-full flex items-center justify-center text-5xl">📅</div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
                    <div className="absolute bottom-3 left-4 text-white text-xs flex items-center gap-1.5"><FaCalendar size={10}/> {formatDate(a.date)}</div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">{a.title}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2">{a.description}</p>
                    <div className="mt-4 flex items-center gap-2 text-primary-600 font-semibold text-sm">Learn more <FaArrowRight size={12} className="group-hover:translate-x-1 transition-transform"/></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}


      {/* ── DAILY PYTHON TIP ───────────────────────────────────── */}
      {dailyTip && (
        <section className="future-light-grid py-20">
          <div className="container-custom">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-3">
                💡 Daily Python Tip
              </div>
              <h2 className="text-3xl font-black text-gray-900">Today's Learning Moment</h2>
            </div>
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-purple-100">
                {/* Header */}
                <div className={`p-5 flex items-center gap-4 ${
                  dailyTip.category==='trick' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' :
                  dailyTip.category==='motivation' ? 'bg-gradient-to-r from-orange-500 to-red-600' :
                  dailyTip.category==='syntax' ? 'bg-gradient-to-r from-green-600 to-teal-600' :
                  'bg-gradient-to-r from-blue-600 to-cyan-600'}`}>
                  <div className="text-4xl">
                    {dailyTip.category==='trick'?'✨':dailyTip.category==='motivation'?'🔥':dailyTip.category==='syntax'?'🐍':'🚀'}
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                      {dailyTip.category==='trick'?'Python Trick':dailyTip.category==='motivation'?'Stay Motivated':dailyTip.category==='syntax'?'Python Syntax':'Project Idea'}
                      {dailyTip.tag && ` · #${dailyTip.tag}`}
                    </p>
                    <p className="text-white font-black text-xl">{dailyTip.title}</p>
                  </div>
                </div>
                {/* Body */}
                <div className="p-6">
                  {dailyTip.type === 'image' && dailyTip.image_url ? (
                    <img src={dailyTip.image_url} alt={dailyTip.title}
                      className="w-full rounded-2xl border border-gray-100 select-none"
                      draggable={false} onContextMenu={e=>e.preventDefault()}
                      style={{userSelect:'none',WebkitUserSelect:'none',pointerEvents:'none'}} />
                  ) : (
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{dailyTip.content}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-4 text-right">
                    📅 {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── USEFUL PYTHON SITES ─────────────────────────────────── */}
      <section className="future-void py-24 overflow-hidden">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 border border-cyan-300/25 bg-cyan-300/10 text-cyan-200 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              🌐 Learning Resources
            </div>
            <h2 className="text-4xl font-black text-white mb-3">Useful Python Sites</h2>
            <p className="text-blue-100/60 max-w-xl mx-auto">Hand-picked by your teachers — the best places to keep learning Python beyond the club</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { name:"PyPI", url:"https://pypi.org", emoji:"📦", color:"from-blue-500 to-blue-700", desc:"Python Package Index — find and install any Python library" },
              { name:"Python Docs", url:"https://docs.python.org", emoji:"📖", color:"from-yellow-500 to-orange-500", desc:"Official Python documentation and language reference" },
              { name:"Turtle Graphics", url:"https://docs.python.org/3/library/turtle.html", emoji:"🐢", color:"from-green-500 to-teal-600", desc:"Draw shapes and patterns with Python's turtle module" },
              { name:"Reeborg's World", url:"https://reeborg.ca/reeborg.html", emoji:"🤖", color:"from-purple-500 to-purple-700", desc:"Learn programming by guiding a robot through mazes" },
              { name:"W3Schools Python", url:"https://www.w3schools.com/python", emoji:"🏫", color:"from-indigo-500 to-indigo-700", desc:"Beginner-friendly Python tutorials with live examples" },
              { name:"Programiz", url:"https://www.programiz.com/python-programming", emoji:"🎓", color:"from-cyan-500 to-blue-600", desc:"Clear Python tutorials, examples and online compiler" },
              { name:"CS50 Python", url:"https://cs50.harvard.edu/python", emoji:"🏛️", color:"from-red-500 to-red-700", desc:"Harvard's free Python course — world class and free" },
              { name:"Kaggle", url:"https://www.kaggle.com/learn/python", emoji:"📊", color:"from-teal-500 to-green-600", desc:"Learn Python with data science and real datasets" },
              { name:"Automate Boring Stuff", url:"https://automatetheboringstuff.com", emoji:"⚙️", color:"from-gray-600 to-gray-800", desc:"Free book — use Python to automate real tasks" },
              { name:"CheckiO", url:"https://checkio.org", emoji:"🗺️", color:"from-orange-500 to-yellow-500", desc:"Learn Python by solving game-based coding challenges" },
              { name:"Python Tutor", url:"https://pythontutor.com", emoji:"🔍", color:"from-pink-500 to-rose-600", desc:"Visualize your code step by step — perfect for debugging" },
              { name:"Replit", url:"https://replit.com", emoji:"⚡", color:"from-violet-500 to-purple-600", desc:"Code Python online and share your projects instantly" },
            ].map((site, i) => (
              <a key={i} href={site.url} target="_blank" rel="noopener noreferrer"
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl
                  transition-all duration-300 hover:-translate-y-2 overflow-hidden block">
                {/* Top gradient bar */}
                <div className={`h-1.5 bg-gradient-to-r ${site.color}`} />
                <div className="p-5">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${site.color}
                    flex items-center justify-center text-2xl mb-4 shadow-md
                    group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    {site.emoji}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1.5">{site.name}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed mb-3">{site.desc}</p>
                  <div className={`text-xs font-semibold flex items-center gap-1.5 bg-gradient-to-r ${site.color} bg-clip-text text-transparent`}>
                    Visit site <FaArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </a>
            ))}
          </div>
          <p className="text-center text-xs text-blue-100/45 mt-8">
            These are external sites — clicking will open them in a new tab
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
      <section className="future-hero py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 50% 50%, white 1px, transparent 1px)",backgroundSize:"30px 30px"}}/>
        <div className="container-custom relative z-10 text-center">
          <div className="text-6xl mb-6 animate-bounce">🐍</div>
          <h2 className="text-5xl md:text-6xl font-black text-white mb-4">
            Ready to Start<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 to-yellow-300">Your Journey?</span>
          </h2>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto leading-relaxed">Join hundreds of Feza students already learning, competing, and building the future. Your first line of code is waiting.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={()=>navigate("/student/register")} className="flex items-center gap-3 bg-secondary-500 hover:bg-secondary-400 text-primary-900 px-10 py-5 rounded-2xl font-black text-xl transition-all hover:scale-105 shadow-2xl shadow-secondary-500/50">
              <FaRocket/> Join Now — It's Free
            </button>
            <button onClick={()=>navigate("/student/login")} className="flex items-center gap-3 bg-white text-primary-700 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-gray-100 transition-all shadow-lg">
              Already a Member? Login
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-12">
            {["No Experience Needed","Learn at Your Own Pace","Real Projects & Certificates"].map((b,i)=>(
              <div key={i} className="flex items-center gap-2 text-white/70 text-sm">
                <FaCheckCircle className="text-green-400"/> {b}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
