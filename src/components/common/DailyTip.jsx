import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { FaLightbulb, FaFire, FaCode, FaStar, FaRocket, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// ── Category config ───────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  trick:      { icon: '✨', label: 'Python Trick',    gradient: 'from-purple-600 to-indigo-600',  bg: 'bg-purple-50',  border: 'border-purple-200' },
  motivation: { icon: '🔥', label: 'Stay Motivated',  gradient: 'from-orange-500 to-red-500',     bg: 'bg-orange-50',  border: 'border-orange-200' },
  syntax:     { icon: '🐍', label: 'Python Syntax',   gradient: 'from-green-600 to-teal-600',     bg: 'bg-green-50',   border: 'border-green-200'  },
  project:    { icon: '🚀', label: 'Project Idea',    gradient: 'from-blue-600 to-cyan-600',      bg: 'bg-blue-50',    border: 'border-blue-200'   },
  default:    { icon: '💡', label: 'Daily Tip',       gradient: 'from-primary-600 to-primary-400',bg: 'bg-primary-50', border: 'border-primary-200'},
};

const DailyTip = () => {
  const [tip, setTip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchTodaysTip();
    // Check if user dismissed today's tip
    const dismissKey = `tip_dismissed_${new Date().toDateString()}`;
    if (localStorage.getItem(dismissKey)) setDismissed(true);
  }, []);

  const fetchTodaysTip = async () => {
    const today = new Date().toISOString().split('T')[0];
    // Try today's scheduled tip first
    let { data } = await supabase
      .from('daily_tips')
      .select('*')
      .eq('show_date', today)
      .eq('is_published', true)
      .maybeSingle();

    // Fallback: pick a random published tip
    if (!data) {
      const { data: all } = await supabase
        .from('daily_tips')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(30);
      if (all?.length) {
        // Deterministic random based on day of year
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        data = all[dayOfYear % all.length];
      }
    }
    setTip(data);
    setLoading(false);
  };

  const dismiss = () => {
    const dismissKey = `tip_dismissed_${new Date().toDateString()}`;
    localStorage.setItem(dismissKey, '1');
    setDismissed(true);
  };

  if (loading || !tip || dismissed) return null;

  const cfg = CATEGORY_CONFIG[tip.category] || CATEGORY_CONFIG.default;

  return (
    <>
      {/* ── Compact card (always visible) ──────────────────────── */}
      <div
        className={`relative rounded-2xl border-2 ${cfg.border} ${cfg.bg} overflow-hidden cursor-pointer
          hover:shadow-lg transition-all duration-300 group`}
        onClick={() => setExpanded(true)}>

        {/* Gradient top bar */}
        <div className={`h-1.5 bg-gradient-to-r ${cfg.gradient}`} />

        <div className="p-4 flex items-center gap-4">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center flex-shrink-0 shadow-lg text-2xl`}>
            {cfg.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{cfg.label}</span>
              {tip.tag && (
                <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${cfg.gradient} text-white font-medium`}>
                  #{tip.tag}
                </span>
              )}
            </div>
            {tip.title && (
              <h3 className="font-bold text-gray-800 text-sm leading-tight truncate">{tip.title}</h3>
            )}
            {tip.type === 'text' && tip.content && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{tip.content}</p>
            )}
            {tip.type === 'image' && (
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                🖼️ Click to view today's tip image
              </p>
            )}
          </div>

          {/* Arrow */}
          <div className={`text-sm font-semibold bg-gradient-to-r ${cfg.gradient} bg-clip-text text-transparent
            group-hover:translate-x-1 transition-transform flex-shrink-0`}>
            View →
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={e => { e.stopPropagation(); dismiss(); }}
          className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 transition p-1 rounded-full hover:bg-white">
          <FaTimes size={10} />
        </button>
      </div>

      {/* ── Full screen modal ────────────────────────────────────── */}
      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">

            {/* Header */}
            <div className={`bg-gradient-to-r ${cfg.gradient} p-6 relative`}>
              <button onClick={() => setExpanded(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition p-1.5 rounded-full hover:bg-white/20">
                <FaTimes size={16} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl shadow">
                  {cfg.icon}
                </div>
                <div>
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">{cfg.label}</p>
                  {tip.title && <h2 className="text-white font-bold text-xl leading-tight">{tip.title}</h2>}
                  {tip.tag && <span className="inline-block mt-1 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">#{tip.tag}</span>}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {tip.type === 'image' && tip.image_url && !imgError ? (
                <div className="relative">
                  <img
                    src={tip.image_url}
                    alt={tip.title || 'Daily tip'}
                    className="w-full rounded-2xl border border-gray-100 select-none"
                    draggable={false}
                    onError={() => setImgError(true)}
                    onContextMenu={e => e.preventDefault()}
                    style={{ userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none' }}
                  />
                  {/* Anti-copy overlay */}
                  <div className="absolute inset-0 rounded-2xl select-none pointer-events-none"
                    style={{ background: 'transparent' }} />
                </div>
              ) : tip.type === 'text' && tip.content ? (
                <div className={`${cfg.bg} rounded-2xl p-5 border ${cfg.border}`}>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{tip.content}</p>
                </div>
              ) : null}

              {/* Footer */}
              <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                <span>Daily Python Tip • Feza Code Club</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DailyTip;
