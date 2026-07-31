import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { announcementsService } from '../services/announcements';
import { useActivities } from '../hooks/useActivities';
import { formatDate } from '../utils/helpers';
import { FaWhatsapp, FaArrowRight, FaTrophy, FaFire, FaStar, FaUsers, FaQuoteLeft } from 'react-icons/fa';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

// ─── Typewriter ───────────────────────────────────────────────────────────────
const Typewriter = ({ words, speed = 80, pause = 1800 }) => {
  const [text, setText] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = words[wordIdx % words.length];
    const timeout = setTimeout(() => {
      if (!deleting) {
        setText(word.slice(0, text.length + 1));
        if (text.length + 1 === word.length) setTimeout(() => setDeleting(true), pause);
      } else {
        setText(word.slice(0, text.length - 1));
        if (text.length === 0) { setDeleting(false); setWordIdx(i => i + 1); }
      }
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(timeout);
  }, [text, deleting, wordIdx, words, speed, pause]);
  return (
    <span>
      {text}
      <span className="animate-pulse text-secondary-400">|</span>
    </span>
  );
};

// ─── Animated counter ─────────────────────────────────────────────────────────
const Counter = ({ end, suffix = '' }) => {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  const done = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        const t0 = Date.now();
        const tick = () => {
          const p = Math.min((Date.now() - t0) / 1600, 1);
          setN(Math.floor((1 - Math.pow(1 - p, 4)) * end));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const HomePage = () => {
  const navigate = useNavigate();
  const { activities } = useActivities();
  const [members, setMembers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [dailyTip, setDailyTip] = useState(null);
  const [sites, setSites] = useState([]);
  const [stats, setStats] = useState({ members: 0, lessons: 0, submissions: 0, challenges: 0 });
  const heroRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  // Parallax
  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const today = new Date().toISOString().split('T')[0];
    const [ann, mems, lb, gal, tip, allTips, sitesData, sm, sc, sl, ss] = await Promise.all([
      announcementsService.getLatest(3),
      supabase.from('members').select('id,name,photo_url,role,grade').eq('status','active').order('display_order').limit(12),
      supabase.from('challenge_submissions').select('user_id,points_earned,members(name,photo_url)').eq('status','correct').limit(300),
      supabase.from('gallery').select('id,image_url,title').order('created_at',{ascending:false}).limit(10),
      supabase.from('daily_tips').select('*').eq('show_date',today).eq('is_published',true).maybeSingle(),
      supabase.from('daily_tips').select('*').eq('is_published',true).order('created_at',{ascending:false}).limit(30),
      supabase.from('useful_sites').select('*').eq('is_published',true).order('display_order').limit(20),
      supabase.from('members').select('*',{count:'exact',head:true}).eq('status','active'),
      supabase.from('challenges').select('*',{count:'exact',head:true}).eq('is_active',true),
      supabase.from('curriculum').select('*',{count:'exact',head:true}).eq('is_published',true),
      supabase.from('challenge_submissions').select('*',{count:'exact',head:true}),
    ]);
    setAnnouncements(ann.data || []);
    setMembers((mems.data || []).filter(Boolean));
    setGallery((gal.data || []).filter(g => g.image_url));
    setSites(sitesData.data || []);
    setStats({ members: sm.count||0, challenges: sc.count||0, lessons: sl.count||0, submissions: ss.count||0 });

    // Daily tip
    let t = tip.data;
    if (!t && allTips.data?.length) {
      const day = Math.floor((new Date() - new Date(new Date().getFullYear(),0,0)) / 86400000);
      t = allTips.data[day % allTips.data.length];
    }
    setDailyTip(t);

    // Leaderboard
    const grouped = {};
    (lb.data||[]).forEach(r => {
      if (!r.user_id) return;
      if (!grouped[r.user_id]) grouped[r.user_id] = { name: r.members?.name, photo: r.members?.photo_url, pts: 0, solved: 0 };
      grouped[r.user_id].pts += r.points_earned || 0;
      grouped[r.user_id].solved++;
    });
    setLeaderboard(Object.values(grouped).sort((a,b)=>b.pts-a.pts).slice(0,5));
  };

  // Gallery auto-advance
  useEffect(() => {
    if (gallery.length < 2) return;
    const t = setInterval(() => setGalleryIdx(i => (i+1) % gallery.length), 4000);
    return () => clearInterval(t);
  }, [gallery.length]);

  const TIP_STYLE = {
    trick:      { bar: 'from-violet-600 to-purple-700', badge: 'bg-violet-100 text-violet-700', icon: '✨' },
    motivation: { bar: 'from-orange-500 to-red-600',    badge: 'bg-orange-100 text-orange-700', icon: '🔥' },
    syntax:     { bar: 'from-emerald-500 to-green-700', badge: 'bg-emerald-100 text-emerald-700',icon: '🐍' },
    project:    { bar: 'from-blue-500 to-indigo-700',   badge: 'bg-blue-100 text-blue-700',     icon: '🚀' },
  };

  return (
    <div className="bg-white overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════
          HERO  — Full viewport, dark, typographic, honest
      ═══════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0a0a0f 0%,#0d1b3e 50%,#0a0a0f 100%)' }}>

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage:'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize:'64px 64px' }} />

        {/* Blurred colour orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] pointer-events-none"
          style={{ background:'radial-gradient(circle,#3b82f6,transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-15 blur-[100px] pointer-events-none"
          style={{ background:'radial-gradient(circle,#f59e0b,transparent)' }} />

        <div className="container-custom relative z-10 py-32">
          <div className="max-w-4xl">

            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex -space-x-2">
                {members.slice(0,4).map((m,i) => (
                  <div key={m.id} className="w-8 h-8 rounded-full border-2 border-gray-800 overflow-hidden"
                    style={{ zIndex: 4-i }}>
                    {m.photo_url
                      ? <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">{m.name?.[0]}</div>}
                  </div>
                ))}
              </div>
              <span className="text-gray-400 text-sm">
                <span className="text-white font-semibold">{stats.members} students</span> already coding
              </span>
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            </div>

            {/* Main headline */}
            <h1 className="font-black leading-[1.05] mb-6" style={{ fontSize:'clamp(2.8rem,6vw,5.5rem)', letterSpacing:'-0.03em' }}>
              <span className="text-white">Where Feza students</span><br />
              <span className="text-white">learn to </span>
              <span style={{ background:'linear-gradient(90deg,#3b82f6,#8b5cf6,#ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                <Typewriter words={['think.','code.','build.','compete.','create.']} speed={90} pause={1600} />
              </span>
            </h1>

            <p className="text-gray-400 text-xl leading-relaxed mb-10 max-w-2xl" style={{ fontWeight: 400 }}>
              Tanzania's most active school programming club. From your first <code className="text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded text-base">print("Hello")</code> to
              building real projects — this is where it starts.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mb-16">
              <button onClick={() => navigate('/student/register')}
                className="group flex items-center gap-3 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all duration-200 hover:scale-[1.03]"
                style={{ background:'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow:'0 0 40px rgba(99,102,241,0.4)' }}>
                Join the club
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => navigate('/challenges')}
                className="flex items-center gap-3 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 font-semibold px-8 py-4 rounded-2xl text-lg transition-all duration-200">
                Try a challenge
              </button>
            </div>

            {/* Live stats bar */}
            <div className="flex flex-wrap gap-8">
              {[
                { val: stats.members,     label:'Active members',  suf:'' },
                { val: stats.lessons,     label:'Python lessons',  suf:'' },
                { val: stats.submissions, label:'Solutions submitted', suf:'+' },
                { val: stats.challenges,  label:'Challenges live', suf:'' },
              ].map((s,i) => (
                <div key={i}>
                  <div className="text-3xl font-black text-white"><Counter end={s.val} suffix={s.suf} /></div>
                  <div className="text-gray-500 text-sm mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Member photo strip — right side desktop */}
        {members.length >= 6 && (
          <div className="absolute right-0 top-0 bottom-0 w-72 hidden xl:flex flex-col gap-3 py-8 px-4 overflow-hidden opacity-70">
            {[...members, ...members].slice(0,14).map((m,i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 flex-shrink-0"
                style={{ animation:`slide-up 20s linear infinite`, animationDelay:`${i*-1.4}s` }}>
                <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
                  {m.photo_url
                    ? <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">{m.name?.[0]}</div>}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{m.name?.split(' ')[0]}</p>
                  <p className="text-gray-500 text-xs">{m.grade || m.role || 'Member'}</p>
                </div>
                <span className="ml-auto text-green-400 text-xs flex-shrink-0">●</span>
              </div>
            ))}
          </div>
        )}

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-6 h-10 border border-gray-700 rounded-full flex items-start justify-center p-1.5">
            <div className="w-1 h-2 bg-gray-500 rounded-full" style={{ animation:'bounce 1.8s ease infinite' }} />
          </div>
        </div>
      </section>

      <style>{`
        @keyframes slide-up { 0%{transform:translateY(0)} 100%{transform:translateY(-50%)} }
        @keyframes fade-in-up { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .fade-in-up { animation: fade-in-up 0.6s ease both; }
      `}</style>

      {/* ═══════════════════════════════════════════════════════
          GALLERY  — Cinematic full-width auto-walk
      ═══════════════════════════════════════════════════════ */}
      {gallery.length > 0 && (
        <section className="relative overflow-hidden" style={{ height:'70vh', minHeight:'420px' }}>
          {gallery.map((img, i) => (
            <div key={img.id} className="absolute inset-0 transition-all duration-[1400ms]"
              style={{ opacity: i===galleryIdx?1:0, transform:`scale(${i===galleryIdx?1:1.06})` }}>
              <img src={img.image_url} alt={img.title||''}
                className="w-full h-full object-cover" draggable={false} />
            </div>
          ))}
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

          {/* Text overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-14">
            <div className="container-custom">
              <div className="flex items-end justify-between gap-6">
                <div>
                  <p className="text-white/50 text-xs font-semibold uppercase tracking-[0.2em] mb-2">Our Moments</p>
                  {gallery[galleryIdx]?.title && (
                    <h2 className="text-white font-black text-3xl md:text-4xl mb-3" style={{ letterSpacing:'-0.02em' }}>
                      {gallery[galleryIdx].title}
                    </h2>
                  )}
                  {/* Progress dots */}
                  <div className="flex gap-2">
                    {gallery.map((_,i) => (
                      <button key={i} onClick={()=>setGalleryIdx(i)}
                        className="rounded-full bg-white transition-all duration-500"
                        style={{ width: i===galleryIdx?32:8, height:8, opacity: i===galleryIdx?1:0.35 }} />
                    ))}
                  </div>
                </div>
                <Link to="/gallery"
                  className="flex-shrink-0 group flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-white/20 transition text-sm">
                  View all photos <FaArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          ANNOUNCEMENTS  — Newspaper editorial style
      ═══════════════════════════════════════════════════════ */}
      {announcements.length > 0 && (
        <section className="py-24 bg-white border-b border-gray-100">
          <div className="container-custom">
            <div className="flex items-baseline justify-between mb-10 pb-4 border-b-2 border-gray-900">
              <h2 className="font-black text-3xl text-gray-900" style={{ letterSpacing:'-0.02em' }}>Club Updates</h2>
              <Link to="/announcements" className="text-sm text-gray-400 hover:text-gray-900 transition flex items-center gap-1.5">
                All updates <FaArrowRight size={11} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {announcements.map((a, i) => (
                <article key={a.id} onClick={()=>navigate('/announcements')}
                  className="group cursor-pointer">
                  {i === 0 && (
                    <div className="h-1.5 w-12 mb-4 rounded-full" style={{ background:'linear-gradient(90deg,#3b82f6,#6366f1)' }} />
                  )}
                  <h3 className="font-bold text-xl text-gray-900 leading-snug mb-3 group-hover:text-blue-600 transition-colors" style={{ letterSpacing:'-0.01em' }}>
                    {a.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-4">{a.content}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{formatDate(a.created_at)}</span>
                    <button onClick={e=>{e.stopPropagation(); const t=`*${a.title}*\n\n${a.content?.slice(0,100)}...\n\nFeza Code Club`; window.open(`https://wa.me/?text=${encodeURIComponent(t)}`,'_blank');}}
                      className="text-green-500 hover:text-green-600 transition">
                      <FaWhatsapp size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          DAILY TIP  — Single focused card, very editorial
      ═══════════════════════════════════════════════════════ */}
      {dailyTip && (() => {
        const s = TIP_STYLE[dailyTip.category] || TIP_STYLE.trick;
        return (
          <section className="py-24" style={{ background:'#0a0a0f' }}>
            <div className="container-custom max-w-4xl">
              <div className="flex items-center gap-3 mb-10">
                <div className="text-2xl">{s.icon}</div>
                <p className="text-gray-500 text-sm font-semibold uppercase tracking-[0.15em]">Daily Python Tip · {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</p>
              </div>
              <div className="rounded-3xl overflow-hidden border border-white/10">
                <div className={`h-1.5 bg-gradient-to-r ${s.bar}`} />
                <div className="p-8 md:p-12" style={{ background:'#111118' }}>
                  <span className={`inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5 ${s.badge}`}>
                    {dailyTip.category}
                    {dailyTip.tag && ` · ${dailyTip.tag}`}
                  </span>
                  <h2 className="font-black text-white mb-6" style={{ fontSize:'clamp(1.5rem,3vw,2.5rem)', letterSpacing:'-0.02em', lineHeight:1.1 }}>
                    {dailyTip.title}
                  </h2>
                  {dailyTip.type === 'image' && dailyTip.image_url ? (
                    <img src={dailyTip.image_url} alt={dailyTip.title}
                      className="w-full rounded-2xl select-none" draggable={false}
                      onContextMenu={e=>e.preventDefault()}
                      style={{ userSelect:'none', WebkitUserSelect:'none', pointerEvents:'none' }} />
                  ) : (
                    <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">{dailyTip.content}</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════
          MEMBERS  — Photo mosaic, no grid, organic
      ═══════════════════════════════════════════════════════ */}
      {members.length > 0 && (
        <section className="py-24 bg-white overflow-hidden">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-gray-400 text-sm font-semibold uppercase tracking-[0.15em] mb-4">Our Community</p>
                <h2 className="font-black text-5xl text-gray-900 mb-6" style={{ letterSpacing:'-0.03em', lineHeight:1.05 }}>
                  {stats.members} coders.<br />One club.
                </h2>
                <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-md">
                  Students from every form, every background. All here for one reason — to learn, build, and compete.
                </p>
                <Link to="/members"
                  className="inline-flex items-center gap-2 font-semibold text-gray-900 border-b-2 border-gray-900 pb-0.5 hover:text-blue-600 hover:border-blue-600 transition">
                  Meet every member <FaArrowRight size={12} />
                </Link>
              </div>

              {/* Organic mosaic */}
              <div className="grid grid-cols-4 gap-3">
                {members.slice(0,12).map((m,i) => {
                  const sizes = ['col-span-2 row-span-2','col-span-1','col-span-1','col-span-1','col-span-1','col-span-2'];
                  const size = i===0?'col-span-2 row-span-2 aspect-square':i===5?'col-span-2 aspect-video':'aspect-square';
                  return (
                    <div key={m.id} className={`${size} overflow-hidden rounded-2xl group relative`}>
                      {m.photo_url
                        ? <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center font-black text-white text-3xl"
                            style={{ background:`hsl(${(i*47+200)%360},60%,45%)` }}>
                            {m.name?.[0]}
                          </div>}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end p-3">
                        <div className="translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <p className="text-white font-bold text-sm">{m.name?.split(' ')[0]}</p>
                          {m.grade && <p className="text-white/70 text-xs">{m.grade}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          LEADERBOARD  — Dark, intense, competitive
      ═══════════════════════════════════════════════════════ */}
      {leaderboard.length > 0 && (
        <section className="py-24" style={{ background:'linear-gradient(135deg,#0a0a0f,#0d1b3e)' }}>
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
              <div className="lg:col-span-2">
                <p className="text-gray-500 text-sm font-semibold uppercase tracking-[0.15em] mb-4">Live Rankings</p>
                <h2 className="font-black text-white mb-4" style={{ fontSize:'clamp(2rem,4vw,3.5rem)', letterSpacing:'-0.03em', lineHeight:1.05 }}>
                  Who's<br />leading?
                </h2>
                <p className="text-gray-400 leading-relaxed mb-8">
                  Updated in real time. Every correct solution earns points. Every quiz climbs the board.
                </p>
                <Link to="/challenges"
                  className="inline-flex items-center gap-2 text-white font-bold px-6 py-3 rounded-xl transition hover:scale-105"
                  style={{ background:'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
                  <FaTrophy size={14} /> Start competing
                </Link>
              </div>

              <div className="lg:col-span-3 space-y-3">
                {leaderboard.map((e,i) => (
                  <div key={i}
                    className="flex items-center gap-4 rounded-2xl p-4 border transition-all"
                    style={{
                      background: i===0 ? 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(239,68,68,0.06))' : 'rgba(255,255,255,0.04)',
                      borderColor: i===0 ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.07)',
                    }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0"
                      style={{ background: i===0?'#f59e0b':i===1?'#9ca3af':i===2?'#f97316':'rgba(255,255,255,0.08)', color: i<3?'#111':'#9ca3af' }}>
                      {i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}
                    </div>
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                      {e.photo
                        ? <img src={e.photo} alt={e.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">{e.name?.[0]||'?'}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate">{e.name || `Student ${i+1}`}</p>
                      <p className="text-gray-500 text-xs">{e.solved} challenge{e.solved!==1?'s':''} solved</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-xl" style={{ color: i===0?'#f59e0b':'white' }}>{e.pts.toLocaleString()}</p>
                      <p className="text-gray-600 text-xs">points</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          FEATURES  — What you can actually DO here
      ═══════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="container-custom">
          <div className="mb-14">
            <p className="text-gray-400 text-sm font-semibold uppercase tracking-[0.15em] mb-4">Platform</p>
            <h2 className="font-black text-gray-900" style={{ fontSize:'clamp(2rem,4vw,3.5rem)', letterSpacing:'-0.03em', lineHeight:1.05 }}>
              Everything in one place.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200">
            {[
              { emoji:'📚', title:'Structured Curriculum',  desc:'Step-by-step Python from variables to real projects. Every lesson built for beginners.',        link:'/curriculum',       accent:'#3b82f6' },
              { emoji:'🏆', title:'Coding Challenges',      desc:'Real problems. Timed. Graded automatically. Your solutions appear on the leaderboard instantly.', link:'/challenges',       accent:'#f59e0b' },
              { emoji:'🐍', title:'Python Code Lab',        desc:'Write Python right here. No install. Run it in your browser. Share your code to chat.',           link:'/python-practice',  accent:'#10b981' },
              { emoji:'🎯', title:'Live Quizzes',           desc:'10 minutes. Multiple choice. Race against your classmates and see who finishes on top.',          link:'/quiz',             accent:'#8b5cf6' },
              { emoji:'💬', title:'Member Chat',            desc:'Ask questions, share code, get answers. The club never sleeps.',                                  link:'/chat',             accent:'#06b6d4' },
              { emoji:'📁', title:'Personal Files',         desc:'Your own file manager. Folders, Python files, teacher-shared materials — all in one place.',      link:'/student/files',    accent:'#f97316' },
            ].map((f,i) => (
              <Link key={i} to={f.link}
                className="group bg-white p-8 hover:bg-gray-50 transition-colors">
                <div className="text-3xl mb-5">{f.emoji}</div>
                <div className="w-8 h-0.5 mb-4 rounded-full transition-all duration-300 group-hover:w-16" style={{ background: f.accent }} />
                <h3 className="font-bold text-gray-900 text-lg mb-2" style={{ letterSpacing:'-0.01em' }}>{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          USEFUL SITES  — From Supabase, admin-managed
      ═══════════════════════════════════════════════════════ */}
      {sites.length > 0 && (
        <section className="py-24" style={{ background:'#f8fafc' }}>
          <div className="container-custom">
            <div className="flex items-baseline justify-between mb-12">
              <div>
                <p className="text-gray-400 text-sm font-semibold uppercase tracking-[0.15em] mb-2">Recommended by your teachers</p>
                <h2 className="font-black text-gray-900 text-4xl" style={{ letterSpacing:'-0.02em' }}>Learn beyond the club</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {sites.map((site,i) => (
                <a key={site.id} href={site.url} target="_blank" rel="noopener noreferrer"
                  className="group bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 block">
                  <div className="text-3xl mb-3">{site.emoji || '🌐'}</div>
                  <div className={`h-0.5 w-8 rounded-full mb-3 bg-gradient-to-r ${site.color || 'from-blue-500 to-indigo-600'} transition-all duration-300 group-hover:w-full`} />
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{site.name}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{site.description}</p>
                  <div className="mt-3 text-xs text-gray-300 group-hover:text-blue-500 flex items-center gap-1 transition-colors font-medium">
                    Visit <FaArrowRight size={9} />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          ACTIVITIES
      ═══════════════════════════════════════════════════════ */}
      {activities?.length > 0 && (
        <section className="py-24 bg-white">
          <div className="container-custom">
            <div className="flex items-baseline justify-between mb-10">
              <h2 className="font-black text-4xl text-gray-900" style={{ letterSpacing:'-0.02em' }}>Activities</h2>
              <Link to="/activities" className="text-sm text-gray-400 hover:text-gray-900 transition flex items-center gap-1.5">All events <FaArrowRight size={11}/></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activities.slice(0,3).map(a => (
                <div key={a.id} onClick={()=>navigate(`/activities/${a.id}`)}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {a.image_url
                      ? <img src={a.image_url} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                      : <div className="w-full h-full flex items-center justify-center text-4xl">📅</div>}
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-gray-400 mb-1">{formatDate(a.date)}</p>
                    <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{a.title}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════════════ */}
      <section className="py-24" style={{ background:'#f8fafc' }}>
        <div className="container-custom max-w-5xl">
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-[0.15em] mb-12 text-center">What students say</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { text:'Before this club I had never written code. Now I build real programs. It changed how I think.', name:'Feza Student', form:'Form 3' },
              { text:'The challenges push you hard. Every time I solve one I feel proud. The leaderboard keeps me coming back.', name:'Club Member', form:'Form 4' },
              { text:'I can write Python right in the browser and share it with friends. No laptop needed at home.', name:'New Member', form:'Form 2' },
            ].map((t,i) => (
              <div key={i} className="relative">
                <FaQuoteLeft className="text-gray-200 text-4xl absolute -top-2 -left-1" />
                <p className="text-gray-700 leading-relaxed mb-6 relative z-10 pt-4">{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background:`hsl(${i*120+200},60%,45%)` }}>F</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.form}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FINAL CTA  — Simple, confident, no fluff
      ═══════════════════════════════════════════════════════ */}
      <section className="py-32 text-center" style={{ background:'linear-gradient(135deg,#0a0a0f 0%,#0d1b3e 50%,#0a0a0f 100%)' }}>
        <div className="container-custom max-w-3xl">
          <div className="flex -space-x-2 justify-center mb-8">
            {members.slice(0,6).map((m,i) => (
              <div key={m.id} className="w-11 h-11 rounded-full border-2 overflow-hidden" style={{ borderColor:'#0a0a0f', zIndex:6-i }}>
                {m.photo_url
                  ? <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover"/>
                  : <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">{m.name?.[0]}</div>}
              </div>
            ))}
          </div>
          <h2 className="font-black text-white mb-4" style={{ fontSize:'clamp(2.5rem,6vw,4.5rem)', letterSpacing:'-0.03em', lineHeight:1.05 }}>
            Your first line of<br />code is waiting.
          </h2>
          <p className="text-gray-400 text-xl mb-10">Free. Open to all Feza students. No experience needed.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={()=>navigate('/student/register')}
              className="text-white font-bold px-10 py-4 rounded-2xl text-lg transition hover:scale-105"
              style={{ background:'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow:'0 0 50px rgba(99,102,241,0.5)' }}>
              Join the club — it's free
            </button>
            <button onClick={()=>navigate('/student/login')}
              className="border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 font-semibold px-10 py-4 rounded-2xl text-lg transition">
              I already have an account
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;