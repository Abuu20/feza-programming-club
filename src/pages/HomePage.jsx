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
    <div className="group relative overflow-hidden rounded-2xl aspect-square shadow-lg transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:-translate-y-2">
      {member.photo_url
        ? <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
        : <div className={`w-full h-full ${bgs[index % bgs.length]} flex items-center justify-center`}>
            <span className="text-white font-black text-3xl">{member.name?.[0]?.toUpperCase() || "?"}</span>
          </div>}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
        <p className="text-white font-bold text-sm leading-tight">{member.name}</p>
        <p className="text-white/70 text-xs">{member.role || "Member"}</p>
      </div>
    </div>
  );
};

// ── Feature card ──────────────────────────────────────────────────
const FeatureCard = ({ emoji, title, desc, link, color }) => (
  <Link to={link}
    className="group relative bg-white rounded-3xl p-6 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 overflow-hidden">
    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 -translate-y-8 translate-x-8 bg-gradient-to-br ${color}`} />
    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
      <span className="text-2xl">{emoji}</span>
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed mb-4">{desc}</p>
    <div className={`flex items-center gap-2 text-sm font-semibold bg-gradient-to-r ${color} bg-clip-text text-transparent group-hover:gap-3 transition-all`}>
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
  const { activities, loading: loadingActivities } = useActivities();
  const navigate = useNavigate();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [ann, mems, lb, sm, sc, sl, ss] = await Promise.all([
      announcementsService.getLatest(4),
      supabase.from("members").select("id,name,photo_url,role,grade,status").eq("status","active").order("display_order").limit(12),
      supabase.from("challenge_submissions").select("user_id,points_earned,members(name,photo_url)").eq("status","correct").limit(200),
      supabase.from("members").select("*",{count:"exact",head:true}).eq("status","active"),
      supabase.from("challenges").select("*",{count:"exact",head:true}).eq("is_active",true),
      supabase.from("curriculum").select("*",{count:"exact",head:true}).eq("is_published",true),
      supabase.from("challenge_submissions").select("*",{count:"exact",head:true}),
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
  };

  const handleWhatsApp = (a) => {
    const text = `*${a.title}*\n\n${a.content?.substring(0,100)}...\n\nFeza Code Club`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative min-h-screen bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-700 overflow-hidden flex items-center">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-20 left-8 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 text-xs font-mono hidden lg:block" style={{animation:"bounce 3s infinite"}}>
          <div className="text-blue-300">def</div> <span className="text-yellow-300">solve</span>():
          <div className="ml-2 text-green-300">print(<span className="text-orange-300">"Hello!"</span>)</div>
        </div>
        <div className="container-custom relative z-10 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/20 px-4 py-2 rounded-full mb-6">
                <FaFire className="text-secondary-400 animate-pulse" />
                <span className="text-white text-sm font-semibold">Feza Boys' Programming Club</span>
                <span className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
                Learn.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 to-yellow-300">Build.</span><br />
                <span className="text-white/80">Compete.</span>
              </h1>
              <p className="text-xl text-primary-100 mb-8 max-w-lg leading-relaxed">
                Tanzania's most active school programming club. Master Python, solve real challenges, and build your future — one line of code at a time.
              </p>
              <div className="flex flex-wrap gap-4 mb-10">
                <button onClick={() => navigate("/student/register")}
                  className="group flex items-center gap-3 bg-secondary-500 hover:bg-secondary-400 text-primary-900 px-8 py-4 rounded-2xl font-black text-lg transition-all duration-300 hover:scale-105 shadow-2xl shadow-secondary-500/40">
                  <FaRocket className="group-hover:rotate-12 transition-transform" /> Join the Club
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => navigate("/curriculum")}
                  className="flex items-center gap-3 bg-white text-primary-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg">
                  <AcademicCapIcon className="w-5 h-5" /> View Curriculum
                </button>
              </div>
              <div className="flex flex-wrap gap-6">
                {[{val:stats.members,label:"Members",icon:"👥"},{val:stats.lessons,label:"Lessons",icon:"📚"},{val:stats.submissions,label:"Submissions",icon:"⚡"}].map((s,i)=>(
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-2xl">{s.icon}</span>
                    <div>
                      <div className="text-2xl font-black text-white"><Counter end={s.val} suffix="+" /></div>
                      <div className="text-primary-200 text-xs">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              {members.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {members.slice(0,9).map((m,i) => (
                    <div key={m.id} className="relative overflow-hidden rounded-2xl aspect-square shadow-xl">
                      {m.photo_url
                        ? <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover" />
                        : <div className={`w-full h-full flex items-center justify-center font-black text-2xl text-white ${["bg-blue-500","bg-purple-600","bg-green-600","bg-orange-500","bg-pink-600","bg-teal-600","bg-red-500","bg-indigo-600","bg-yellow-600"][i%9]}`}>
                            {m.name?.[0]?.toUpperCase()||"?"}
                          </div>}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-white text-xs font-semibold truncate">{m.name?.split(" ")[0]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {["👨‍💻","👩‍💻","🧑‍💻","💻","🐍","⚡","🏆","🚀","🎯"].map((e,i)=>(
                    <div key={i} className={`aspect-square rounded-2xl flex items-center justify-center text-4xl ${["bg-blue-500/40","bg-purple-500/40","bg-green-500/40","bg-orange-500/40","bg-pink-500/40","bg-teal-500/40","bg-red-500/40","bg-indigo-500/40","bg-yellow-500/40"][i]}`}>{e}</div>
                  ))}
                </div>
              )}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-2xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center">
                  <FaCode className="text-white text-xl" />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-sm">100% Free</p>
                  <p className="text-gray-400 text-xs">Open to all Feza students</p>
                </div>
              </div>
              {leaderboard[0] && (
                <div className="absolute -top-4 -right-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-2xl p-3 flex items-center gap-2">
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
      <section className="bg-gray-900 py-8">
        <div className="container-custom grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[{val:stats.members,suffix:"+",label:"Active Members",icon:"👥"},{val:stats.challenges,suffix:"+",label:"Challenges",icon:"🏆"},{val:stats.lessons,suffix:"+",label:"Python Lessons",icon:"📚"},{val:stats.submissions,suffix:"+",label:"Code Submitted",icon:"⚡"}].map((s,i)=>(
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-2xl">{s.icon}</span>
              <div className="text-3xl md:text-4xl font-black text-white"><Counter end={s.val} suffix={s.suffix} /></div>
              <div className="text-gray-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ANNOUNCEMENTS ─────────────────────────────────────────── */}
      {announcements.length > 0 && (
        <section className="py-20 bg-white">
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
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4"><FaLightbulb size={13}/> Everything You Need</div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Built for Student Coders</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">From your first "Hello World" to building real projects — we have every tool you need.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f,i) => <FeatureCard key={i} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── MEMBERS SHOWCASE ──────────────────────────────────────── */}
      {members.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container-custom">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-3"><FaUsers size={13}/> Our Community</div>
                <h2 className="text-4xl font-black text-gray-900">Meet the Coders</h2>
                <p className="text-gray-500 mt-2">The brilliant minds of Feza Programming Club</p>
              </div>
              <Link to="/members" className="hidden md:flex items-center gap-2 text-primary-600 font-semibold hover:gap-3 transition-all">All members <FaArrowRight size={14}/></Link>
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
      <section className="py-20 bg-white">
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
        <section className="py-20 bg-gray-50">
          <div className="container-custom">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-3"><CalendarIcon className="w-4 h-4"/> Events</div>
                <h2 className="text-4xl font-black text-gray-900">Latest Activities</h2>
              </div>
              <Link to="/activities" className="hidden md:flex items-center gap-2 text-primary-600 font-semibold hover:gap-3 transition-all">All events <FaArrowRight size={14}/></Link>
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

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-700 relative overflow-hidden">
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
            {["100% Free to Join","No Experience Needed","Learn at Your Own Pace","Real Projects & Certificates"].map((b,i)=>(
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