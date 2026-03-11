// src/pages/Chat.js — Real-time WhatsApp-style chat
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiArrowLeft, FiLoader, FiCheck, FiMessageCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import toast from 'react-hot-toast';

/* ── Double tick (WhatsApp style) ─────────────────────────── */
const Tick = ({ read }) => (
  <span className={`inline-flex items-center ml-1 ${read ? 'text-blue-400' : 'text-white/50'}`}>
    <FiCheck className="h-2.5 w-2.5 -mr-1.5" />
    <FiCheck className="h-2.5 w-2.5" />
  </span>
);

/* ── Animated typing dots ─────────────────────────────────── */
const TypingDots = ({ name, avatar }) => (
  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
    className="flex items-end gap-2">
    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mb-0.5">
      {avatar
        ? <img src={avatar} alt="" className="w-full h-full object-cover" />
        : <div className="w-full h-full bg-[#128c7e] flex items-center justify-center text-white text-xs font-bold">{name?.[0]?.toUpperCase()}</div>
      }
    </div>
    <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
      <div className="flex gap-1 items-center h-4">
        {[0,1,2].map(i => (
          <motion.span key={i} className="w-2 h-2 rounded-full bg-gray-400 block"
            animate={{ y: [-3, 3, -3] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.18 }} />
        ))}
      </div>
    </div>
  </motion.div>
);

/* ── Date separator ───────────────────────────────────────── */
const DateBadge = ({ label }) => (
  <div className="flex justify-center my-3">
    <span className="bg-[#e1f2fb]/90 text-[#54656f] text-xs px-3 py-1 rounded-full shadow-sm">{label}</span>
  </div>
);

const fmtTime = d => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const fmtDate = d => {
  const date = new Date(d), today = new Date(), yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yest.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
};

const WA_BG = `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23a8c6b8' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`;

const Chat = () => {
  const { roomId }  = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const { socket }  = useSocket();
  const myId        = String(user?._id || user?.id || '');

  const [messages,   setMessages]   = useState([]);
  const [message,    setMessage]    = useState('');
  const [loading,    setLoading]    = useState(true);
  const [sending,    setSending]    = useState(false);
  const [otherUser,  setOtherUser]  = useState(null);
  const [isOnline,   setIsOnline]   = useState(false);
  const [isTyping,   setIsTyping]   = useState(false);

  const endRef     = useRef(null);
  const inputRef   = useRef(null);
  const typerTimer = useRef(null);

  /* ── Load room + history ──────────────────────────────── */
  useEffect(() => {
    if (!roomId || !myId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [msgR, roomsR] = await Promise.all([
          api.get(`/chat/rooms/${roomId}/messages`),
          api.get('/chat/rooms'),
        ]);
        if (!alive) return;

        const raw = msgR.data.messages || [];
        setMessages(raw.map(m => ({
          ...m,
          isOwn: String(m.sender?._id || m.sender) === myId,
          read:  m.isRead || false,
        })));

        const room = roomsR.data.rooms?.find(r => String(r._id) === String(roomId));
        if (room) {
          const other = room.participants?.find(p => String(p._id || p) !== myId);
          setOtherUser(other || null);
        }
      } catch (e) {
        if (!alive) return;
        if (e?.response?.status === 403) { toast.error('No access to this chat'); navigate(-1); }
        else toast.error('Failed to load chat');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [roomId, myId]);

  /* ── Socket events ────────────────────────────────────── */
  useEffect(() => {
    if (!socket || !roomId) return;
    socket.emit('join-room', roomId);
    socket.emit('user-online', { userId: myId, online: true });

    const onMsg = (data) => {
      if (String(data.roomId) !== String(roomId)) return;
      const isOwn = String(data.sender) === myId;
      setMessages(prev => {
        const clean = prev.filter(m => !m._id?.startsWith('tmp-'));
        if (clean.find(m => m._id && m._id === data._id)) return prev;
        return [...clean, { ...data, isOwn, read: isOwn, createdAt: data.timestamp || new Date() }];
      });
      setIsTyping(false);
      if (!isOwn) socket.emit('message-read', { roomId, readBy: myId });
    };

    const onTyping = ({ roomId: rid, isTyping: t }) => {
      if (String(rid) === String(roomId)) setIsTyping(t);
    };

    const onRead = ({ roomId: rid }) => {
      if (String(rid) === String(roomId))
        setMessages(prev => prev.map(m => m.isOwn ? { ...m, read: true } : m));
    };

    const onOnline = ({ userId, online }) => {
      if (otherUser && String(userId) === String(otherUser._id || otherUser)) setIsOnline(online);
    };

    socket.on('receive-message',  onMsg);
    socket.on('user-typing',      onTyping);
    socket.on('messages-read',    onRead);
    socket.on('user-online',      onOnline);

    return () => {
      socket.off('receive-message', onMsg);
      socket.off('user-typing',     onTyping);
      socket.off('messages-read',   onRead);
      socket.off('user-online',     onOnline);
      socket.emit('user-online', { userId: myId, online: false });
    };
  }, [socket, roomId, myId, otherUser]);

  /* ── Auto-scroll ──────────────────────────────────────── */
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  /* ── Send ─────────────────────────────────────────────── */
  const handleSend = useCallback(async () => {
    const text = message.trim();
    if (!text || sending) return;
    setMessage('');
    setSending(true);
    if (socket) socket.emit('typing', { roomId, isTyping: false });

    const tmpId = `tmp-${Date.now()}`;
    setMessages(prev => [...prev, { _id: tmpId, message: text, sender: myId, isOwn: true, read: false, createdAt: new Date() }]);

    try {
      await api.post('/chat/messages', { roomId, message: text, type: 'text' });
    } catch {
      toast.error('Failed to send');
      setMessages(prev => prev.filter(m => m._id !== tmpId));
      setMessage(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [message, sending, socket, roomId, myId]);

  /* ── Typing ───────────────────────────────────────────── */
  const handleInput = (e) => {
    setMessage(e.target.value);
    if (!socket) return;
    socket.emit('typing', { roomId, isTyping: true });
    clearTimeout(typerTimer.current);
    typerTimer.current = setTimeout(() => socket.emit('typing', { roomId, isTyping: false }), 1500);
  };

  /* ── Group by date ────────────────────────────────────── */
  const grouped = (() => {
    const out = []; let last = '';
    messages.forEach(m => {
      const d = fmtDate(m.createdAt || new Date());
      if (d !== last) { out.push({ type: 'date', label: d, key: `d-${d}` }); last = d; }
      out.push({ type: 'msg', data: m, key: m._id });
    });
    return out;
  })();

  const otherAvatar = otherUser?.avatar?.url;
  const otherName   = otherUser?.name || 'Chat';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <FiLoader className="h-10 w-10 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#efeae2' }}>

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-20 shadow-md"
        style={{ backgroundColor: '#075e54', paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <button onClick={() => navigate(-1)}
          className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors flex-shrink-0">
          <FiArrowLeft className="h-5 w-5" />
        </button>
        {otherAvatar
          ? <img src={otherAvatar} alt={otherName} className="w-10 h-10 rounded-full object-cover border-2 border-white/20 flex-shrink-0" />
          : <div className="w-10 h-10 rounded-full bg-[#128c7e] flex-shrink-0 flex items-center justify-center text-white font-bold text-lg">
              {otherName[0]?.toUpperCase()}
            </div>
        }
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{otherName}</p>
          <p className="text-xs" style={{ color: isTyping ? '#25d366' : isOnline ? '#25d366' : 'rgba(255,255,255,0.6)' }}>
            {isTyping ? 'typing…' : isOnline ? 'online' : (otherUser?.role === 'artisan' ? '🎨 Artisan' : '🛍️ Buyer')}
          </p>
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-0.5" style={{ backgroundImage: WA_BG }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-white/70 flex items-center justify-center mb-4 shadow-sm">
              <FiMessageCircle className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No messages yet</p>
            <p className="text-gray-400 text-sm mt-1">Say hello to {otherName}!</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {grouped.map(item => {
            if (item.type === 'date') return <DateBadge key={item.key} label={item.label} />;
            const m = item.data;
            return (
              <motion.div key={item.key}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.15 }}
                className={`flex items-end gap-2 mb-1 ${m.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                {!m.isOwn && (
                  <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden mb-0.5">
                    {otherAvatar
                      ? <img src={otherAvatar} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-[#128c7e] flex items-center justify-center text-white text-xs font-bold">{otherName[0]?.toUpperCase()}</div>
                    }
                  </div>
                )}
                <div className={`relative max-w-[72%] sm:max-w-[58%] px-3.5 py-2 rounded-2xl shadow-sm text-sm leading-snug
                  ${m.isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                  style={{ backgroundColor: m.isOwn ? '#dcf8c6' : '#ffffff' }}>
                  <p className="text-gray-900 break-words">{m.message}</p>
                  <div className="flex items-center justify-end gap-0.5 mt-1">
                    <span className="text-[10px] text-gray-400">{fmtTime(m.createdAt || new Date())}</span>
                    {m.isOwn && <Tick read={m.read} />}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <AnimatePresence>
          {isTyping && <TypingDots key="typing" name={otherName} avatar={otherAvatar} />}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* ── Input ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-3 sticky bottom-0 z-10"
        style={{ backgroundColor: '#f0f0f0', paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="flex-1 bg-white rounded-full flex items-center px-4 shadow-sm border border-gray-200">
          <input
            ref={inputRef}
            value={message}
            onChange={handleInput}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message"
            className="flex-1 py-3 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={handleSend}
          disabled={!message.trim() || sending}
          className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-md transition-all disabled:opacity-50 flex-shrink-0"
          style={{ backgroundColor: message.trim() ? '#075e54' : '#8696a0' }}>
          {sending ? <FiLoader className="h-5 w-5 animate-spin" /> : <FiSend className="h-5 w-5" />}
        </motion.button>
      </div>
    </div>
  );
};

export default Chat;
