import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import {
  FaHashtag, FaLock, FaPaperPlane, FaImage, FaCode, FaSmile,
  FaTimes, FaReply, FaUsers, FaSearch, FaPlus, FaCommentDots,
  FaTrash, FaChevronDown, FaCircle
} from 'react-icons/fa';
import toast from 'react-hot-toast';

// ── Browser notifications ────────────────────────────────────
const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

const sendNotification = (title, body, icon) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const n = new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'feza-chat', // replaces previous notification instead of stacking
    });
    n.onclick = () => { window.focus(); n.close(); };
    setTimeout(() => n.close(), 5000);
  }
};

// ── Emoji picker (simple inline) ─────────────────────────────
const QUICK_EMOJIS = ['👍','❤️','😂','🔥','🎉','👀','✅','💯','🐍','🚀'];

// ── Syntax highlighter — proper tokeniser, no regex bleed ────
const highlight = (rawCode) => {
  const KW = new Set(['def','class','import','from','return','if','elif','else',
    'for','while','in','not','and','or','True','False','None','break','continue',
    'pass','try','except','finally','with','as','lambda','yield','global',
    'nonlocal','del','assert','raise','is','await','async']);
  const BI = new Set(['print','len','range','input','int','float','str','list',
    'dict','set','tuple','bool','type','isinstance','enumerate','zip','map',
    'filter','sorted','reversed','sum','min','max','abs','round','open',
    'append','extend','format','super','self']);
  const e = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  return rawCode.split('\n').map(line => {
    const out = [];
    let i = 0;
    while (i < line.length) {
      const ch = line[i];
      // comment
      if (ch === '#') {
        out.push('<span style="color:#6A9955;font-style:italic">' + e(line.slice(i)) + '</span>');
        break;
      }
      // string
      if (ch === '"' || ch === "'") {
        const q = ch; let j = i + 1;
        while (j < line.length && line[j] !== q) { if (line[j] === '\\') j++; j++; }
        j++;
        out.push('<span style="color:#CE9178">' + e(line.slice(i, j)) + '</span>');
        i = j; continue;
      }
      // number
      if (/[0-9]/.test(ch) && (i === 0 || !/\w/.test(line[i-1]))) {
        let j = i;
        while (j < line.length && /[0-9._xXbBoO]/.test(line[j])) j++;
        out.push('<span style="color:#B5CEA8">' + e(line.slice(i, j)) + '</span>');
        i = j; continue;
      }
      // identifier / keyword / builtin
      if (/[a-zA-Z_]/.test(ch)) {
        let j = i;
        while (j < line.length && /\w/.test(line[j])) j++;
        const word = line.slice(i, j);
        const isCall = line[j] === '(';
        if (KW.has(word)) {
          out.push('<span style="color:#569CD6;font-weight:600">' + e(word) + '</span>');
        } else if (BI.has(word) || isCall) {
          out.push('<span style="color:#DCDCAA">' + e(word) + '</span>');
        } else {
          out.push(e(word));
        }
        i = j; continue;
      }
      // operator
      if (/[+\-*\/=<>!%&|^~]/.test(ch)) {
        out.push('<span style="color:#D4D4D4">' + e(ch) + '</span>');
        i++; continue;
      }
      out.push(e(ch));
      i++;
    }
    return out.join('');
  }).join('\n');
};

// ── Avatar helper — uses px sizing to avoid Tailwind JIT cache misses ──────
const Avatar = ({ name, url, size = 8 }) => {
  const px = size * 4; // Tailwind unit → px (1 unit = 4px)
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';
  const colors = ['#002B5C','#0ea5e9','#8b5cf6','#10b981','#f59e0b','#ef4444'];
  const color = colors[name?.charCodeAt(0) % colors.length] || colors[0];
  const style = { width: px, height: px, minWidth: px, minHeight: px };
  if (url) return (
    <img src={url} alt={name}
      style={style}
      className="rounded-full object-cover flex-shrink-0" />
  );
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold"
      style={{ ...style, background: color, fontSize: Math.max(px * 0.35, 10) }}>
      {initials}
    </div>
  );
};

// ── Message bubble ────────────────────────────────────────────
const MessageBubble = ({ msg, currentUserId, onReact, onReply, onDelete, onEdit, isDM=false, editingMsgId, editText, setEditText, onSaveEdit, onCancelEdit }) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const isOwn = msg.user_id === currentUserId;
  const isEditing = editingMsgId === msg.id;

  if (msg.is_deleted) return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} px-3 md:px-4 py-0.5`}>
      <span className="text-xs text-gray-400 italic bg-gray-100 px-3 py-1 rounded-full">
        Message deleted
      </span>
    </div>
  );

  // Group reactions
  const reactionMap = {};
  (msg.reactions || []).forEach(r => {
    reactionMap[r.emoji] = reactionMap[r.emoji] || [];
    reactionMap[r.emoji].push(r.user_id);
  });

  const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // ── Own messages: bubble on the right, no avatar/name ────────
  if (isOwn) {
    return (
      <div className="group flex flex-col items-end px-3 md:px-4 py-0.5">
        {/* Reply preview */}
        {msg.reply_to_id && msg.reply_preview && (
          <div className="max-w-xs md:max-w-md border-l-2 border-primary-300 pl-2 mb-1 text-xs text-gray-500 truncate self-end">
            ↩ {msg.reply_preview}
          </div>
        )}

        <div className="flex items-end gap-2 max-w-xs md:max-w-md lg:max-w-lg">
          {/* Hover actions */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <div className="relative">
              <button onClick={() => setShowEmoji(!showEmoji)}
                className="p-1 rounded hover:bg-gray-200 text-gray-400">
                <FaSmile size={12} />
              </button>
              {showEmoji && (
                <div className="absolute right-0 bottom-8 bg-white border rounded-xl shadow-lg p-2 flex gap-1 z-20">
                  {QUICK_EMOJIS.map(e => (
                    <button key={e} onClick={() => { onReact(msg.id, e); setShowEmoji(false); }}
                      className="hover:scale-125 transition-transform text-lg">{e}</button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => onReply(msg)} className="p-1 rounded hover:bg-gray-200 text-gray-400">
              <FaReply size={12} />
            </button>
            <button onClick={() => onEdit(msg)} className="p-1 rounded hover:bg-gray-200 text-gray-400" title="Edit">
              ✏️
            </button>
            <button onClick={() => onDelete(msg.id)} className="p-1 rounded hover:bg-red-100 text-red-400">
              <FaTrash size={12} />
            </button>
          </div>

          {/* Bubble */}
          <div className="flex flex-col items-end">
            {isEditing ? (
              <div className="flex flex-col gap-1 w-64">
                <textarea
                  className="w-full text-sm p-2 rounded-xl border border-primary-300 focus:outline-none text-gray-800 resize-none"
                  rows={3} value={editText}
                  autoFocus
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSaveEdit(msg.id); } if (e.key === 'Escape') onCancelEdit(); }}
                />
                <div className="flex gap-2 justify-end text-xs">
                  <button onClick={onCancelEdit} className="text-gray-500 hover:text-gray-700">cancel</button>
                  <button onClick={() => onSaveEdit(msg.id)} className="text-white bg-primary-600 px-2 py-0.5 rounded">save</button>
                </div>
              </div>
            ) : msg.content && (
              <div className="bg-primary-600 text-white px-4 py-2 rounded-2xl rounded-br-sm text-sm break-words whitespace-pre-wrap shadow-sm">
                {msg.content}{msg.is_edited && <span className="text-primary-200 text-xs ml-1">(edited)</span>}
              </div>
            )}
            {msg.image_url && (
              <img src={msg.image_url} alt="shared"
                className="max-w-xs rounded-2xl rounded-br-sm border-2 border-primary-200 cursor-pointer hover:opacity-90 shadow-sm"
                onClick={() => window.open(msg.image_url, '_blank')} />
            )}
            {msg.code_snippet && (
              <div className="rounded-2xl rounded-br-sm overflow-hidden border border-gray-700 shadow-sm w-full">
                <div className="bg-gray-800 px-3 py-1 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{msg.code_language || 'python'}</span>
                  <button onClick={() => { navigator.clipboard.writeText(msg.code_snippet); toast.success('Copied!'); }}
                    className="text-xs text-gray-400 hover:text-white">copy</button>
                </div>
                <pre className="bg-gray-900 text-gray-100 text-xs p-3 overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: highlight(msg.code_snippet) }} />
              </div>
            )}
            <span className="text-xs text-gray-400 mt-0.5 mr-1">{timeStr}</span>
          </div>
        </div>

        {/* Reactions */}
        {Object.keys(reactionMap).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 justify-end">
            {Object.entries(reactionMap).map(([emoji, users]) => (
              <button key={emoji} onClick={() => onReact(msg.id, emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition
                  ${users.includes(currentUserId) ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                {emoji} {users.length}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Other people: avatar + name on the left ───────────────
  return (
    <div className="group flex items-end gap-2 px-3 md:px-4 py-0.5">
      {!isDM && <Avatar name={msg.display_name} url={msg.avatar_url} size={7} />}
      <div className="flex-1 min-w-0 max-w-xs md:max-w-md lg:max-w-lg">
        {!isDM && (
          <div className="flex items-baseline gap-2 mb-0.5 ml-1">
            <span className="font-semibold text-xs text-gray-600">{msg.display_name}</span>
            <span className="text-xs text-gray-400">{timeStr}</span>
          </div>
        )}
        {isDM && <div className="flex justify-start mb-0.5 ml-1"><span className="text-xs text-gray-400">{timeStr}</span></div>}

        {msg.reply_to_id && msg.reply_preview && (
          <div className="border-l-2 border-gray-300 pl-2 mb-1 text-xs text-gray-500 truncate ml-1">
            ↩ {msg.reply_preview}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex flex-col">
            {msg.content && (
              <div className="bg-white text-gray-800 px-4 py-2 rounded-2xl rounded-bl-sm text-sm break-words whitespace-pre-wrap shadow-sm border border-gray-100">
                {msg.content}{msg.is_edited && <span className="text-gray-400 text-xs ml-1">(edited)</span>}
              </div>
            )}
            {msg.image_url && (
              <img src={msg.image_url} alt="shared"
                className="max-w-xs rounded-2xl rounded-bl-sm border cursor-pointer hover:opacity-90 shadow-sm"
                onClick={() => window.open(msg.image_url, '_blank')} />
            )}
            {msg.code_snippet && (
              <div className="rounded-2xl rounded-bl-sm overflow-hidden border border-gray-700 shadow-sm">
                <div className="bg-gray-800 px-3 py-1 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{msg.code_language || 'python'}</span>
                  <button onClick={() => { navigator.clipboard.writeText(msg.code_snippet); toast.success('Copied!'); }}
                    className="text-xs text-gray-400 hover:text-white">copy</button>
                </div>
                <pre className="bg-gray-900 text-gray-100 text-xs p-3 overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: highlight(msg.code_snippet) }} />
              </div>
            )}
          </div>

          {/* Hover actions */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity pb-1">
            <div className="relative">
              <button onClick={() => setShowEmoji(!showEmoji)}
                className="p-1 rounded hover:bg-gray-200 text-gray-400">
                <FaSmile size={12} />
              </button>
              {showEmoji && (
                <div className="absolute left-0 bottom-8 bg-white border rounded-xl shadow-lg p-2 flex gap-1 z-20">
                  {QUICK_EMOJIS.map(e => (
                    <button key={e} onClick={() => { onReact(msg.id, e); setShowEmoji(false); }}
                      className="hover:scale-125 transition-transform text-lg">{e}</button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => onReply(msg)} className="p-1 rounded hover:bg-gray-200 text-gray-400">
              <FaReply size={12} />
            </button>
          </div>
        </div>

        {/* Reactions */}
        {Object.keys(reactionMap).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 ml-1">
            {Object.entries(reactionMap).map(([emoji, users]) => (
              <button key={emoji} onClick={() => onReact(msg.id, emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition
                  ${users.includes(currentUserId) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                {emoji} {users.length}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main ChatPage ─────────────────────────────────────────────
const ChatPage = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [activeDM, setActiveDM] = useState(null); // { thread_id, other_user }
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [dmThreads, setDmThreads] = useState([]);
  const [text, setText] = useState('');
  const [codeMode, setCodeMode] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [onlineUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({}); // { channelId/dmThreadId: count }
  const [typingUsers, setTypingUsers] = useState([]);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState('');
  const [lastSeen, setLastSeen] = useState({}); // { user_id: timestamp }
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const textRef = useRef(null);
  const realtimeRef = useRef(null);
  const globalRealtimeRef = useRef(null);
  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 50;

  // Profile info
  const myProfile = members.find(m => m.user_id === user?.id);
  const displayName = myProfile?.name || user?.email?.split('@')[0] || 'Guest';
  const avatarUrl = myProfile?.photo_url || null;

  // Broadcast total unread to Navbar via CustomEvent
  const dispatchUnread = (counts, removingKey = null) => {
    const updated = removingKey ? Object.fromEntries(Object.entries(counts).filter(([k]) => k !== removingKey)) : counts;
    const total = Object.values(updated).reduce((a, b) => a + b, 0);
    window.dispatchEvent(new CustomEvent('feza-chat-unread', { detail: { total } }));
  };

  // ── Global realtime — listens to ALL new messages for notifications + unread badges
  useEffect(() => {
    if (globalRealtimeRef.current) supabase.removeChannel(globalRealtimeRef.current);
    globalRealtimeRef.current = supabase
      .channel('chat-global-notifications')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages'
      }, (payload) => {
        const msg = payload.new;
        if (msg.user_id === user?.id) return; // ignore own messages

        const isActiveChannel = !activeDM && activeChannel?.id === msg.channel_id;
        const isActiveDM = activeDM && activeDM.thread_id === msg.dm_thread_id;
        const isCurrentView = isActiveChannel || isActiveDM;
        const key = msg.dm_thread_id || msg.channel_id;

        // Increment unread badge for the channel/DM
        if (!isCurrentView) {
          setUnreadCounts(prev => {
            const updated = { ...prev, [key]: (prev[key] || 0) + 1 };
            // broadcast to navbar
            const total = Object.values(updated).reduce((a, b) => a + b, 0);
            window.dispatchEvent(new CustomEvent('feza-chat-unread', { detail: { total } }));
            return updated;
          });
        }

        // Browser notification when tab is hidden
        if (document.hidden) {
          const preview = msg.content
            || (msg.image_url ? '📷 Shared an image' : '')
            || (msg.code_snippet ? '💻 Shared code' : '')
            || 'New message';
          const channelName = channels.find(c => c.id === msg.channel_id)?.name;
          const where = msg.dm_thread_id ? 'Direct Message' : `#${channelName || 'chat'}`;
          sendNotification(
            `${msg.display_name} — ${where}`,
            preview,
            msg.avatar_url
          );
        } else if (!isCurrentView) {
          // In-app toast when tab is visible but user is in different channel
          const preview = (msg.content || '').slice(0, 60) || '📷 Image';
          toast(`💬 ${msg.display_name}: ${preview}`, {
            duration: 4000,
            style: { cursor: 'pointer' },
          });
        }
      })
      .subscribe();

    return () => { if (globalRealtimeRef.current) supabase.removeChannel(globalRealtimeRef.current); };
  }, [user?.id, activeChannel?.id, activeDM?.thread_id, channels]);

  // ── Load channels ──────────────────────────────────────────
  useEffect(() => {
    requestNotificationPermission();

    // Update this user's last_seen now and whenever the tab regains focus
    const updateLastSeen = async () => {
      if (!user?.id) return;
      await supabase.from('members')
        .update({ last_seen: new Date().toISOString() })
        .eq('user_id', user.id);
    };
    updateLastSeen();
    window.addEventListener('focus', updateLastSeen);
    window.addEventListener('focus', updateLastSeen);

    const load = async () => {
      const { data } = await supabase.from('chat_channels').select('*').order('created_at');
      setChannels(data || []);
      if (data?.length) setActiveChannel(data[0]);

      const { data: mems } = await supabase.from('members').select('user_id, name, photo_url, role, status, last_seen');
      setMembers(mems || []);
      // Build lastSeen map
      const lsMap = {};
      (mems || []).forEach(m => { if (m.last_seen) lsMap[m.user_id] = m.last_seen; });
      setLastSeen(lsMap);
    };
    load();
  }, []);

  // ── Load DM threads for logged-in user ─────────────────────
  useEffect(() => {
    if (!user) return;
    const loadDMs = async () => {
      const { data } = await supabase
        .from('dm_threads')
        .select('*')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);
      setDmThreads(data || []);
    };
    loadDMs();
  }, [user]);

  // ── Load messages + subscribe to realtime ─────────────────
  const loadMessages = useCallback(async (channelId, dmThreadId, append = false) => {
    const from = append ? pageRef.current * 50 : 0;
    let query = supabase
      .from('chat_messages')
      .select('*, reactions:chat_reactions(*)')
      .order('created_at', { ascending: false })
      .range(from, from + 49);

    if (dmThreadId) {
      query = query.eq('dm_thread_id', dmThreadId);
    } else {
      query = query.eq('channel_id', channelId).is('dm_thread_id', null);
    }

    const { data } = await query;
    const msgs = (data || []).reverse();
    if (append) {
      setMessages(prev => [...msgs, ...prev]);
    } else {
      pageRef.current = 0;
      hasMoreRef.current = true;
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 50);
    }
    if ((data || []).length < 50) hasMoreRef.current = false;
  }, []);

  const loadOlderMessages = async () => {
    if (!hasMoreRef.current || loadingMore) return;
    setLoadingMore(true);
    pageRef.current += 1;
    await loadMessages(activeChannel?.id, activeDM?.thread_id, true);
    setLoadingMore(false);
  };

  useEffect(() => {
    if (!activeChannel && !activeDM) return;

    const channelId = activeChannel?.id;
    const dmThreadId = activeDM?.thread_id;
    loadMessages(channelId, dmThreadId);

    // Clean up previous subscription
    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);

    // Subscribe to new messages in realtime
    const filter = dmThreadId
      ? `dm_thread_id=eq.${dmThreadId}`
      : `channel_id=eq.${channelId}`;

    realtimeRef.current = supabase
      .channel(`chat-${channelId || dmThreadId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages', filter
      }, (payload) => {
        // Fetch with reactions
        supabase.from('chat_messages')
          .select('*, reactions:chat_reactions(*)')
          .eq('id', payload.new.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setMessages(prev => [...prev, data]);
              setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

              // notifications handled by global subscription above
            }
          });
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'chat_messages', filter
      }, (payload) => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'chat_reactions'
      }, () => {
        // Reload messages to refresh reaction counts
        loadMessages(channelId, dmThreadId);
      })
      .subscribe();

    // ── Typing indicator via Supabase Broadcast (ephemeral, not stored)
    const typingChannel = supabase.channel(`typing-${channelId || dmThreadId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id === user?.id) return;
        setTypingUsers(prev => {
          if (!prev.includes(payload.name)) return [...prev, payload.name];
          return prev;
        });
        // Remove after 3 seconds of no update
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(n => n !== payload.name));
        }, 3000);
      })
      .subscribe();

    return () => {
      if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
      supabase.removeChannel(typingChannel);
    };
  }, [activeChannel, activeDM, loadMessages]);

  // ── Send message ───────────────────────────────────────────
  const sendMessage = async () => {
    if (!text.trim() && !codeMode) return;
    if (!user) { toast.error('Please log in to send messages'); return; }

    const payload = {
      channel_id: activeDM ? null : activeChannel?.id,
      dm_thread_id: activeDM?.thread_id || null,
      user_id: user.id,
      display_name: displayName,
      avatar_url: avatarUrl,
      reply_to_id: replyTo?.id || null,
      reply_preview: replyTo ? (replyTo.content || replyTo.code_snippet || '📷 Image').slice(0, 80) : null,
    };

    if (codeMode) {
      payload.code_snippet = text;
      payload.code_language = 'python';
      payload.content = null;
    } else {
      payload.content = text;
    }

    const { error } = await supabase.from('chat_messages').insert(payload);
    if (error) { toast.error('Failed to send'); return; }
    setText('');
    setReplyTo(null);
    setCodeMode(false);
    isTypingRef.current = false;
  };

  // ── Upload image ───────────────────────────────────────────
  const uploadImage = async (file) => {
    if (!user) { toast.error('Please log in to share images'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('chat-images').upload(path, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(path);
      await supabase.from('chat_messages').insert({
        channel_id: activeDM ? null : activeChannel?.id,
        dm_thread_id: activeDM?.thread_id || null,
        user_id: user.id,
        display_name: displayName,
        avatar_url: avatarUrl,
        image_url: publicUrl,
        reply_to_id: replyTo?.id || null,
        reply_preview: replyTo ? (replyTo.content || '').slice(0, 80) : null,
      });
      setReplyTo(null);
    } catch (e) { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  // ── React to message ───────────────────────────────────────
  const handleReact = async (msgId, emoji) => {
    if (!user) { toast.error('Please log in to react'); return; }
    const existing = messages.find(m => m.id === msgId)
      ?.reactions?.find(r => r.user_id === user.id && r.emoji === emoji);
    if (existing) {
      await supabase.from('chat_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('chat_reactions').insert({ message_id: msgId, user_id: user.id, emoji });
    }
  };

  // ── Edit message ──────────────────────────────────────────
  const startEdit = (msg) => { setEditingMsgId(msg.id); setEditText(msg.content || ''); };
  const cancelEdit = () => { setEditingMsgId(null); setEditText(''); };
  const saveEdit = async (msgId) => {
    if (!editText.trim()) return;
    const { error } = await supabase.from('chat_messages')
      .update({ content: editText, is_edited: true })
      .eq('id', msgId);
    if (!error) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: editText, is_edited: true } : m));
      setEditingMsgId(null);
      setEditText('');
    }
  };

  // ── Remove DM thread ───────────────────────────────────────
  const removeDM = async (threadId) => {
    if (!window.confirm('Remove this conversation from your list?')) return;
    await supabase.from('dm_threads').delete().eq('id', threadId);
    setDmThreads(prev => prev.filter(t => t.id !== threadId));
    if (activeDM?.thread_id === threadId) { setActiveDM(null); setActiveChannel(channels[0] || null); }
  };

  // ── Delete message ─────────────────────────────────────────
  const handleDelete = async (msgId) => {
    await supabase.from('chat_messages').update({ is_deleted: true }).eq('id', msgId);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_deleted: true } : m));
  };

  // ── Start DM ───────────────────────────────────────────────
  const startDM = async (otherMember) => {
    if (!user) { toast.error('Please log in to send DMs'); return; }
    if (otherMember.user_id === user.id) return;

    // Check if thread exists
    const { data: existing } = await supabase
      .from('dm_threads')
      .select('*')
      .or(`and(user_a.eq.${user.id},user_b.eq.${otherMember.user_id}),and(user_a.eq.${otherMember.user_id},user_b.eq.${user.id})`)
      .maybeSingle();

    let thread = existing;
    if (!thread) {
      const { data: newThread } = await supabase
        .from('dm_threads')
        .insert({ user_a: user.id, user_b: otherMember.user_id })
        .select().single();
      thread = newThread;
      setDmThreads(prev => [...prev, thread]);
    }

    setActiveChannel(null);
    setActiveDM({ thread_id: thread.id, other_user: otherMember });
    setShowMembers(false);
  };

  // ── Create channel ─────────────────────────────────────────
  const createChannel = async () => {
    if (!newChannelName.trim()) return;
    const slug = newChannelName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { data, error } = await supabase.from('chat_channels').insert({
      name: slug, description: newChannelDesc, created_by: user?.id
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setChannels(prev => [...prev, data]);
    setActiveChannel(data);
    setActiveDM(null);
    setShowNewChannel(false);
    setNewChannelName('');
    setNewChannelDesc('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !codeMode) { e.preventDefault(); sendMessage(); }
  };

  const formatLastSeen = (ts) => {
    if (!ts) return 'Never';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs  = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 2)  return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs  < 24) return `${hrs}h ago`;
    if (days < 7)  return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  const isOnline = (userId) => {
    const ts = lastSeen[userId];
    if (!ts) return false;
    return Date.now() - new Date(ts).getTime() < 3 * 60 * 1000; // online if seen < 3 min ago
  };

  const filteredMembers = members.filter(m =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chatTitle = activeDM
    ? activeDM.other_user.name
    : activeChannel ? `#${activeChannel.name}` : '';

  const chatDesc = activeDM
    ? 'Direct Message'
    : activeChannel?.description || '';

  // ── DM list for sidebar ────────────────────────────────────
  const myDMs = dmThreads.map(t => {
    const otherId = t.user_a === user?.id ? t.user_b : t.user_a;
    const other = members.find(m => m.user_id === otherId);
    return other ? { thread_id: t.id, other_user: other } : null;
  }).filter(Boolean);

  return (
    <div className="relative flex h-[calc(100vh-64px)] bg-gray-100 overflow-hidden">

      {/* ── Mobile sidebar overlay backdrop ──────────────── */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setShowSidebar(false)} />
      )}

      {/* ── Sidebar ───────────────────────────────────────── */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-40
        w-64 flex-shrink-0 bg-gray-900 text-gray-300 flex flex-col
        transform transition-transform duration-200
        ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-gray-700">
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            <FaCommentDots className="text-green-400" /> Club Chat
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Feza Programming Club</p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {/* Channels */}
          <div className="px-3 mb-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Channels</span>
              {user && (
                <button onClick={() => setShowNewChannel(true)}
                  className="text-gray-500 hover:text-white transition">
                  <FaPlus size={11} />
                </button>
              )}
            </div>
            {channels.map(ch => (
              <button key={ch.id}
                onClick={() => { setActiveChannel(ch); setActiveDM(null); setShowSidebar(false); setUnreadCounts(prev => { const n = {...prev}; delete n[ch.id]; return n; }); dispatchUnread(unreadCounts, ch.id); }}
                className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 text-sm transition
                  ${activeChannel?.id === ch.id && !activeDM
                    ? 'bg-gray-600 text-white'
                    : 'hover:bg-gray-700 text-gray-400 hover:text-white'}`}>
                <FaHashtag size={12} className="flex-shrink-0" />
                <span className="truncate flex-1">{ch.name}</span>
                {unreadCounts[ch.id] > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {unreadCounts[ch.id] > 99 ? '99+' : unreadCounts[ch.id]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Direct Messages */}
          {user && (
            <div className="px-3 mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Direct Messages</span>
                <button onClick={() => setShowMembers(true)}
                  className="text-gray-500 hover:text-white transition">
                  <FaPlus size={11} />
                </button>
              </div>
              {myDMs.map(dm => (
                <button key={dm.thread_id}
                  onClick={() => { setActiveDM(dm); setActiveChannel(null); setShowSidebar(false); setUnreadCounts(prev => { const n = {...prev}; delete n[dm.thread_id]; return n; }); dispatchUnread(unreadCounts, dm.thread_id); }}
                  className={`group w-full text-left px-2 py-1.5 rounded flex items-center gap-2 text-sm transition
                    ${activeDM?.thread_id === dm.thread_id
                      ? 'bg-gray-600 text-white'
                      : 'hover:bg-gray-700 text-gray-400 hover:text-white'}`}>
                  <Avatar name={dm.other_user.name} url={dm.other_user.photo_url} size={5} />
                  <span className="truncate flex-1 text-xs">{dm.other_user.name}</span>
                  {unreadCounts[dm.thread_id] > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {unreadCounts[dm.thread_id] > 99 ? '99+' : unreadCounts[dm.thread_id]}
                    </span>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); removeDM(dm.thread_id); }}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition ml-1 flex-shrink-0"
                    title="Remove conversation">
                    <FaTimes size={10} />
                  </button>
                </button>
              ))}
              {myDMs.length === 0 && (
                <p className="text-xs text-gray-600 px-2 py-1">No DMs yet. Click + to start one.</p>
              )}
            </div>
          )}
        </div>

        {/* Current user */}
        {user && (
          <div className="p-3 border-t border-gray-700 flex items-center gap-2">
            <div className="relative">
              <Avatar name={displayName} url={avatarUrl} size={8} />
              <FaCircle className="absolute bottom-0 right-0 text-green-400 text-xs" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>
        )}
        {!user && (
          <div className="p-3 border-t border-gray-700 text-center">
            <a href="/student/login" className="text-xs text-green-400 hover:text-green-300">
              Log in to send messages
            </a>
          </div>
        )}
      </div>

      {/* ── Main chat area ────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">

        {/* Header */}
        <div className="px-3 md:px-6 py-3 border-b flex items-center justify-between bg-white shadow-sm">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button onClick={() => setShowSidebar(true)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 flex flex-col gap-1">
              <span className="block w-5 h-0.5 bg-gray-600" />
              <span className="block w-5 h-0.5 bg-gray-600" />
              <span className="block w-5 h-0.5 bg-gray-600" />
            </button>
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm md:text-base">
                {activeDM
                  ? <><Avatar name={activeDM.other_user.name} url={activeDM.other_user.photo_url} size={6} /> {chatTitle}</>
                  : <><FaHashtag className="text-gray-400" />{activeChannel?.name}</>
                }
              </h3>
              <p className="text-xs text-gray-500 hidden md:block">{chatDesc}</p>
            </div>
          </div>
          <button onClick={() => setShowMembers(!showMembers)}
            className="flex items-center gap-1 md:gap-2 text-sm text-gray-500 hover:text-gray-700 transition">
            <FaUsers /> <span className="hidden md:inline">Members</span> ({members.length})
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-3" style={{background: "linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)"}}>
          {hasMoreRef.current && (
            <div className="flex justify-center py-2">
              <button onClick={loadOlderMessages} disabled={loadingMore}
                className="text-xs text-primary-600 hover:text-primary-800 bg-white border border-gray-200 px-4 py-1.5 rounded-full shadow-sm disabled:opacity-50">
                {loadingMore ? 'Loading...' : '⬆ Load older messages'}
              </button>
            </div>
          )}
          {messages.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <FaCommentDots className="text-4xl mx-auto mb-3 opacity-30" />
              <p className="font-medium">No messages yet</p>
              <p className="text-sm">Be the first to say something in {chatTitle}!</p>
            </div>
          )}

          {/* Group messages by date */}
          {messages.map((msg, i) => {
            const prev = messages[i - 1];
            const showDate = !prev || new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString();
            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="flex items-center gap-3 px-4 py-2">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 font-medium">
                      {new Date(msg.created_at).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                )}
                <MessageBubble
                  msg={msg}
                  currentUserId={user?.id}
                  onReact={handleReact}
                  onReply={setReplyTo}
                  onDelete={handleDelete}
                  onEdit={startEdit}
                  isDM={!!activeDM}
                  editingMsgId={editingMsgId}
                  editText={editText}
                  setEditText={setEditText}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                />
              </React.Fragment>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="px-4 py-1 flex items-center gap-2">
            <div className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
            </div>
            <span className="text-xs text-gray-500 italic">
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.slice(0,-1).join(', ')} and ${typingUsers.at(-1)} are typing...`}
            </span>
          </div>
        )}

        {/* Reply preview */}
        {replyTo && (
          <div className="mx-2 md:mx-4 px-3 py-2 bg-blue-50 border-l-4 border-blue-400 rounded flex items-center justify-between">
            <div className="text-sm text-blue-700 truncate">
              <span className="font-semibold">Replying to {replyTo.display_name}:</span>{' '}
              {(replyTo.content || replyTo.code_snippet || '📷 Image').slice(0, 80)}
            </div>
            <button onClick={() => setReplyTo(null)} className="text-blue-400 hover:text-blue-600 ml-2">
              <FaTimes size={14} />
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="px-2 md:px-4 pb-3 md:pb-4 pt-2">

          {codeMode && (
            <div className="mb-2 rounded-xl overflow-hidden shadow-xl" style={{border:'1px solid #3c3c3c'}}>

              {/* ── Title bar */}
              <div className="flex items-center gap-2 px-3 py-2" style={{background:'#2b2b2b',borderBottom:'1px solid #3c3c3c'}}>
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full cursor-pointer hover:opacity-80" style={{background:'#ff5f57'}} onClick={()=>setCodeMode(false)} title="Close" />
                  <span className="w-3 h-3 rounded-full" style={{background:'#febc2e'}} />
                  <span className="w-3 h-3 rounded-full" style={{background:'#28c840'}} />
                </div>
                <span className="text-xs ml-2 font-mono" style={{color:'#9d9d9d'}}>solution.py</span>
                <div className="flex-1" />
                <span className="text-xs px-2 py-0.5 rounded" style={{background:'#3c3c3c',color:'#6a9955'}}>Python 3</span>
              </div>

              {/* ── Tab bar */}
              <div className="flex items-center px-2" style={{background:'#2d2d2d',borderBottom:'1px solid #3c3c3c'}}>
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border-t-2" style={{borderColor:'#4a9eff',color:'#cdd6f4',background:'#1e1e2e'}}>
                  <span>🐍</span> solution.py
                </div>
              </div>

              {/* ── Editor area: line numbers + textarea side by side */}
              <div className="flex relative" style={{background:'#1e1e2e',minHeight:'120px'}}>
                {/* Line numbers */}
                <div className="select-none text-right py-3 px-3 text-xs font-mono leading-5 flex-shrink-0"
                  style={{background:'#1e1e2e',color:'#495162',borderRight:'1px solid #3c3c3c',minWidth:'3rem'}}>
                  {(text || ' ').split('\n').map((_,i) => (
                    <div key={i} style={{lineHeight:'1.5rem'}}>{i+1}</div>
                  ))}
                </div>

                {/* The actual textarea — invisible but captures input */}
                <textarea
                  ref={textRef}
                  value={text}
                  onChange={e => {
                    setText(e.target.value);
                    if (user && (activeChannel || activeDM)) {
                      const key = activeDM?.thread_id || activeChannel?.id;
                      if (!isTypingRef.current) {
                        isTypingRef.current = true;
                        supabase.channel('typing-' + key)
                          .send({ type: 'broadcast', event: 'typing', payload: { user_id: user.id, name: displayName } });
                      }
                      clearTimeout(typingTimeoutRef.current);
                      typingTimeoutRef.current = setTimeout(() => { isTypingRef.current = false; }, 2000);
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const s = e.target.selectionStart;
                      const v = text;
                      const newVal = v.substring(0,s) + '    ' + v.substring(s);
                      setText(newVal);
                      setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = s+4; }, 0);
                    }
                    if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); sendMessage(); }
                  }}
                  rows={Math.max(5, (text || '').split('\n').length + 1)}
                  spellCheck={false}
                  autoCapitalize="none"
                  className="absolute inset-0 w-full h-full resize-none outline-none font-mono text-xs leading-6 py-3 px-3"
                  style={{
                    background:'transparent',
                    color:'transparent',
                    caretColor:'#aeafad',
                    zIndex:2,
                    lineHeight:'1.5rem',
                  }}
                  placeholder=""
                />

                {/* Syntax-highlighted overlay — same layout as textarea */}
                <pre className="flex-1 font-mono text-xs py-3 px-3 overflow-x-auto pointer-events-none"
                  style={{color:'#cdd6f4',lineHeight:'1.5rem',margin:0,whiteSpace:'pre-wrap',wordBreak:'break-all'}}
                  dangerouslySetInnerHTML={{ __html:
                    (text || '<span style="color:#495162">  # Write your Python code here...\n  # Example:\n  for i in range(5):\n      print(i)</span>')
                      .split('\n').map(line => highlight(line) || ' ').join('\n')
                  }}
                />
              </div>

              {/* ── Status bar */}
              <div className="flex items-center justify-between px-4 py-1.5 text-xs font-mono"
                style={{background:'#007acc',color:'white'}}>
                <div className="flex items-center gap-4">
                  <span>🐍 Python 3</span>
                  <span>UTF-8</span>
                  <span>Ln {(text.slice(0,text.length).split('\n').length)}, Col {(text.split('\n').at(-1)?.length||0)+1}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="opacity-75">Ctrl+Enter to send</span>
                  <button onClick={sendMessage} disabled={!text.trim() || !user}
                    className="flex items-center gap-1.5 px-3 py-0.5 rounded font-sans font-semibold disabled:opacity-40"
                    style={{background:'#1a7f37',color:'white'}}>
                    <FaPaperPlane size={10} /> Send Code
                  </button>
                </div>
              </div>

            </div>
          )}

          <div className={`flex gap-2 items-end border rounded-xl p-2 transition-all
            ${codeMode ? 'bg-gray-900 border-gray-600 opacity-0 h-0 overflow-hidden p-0' : 'bg-gray-50 border-gray-200'}`}>

            {/* Image upload */}
            <button onClick={() => fileRef.current?.click()}
              disabled={uploading || !user}
              className="p-2 text-gray-400 hover:text-primary-600 transition disabled:opacity-40 flex-shrink-0">
              {uploading ? <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                : <FaImage />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} />

            {/* Code toggle */}
            <button onClick={() => setCodeMode(!codeMode)}
              disabled={!user}
              className={`p-2 transition flex-shrink-0 disabled:opacity-40
                ${codeMode ? 'text-green-400' : 'text-gray-400 hover:text-primary-600'}`}>
              <FaCode />
            </button>

            {/* Text input — hidden when code editor is open */}
            <textarea
              ref={textRef}
              value={text}
              style={{ display: codeMode ? 'none' : undefined }}
              onChange={e => {
                setText(e.target.value);
                // Broadcast typing indicator
                if (user && (activeChannel || activeDM)) {
                  const key = activeDM?.thread_id || activeChannel?.id;
                  if (!isTypingRef.current) {
                    isTypingRef.current = true;
                    supabase.channel(`typing-${key}`)
                      .send({ type: 'broadcast', event: 'typing', payload: { user_id: user.id, name: displayName } });
                  }
                  clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = setTimeout(() => { isTypingRef.current = false; }, 2000);
                }
              }}
              onKeyDown={handleKey}
              disabled={!user}
              rows={codeMode ? 4 : 1}
              placeholder={user
                ? (codeMode ? 'Paste your Python code here... (Ctrl+Enter to send)' : `Message ${chatTitle}`)
                : 'Log in to send messages'}
              className={`flex-1 resize-none bg-transparent outline-none text-sm leading-relaxed
                ${codeMode ? 'text-green-300 font-mono text-xs' : 'text-gray-800'}
                disabled:cursor-not-allowed`}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && !codeMode) { e.preventDefault(); sendMessage(); }
                if (e.key === 'Enter' && e.ctrlKey && codeMode) { e.preventDefault(); sendMessage(); }
              }}
            />

            {/* Send — only shown in text mode */}
            {!codeMode && (
              <button onClick={sendMessage}
                disabled={!text.trim() || !user}
                className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-40 flex-shrink-0">
                <FaPaperPlane size={14} />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1 px-1">Enter to send • Shift+Enter for new line</p>
        </div>
      </div>

      {/* ── Members panel ─────────────────────────────────── */}
      {showMembers && (
        <div className="fixed md:relative inset-0 md:inset-auto z-30 md:z-auto md:w-60 md:flex-shrink-0 bg-white md:border-l flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h4 className="font-semibold text-gray-800">Members</h4>
            <button onClick={() => setShowMembers(false)} className="text-gray-400 hover:text-gray-600">
              <FaTimes size={14} />
            </button>
          </div>
          <div className="p-2 border-b">
            <div className="relative">
              <FaSearch className="absolute left-2.5 top-2.5 text-gray-400 text-xs" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search members..."
                className="w-full pl-7 pr-3 py-1.5 text-sm bg-gray-50 border rounded-lg focus:outline-none" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {filteredMembers.map(m => (
              <div key={m.user_id || m.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 group">
                <div className="relative">
                  <Avatar name={m.name} url={m.photo_url} size={8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                    {isOnline(m.user_id) && (
                      <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" title="Online" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {isOnline(m.user_id) ? <span className="text-green-500">● Online</span>
                      : m.user_id ? `Last seen: ${formatLastSeen(lastSeen[m.user_id])}`
                      : <span className="capitalize">{m.role}</span>}
                  </p>
                </div>
                {user && m.user_id && m.user_id !== user.id && (
                  <button onClick={() => startDM(m)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-primary-600 transition">
                    <FaCommentDots size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── New Channel Modal ─────────────────────────────── */}
      {showNewChannel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Create New Channel</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Channel Name</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-gray-400"><FaHashtag /></span>
                  <input value={newChannelName} onChange={e => setNewChannelName(e.target.value)}
                    placeholder="e.g. algorithms"
                    className="w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description (optional)</label>
                <input value={newChannelDesc} onChange={e => setNewChannelDesc(e.target.value)}
                  placeholder="What's this channel for?"
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewChannel(false)}
                className="flex-1 px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 transition text-sm">
                Cancel
              </button>
              <button onClick={createChannel}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm">
                Create Channel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;