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

// ── Syntax-highlight shim (inline, no deps) ──────────────────
const highlight = (code) => code
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/(#.*$)/gm, '<span style="color:#6A9955">$1</span>')
  .replace(/\b(def|class|import|from|return|if|else|elif|for|while|in|not|and|or|True|False|None|print|len|range)\b/g,
    '<span style="color:#569CD6">$1</span>')
  .replace(/(".*?"|'.*?')/g, '<span style="color:#CE9178">$1</span>')
  .replace(/\b(\d+)\b/g, '<span style="color:#B5CEA8">$1</span>');

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
const MessageBubble = ({ msg, currentUserId, onReact, onReply, onDelete, members }) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const isOwn = msg.user_id === currentUserId;
  if (msg.is_deleted) return (
    <div className="px-4 py-1 text-xs text-gray-400 italic">Message deleted</div>
  );

  // Group reactions
  const reactionMap = {};
  (msg.reactions || []).forEach(r => {
    reactionMap[r.emoji] = (reactionMap[r.emoji] || []);
    reactionMap[r.emoji].push(r.user_id);
  });

  return (
    <div className={`group flex gap-3 px-3 md:px-4 py-1.5 hover:bg-gray-50 transition-colors`}>
      <div className="flex-shrink-0 mt-0.5">
        <Avatar name={msg.display_name} url={msg.avatar_url} size={7} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="font-semibold text-sm text-gray-900">{msg.display_name}</span>
          <span className="text-xs text-gray-400">
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Reply preview */}
        {msg.reply_to_id && msg.reply_preview && (
          <div className="border-l-2 border-gray-300 pl-2 mb-1 text-xs text-gray-500 truncate">
            ↩ {msg.reply_preview}
          </div>
        )}

        {/* Text content */}
        {msg.content && (
          <p className="text-sm text-gray-800 break-words whitespace-pre-wrap">{msg.content}</p>
        )}

        {/* Image */}
        {msg.image_url && (
          <img src={msg.image_url} alt="shared"
            className="mt-1 max-w-xs rounded-lg border cursor-pointer hover:opacity-90"
            onClick={() => window.open(msg.image_url, '_blank')} />
        )}

        {/* Code snippet */}
        {msg.code_snippet && (
          <div className="mt-1 rounded-lg overflow-hidden border border-gray-200">
            <div className="bg-gray-800 px-3 py-1 flex items-center justify-between">
              <span className="text-xs text-gray-400">{msg.code_language || 'python'}</span>
              <button onClick={() => { navigator.clipboard.writeText(msg.code_snippet); toast.success('Copied!'); }}
                className="text-xs text-gray-400 hover:text-white">copy</button>
            </div>
            <pre className="bg-gray-900 text-gray-100 text-xs p-3 overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: highlight(msg.code_snippet) }} />
          </div>
        )}

        {/* Reactions */}
        {Object.keys(reactionMap).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(reactionMap).map(([emoji, users]) => (
              <button key={emoji}
                onClick={() => onReact(msg.id, emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition
                  ${users.includes(currentUserId)
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                {emoji} {users.length}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons — show on hover */}
      <div className="opacity-0 group-hover:opacity-100 flex items-start gap-1 pt-0.5 transition-opacity">
        <div className="relative">
          <button onClick={() => setShowEmoji(!showEmoji)}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600">
            <FaSmile size={13} />
          </button>
          {showEmoji && (
            <div className="absolute right-0 top-8 bg-white border rounded-xl shadow-lg p-2 flex gap-1 z-20">
              {QUICK_EMOJIS.map(e => (
                <button key={e} onClick={() => { onReact(msg.id, e); setShowEmoji(false); }}
                  className="hover:scale-125 transition-transform text-lg">{e}</button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => onReply(msg)}
          className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600">
          <FaReply size={13} />
        </button>
        {isOwn && (
          <button onClick={() => onDelete(msg.id)}
            className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500">
            <FaTrash size={13} />
          </button>
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
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const textRef = useRef(null);
  const realtimeRef = useRef(null);

  // Profile info
  const myProfile = members.find(m => m.user_id === user?.id);
  const displayName = myProfile?.name || user?.email?.split('@')[0] || 'Guest';
  const avatarUrl = myProfile?.photo_url || null;

  // ── Load channels ──────────────────────────────────────────
  useEffect(() => {
    requestNotificationPermission();
    const load = async () => {
      const { data } = await supabase.from('chat_channels').select('*').order('created_at');
      setChannels(data || []);
      if (data?.length) setActiveChannel(data[0]);

      const { data: mems } = await supabase.from('members').select('user_id, name, photo_url, role, status');
      setMembers(mems || []);
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
  const loadMessages = useCallback(async (channelId, dmThreadId) => {
    let query = supabase
      .from('chat_messages')
      .select('*, reactions:chat_reactions(*)')
      .order('created_at', { ascending: true })
      .limit(100);

    if (dmThreadId) {
      query = query.eq('dm_thread_id', dmThreadId);
    } else {
      query = query.eq('channel_id', channelId).is('dm_thread_id', null);
    }

    const { data } = await query;
    setMessages(data || []);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

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

              // In-app toast when message arrives in a channel you're NOT viewing
              if (data.user_id !== user?.id && !document.hidden && activeDM?.thread_id !== dmThreadId && activeChannel?.id !== channelId) {
                toast(`💬 ${data.display_name}: ${(data.content || '').slice(0, 60) || 'New message'}`, { duration: 3000 });
              }
              // Browser notification when tab is hidden
              if (data.user_id !== user?.id && document.hidden) {
                const where = activeDM
                  ? `DM from ${data.display_name}`
                  : `#${activeChannel?.name}`;
                const preview = data.content
                  || (data.image_url ? '📷 Shared an image' : '')
                  || (data.code_snippet ? '💻 Shared code' : '');
                sendNotification(
                  `${data.display_name} — ${where}`,
                  preview || 'New message',
                  data.avatar_url
                );
              }
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

    return () => { if (realtimeRef.current) supabase.removeChannel(realtimeRef.current); };
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
                onClick={() => { setActiveChannel(ch); setActiveDM(null); setShowSidebar(false); }}
                className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 text-sm transition
                  ${activeChannel?.id === ch.id && !activeDM
                    ? 'bg-gray-600 text-white'
                    : 'hover:bg-gray-700 text-gray-400 hover:text-white'}`}>
                <FaHashtag size={12} className="flex-shrink-0" />
                <span className="truncate">{ch.name}</span>
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
                  onClick={() => { setActiveDM(dm); setActiveChannel(null); setShowSidebar(false); }}
                  className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 text-sm transition
                    ${activeDM?.thread_id === dm.thread_id
                      ? 'bg-gray-600 text-white'
                      : 'hover:bg-gray-700 text-gray-400 hover:text-white'}`}>
                  <Avatar name={dm.other_user.name} url={dm.other_user.photo_url} size={5} />
                  <span className="truncate">{dm.other_user.name}</span>
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
        <div className="flex-1 overflow-y-auto py-3">
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
                  members={members}
                />
              </React.Fragment>
            );
          })}
          <div ref={bottomRef} />
        </div>

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
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs text-gray-500 font-mono">Python code mode</span>
              <button onClick={() => setCodeMode(false)} className="text-xs text-red-400 hover:text-red-600">✕ cancel</button>
            </div>
          )}
          <div className={`flex gap-2 items-end border rounded-xl p-2 transition-all
            ${codeMode ? 'bg-gray-900 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>

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

            {/* Text input */}
            <textarea
              ref={textRef}
              value={text}
              onChange={e => setText(e.target.value)}
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

            {/* Send */}
            <button onClick={sendMessage}
              disabled={!text.trim() || !user}
              className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-40 flex-shrink-0">
              <FaPaperPlane size={14} />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1 px-1">
            {codeMode ? 'Ctrl+Enter to send code' : 'Enter to send • Shift+Enter for new line'}
          </p>
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
                  <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{m.role}</p>
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