// src/pages/ArtisanDetail.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft, FiMapPin, FiPackage, FiShield, FiAward,
  FiMessageCircle, FiSend, FiX, FiLoader, FiMail, FiCheck
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import ProductCard from '../components/ProductCard';
import api from '../services/api';

/* ─── Typing dots animation ─────────────────────────────────────── */
const TypingDots = () => (
  <div className="flex items-center gap-1 px-4 py-2 bg-white rounded-2xl shadow-sm w-fit">
    {[0, 1, 2].map(i => (
      <motion.span key={i}
        className="w-2 h-2 rounded-full bg-gray-400 block"
        animate={{ y: [-3, 3, -3] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
    ))}
  </div>
);

const ArtisanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  /* ─── Page data ─────────────────────────────────────────────────── */
  const [artisan, setArtisan]   = useState(null);
  const [products, setProducts] = useState([]);
  const [pageState, setPageState] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  /* ─── Custom request + chat state ──────────────────────────────── */
  const [requestStep, setRequestStep]     = useState('idle'); // 'idle'|'request'|'pending'|'accepted'|'rejected'
  const [requestMsg, setRequestMsg]       = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [showChat, setShowChat]           = useState(false);
  const [chatRoom, setChatRoom]           = useState(null);
  const [messages, setMessages]           = useState([]);
  const [newMsg, setNewMsg]               = useState('');
  const [sending, setSending]             = useState(false);
  const [loadingChat, setLoadingChat]     = useState(false);
  const [otherTyping, setOtherTyping]     = useState(false);
  const chatEndRef   = useRef(null);
  const typingTimer  = useRef(null);

  /* ─── Fetch artisan ─────────────────────────────────────────────── */
  useEffect(() => {
    let alive = true;
    setPageState('loading');
    setErrorMsg('');

    (async () => {
      try {
        const res = await api.get(`/artisans/${id}`);
        if (!alive) return;
        const data = res.data?.artisan;
        if (!data?._id) throw new Error('Artisan data missing');
        setArtisan(data);
        setProducts((data.products || []).map(p => ({
          ...p,
          artisan: {
            _id: data._id,
            name: data.name,
            avatar: data.avatar,
            location: data.location,
          }
        })));
        setPageState('ready');
      } catch (err) {
        if (!alive) return;
        // Only show error for real failures, not component unmounts
        const status = err?.response?.status;
        if (status === 404) {
          setErrorMsg('This artisan profile does not exist.');
        } else if (err?.code === 'ERR_CANCELED') {
          return; // cancelled request – do nothing
        } else {
          setErrorMsg('Could not load the artisan profile. Please try again.');
        }
        setPageState('error');
      }
    })();

    return () => { alive = false; };
  }, [id]);

  /* ─── Socket: listen for artisan's response to message request ─── */
  useEffect(() => {
    if (!socket) return;
    const handleResponse = (data) => {
      // For chat-based requests: isChatRequest flag is set
      // For product-based requests: productId matches artisan's id page
      const isChatResp = data.isChatRequest;
      const isProductResp = data.productId && String(data.productId) === String(id);
      if (isChatResp || isProductResp || !data.productId) {
        if (data.available || data.status === 'accepted') {
          setRequestStep('accepted');
          if (isChatResp) {
            toast.success('Message accepted! Opening chat…');
            setTimeout(() => openChat(), 500);
          }
        } else {
          setRequestStep('rejected');
        }
      }
    };
    socket.on('customization-response', handleResponse);
    return () => socket.off('customization-response', handleResponse);
  }, [socket, id]);

  /* ─── Send initial custom request message ───────────────────────── */
  const handleSendRequest = async () => {
    if (!user) { toast.error('Please login'); navigate('/login'); return; }
    if (!requestMsg.trim()) { toast.error('Please enter your message'); return; }
    setSendingRequest(true);
    try {
      // Create chat room and send the message
      const roomRes = await api.post('/chat/room', { artisanId: id });
      const room = roomRes.data.room;
      if (room?._id) {
        socket?.emit('join-room', String(room._id));
        await api.post('/chat/messages', {
          roomId: room._id,
          message: `📋 Custom Request:
${requestMsg.trim()}`,
          type: 'text',
        });
        setChatRoom(room);
        // Notify artisan via socket (treated as customization request)
        socket?.emit('message-custom-request', {
          artisanId: id,
          buyerName: user.name,
          buyerId: user.id || user._id,
          message: requestMsg.trim(),
          roomId: room._id,
        });
      }
      setRequestStep('pending');
      toast.success('Request sent! Waiting for artisan to accept…');
    } catch (e) {
      toast.error('Failed to send request. Please try again.');
    } finally {
      setSendingRequest(false);
    }
  };

  /* ─── Open existing chat room ───────────────────────────────────── */
  const openChat = async () => {
    setShowChat(true);
    if (chatRoom) return;
    setLoadingChat(true);
    try {
      const roomRes = await api.post('/chat/room', { artisanId: id });
      const room = roomRes.data.room;
      if (!room?._id) throw new Error('No room');
      setChatRoom(room);
      socket?.emit('join-room', String(room._id));
      const msgRes = await api.get(`/chat/rooms/${room._id}/messages`);
      const history = (msgRes.data.messages || []).map(m => ({
        ...m,
        isOwn: String(m.sender?._id || m.sender) === String(user?._id || user?.id),
      }));
      setMessages(history);
    } catch (e) {
      toast.error('Could not open chat.');
      setShowChat(false);
    } finally {
      setLoadingChat(false);
    }
  };

  /* ─── Socket: receive messages + typing ────────────────────────── */
  useEffect(() => {
    if (!socket || !chatRoom) return;

    const onMsg = (data) => {
      if (String(data.roomId) !== String(chatRoom._id)) return;
      setMessages(prev => {
        // replace optimistic temp or deduplicate
        const withoutTemp = prev.filter(m => !m._id?.startsWith('tmp-'));
        if (withoutTemp.find(m => m._id && m._id === data._id)) return prev;
        return [...withoutTemp, {
          ...data,
          isOwn: String(data.sender) === String(user?._id || user?.id),
        }];
      });
      setOtherTyping(false);
    };

    const onTyping = ({ roomId, isTyping }) => {
      if (String(roomId) === String(chatRoom._id)) setOtherTyping(isTyping);
    };

    socket.on('receive-message', onMsg);
    socket.on('user-typing', onTyping);
    return () => { socket.off('receive-message', onMsg); socket.off('user-typing', onTyping); };
  }, [socket, chatRoom, user]);

  /* ─── Auto-scroll ───────────────────────────────────────────────── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  /* ─── "Send Message" button click ──────────────────────────────── */
  const handleOpenChat = useCallback(() => {
    if (!user) { toast.error('Please login to send messages'); navigate('/login'); return; }
    // Block artisan/admin from messaging their own profile
    const userId = user.id || user._id;
    if (String(userId) === String(id)) {
      toast.error("You can't send a message to yourself!", { icon: '🚫' });
      return;
    }
    // Show custom request panel first (unless already accepted/chatting)
    if (requestStep === 'accepted' || showChat) {
      openChat();
    } else {
      setRequestStep('request');
    }
  }, [user, navigate, requestStep, showChat, id]);

  /* ─── Send message ──────────────────────────────────────────────── */
  const handleSend = async () => {
    const text = newMsg.trim();
    if (!text || !chatRoom) return;
    setNewMsg('');

    // Optimistic bubble
    const tmpId = `tmp-${Date.now()}`;
    setMessages(prev => [...prev, {
      _id: tmpId, message: text,
      sender: user?._id || user?.id,
      isOwn: true, timestamp: new Date(),
    }]);

    setSending(true);
    try {
      await api.post('/chat/messages', { roomId: chatRoom._id, message: text, type: 'text' });
    } catch {
      toast.error('Message failed to send');
      setMessages(prev => prev.filter(m => m._id !== tmpId));
    } finally {
      setSending(false);
    }
  };

  /* ─── Typing indicator ──────────────────────────────────────────── */
  const handleInput = (e) => {
    setNewMsg(e.target.value);
    if (!socket || !chatRoom) return;
    socket.emit('typing', { roomId: String(chatRoom._id), isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('typing', { roomId: String(chatRoom._id), isTyping: false });
    }, 1500);
  };

  /* ─── Computed flags ───────────────────────────────────────────── */
  const isOwnProfile = user && artisan && String(user.id || user._id) === String(artisan._id);

  /* ─── Render helpers ────────────────────────────────────────────── */
  const coverUrl    = artisan?.coverImage?.url  || artisan?.coverImage  || 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg';
  const avatarUrl   = artisan?.avatar?.url      || artisan?.profileImage;
  const bizName     = artisan?.artisanProfile?.businessName || artisan?.name || '';
  const description = artisan?.bio || artisan?.artisanProfile?.description || '';
  const specialties = artisan?.artisanProfile?.specialties || [];
  const reviews     = artisan?.fullArtisanData?.reviews   || [];
  const experience  = artisan?.artisanProfile?.yearsOfExperience || artisan?.experience || 0;

  /* ─── Loading ───────────────────────────────────────────────────── */
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading artisan profile…</p>
        </div>
      </div>
    );
  }

  /* ─── Error ─────────────────────────────────────────────────────── */
  if (pageState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-sm w-full">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Artisan Not Found</h2>
          <p className="text-gray-500 mb-6 text-sm">{errorMsg}</p>
          <button onClick={() => navigate('/artisans')}
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark font-medium transition-colors">
            Browse All Artisans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition-colors font-medium">
          <FiArrowLeft className="h-5 w-5" /> Back
        </button>

        {/* ── Profile Hero ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">

          {/* Cover image */}
          <div className="relative h-60">
            <img src={coverUrl} alt={bizName}
              className="w-full h-full object-cover"
              onError={e => { e.target.src = 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg'; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Identity overlay */}
            <div className="absolute bottom-5 left-6 flex items-end gap-5">
              {avatarUrl ? (
                <img src={avatarUrl} alt={artisan.name}
                  className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl object-cover flex-shrink-0"
                  onError={e => { e.target.style.display = 'none'; }} />
              ) : (
                <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl bg-primary flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                  {artisan.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="text-white pb-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold drop-shadow">{bizName}</h1>
                  {artisan.isVerified && (
                    <span title="Verified Artisan" className="bg-blue-500 rounded-full p-0.5">
                      <FiShield className="h-4 w-4 text-white" />
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/80">by {artisan.name}</p>
                {artisan.location && (
                  <p className="flex items-center gap-1 text-xs text-white/70 mt-1">
                    <FiMapPin className="h-3 w-3" /> {artisan.location}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Left: about, stats, specialties, reviews */}
              <div className="lg:col-span-2 space-y-6">

                {/* About */}
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">About</h2>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {description || 'Passionate artisan creating beautiful handcrafted products with years of experience and dedication.'}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: FiPackage, label: 'Products',   value: products.length,  color: 'text-primary' },
                    { icon: FiAward,   label: 'Yrs Exp',    value: `${experience}y`, color: 'text-amber-600' },
                    { icon: FiCheck,   label: 'Verified',   value: artisan.isVerified ? 'Yes' : 'No', color: 'text-green-600' },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-4 text-center">
                      <Icon className={`h-5 w-5 ${color} mx-auto mb-1.5`} />
                      <p className={`text-xl font-bold ${color}`}>{value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Specialties */}
                {specialties.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {specialties.map((s, i) => (
                        <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium capitalize">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews */}
                {reviews.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Customer Reviews</h3>
                    <div className="space-y-3">
                      {reviews.slice(0, 4).map((r, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {r.buyerName?.[0] || 'B'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{r.buyerName}</p>
                              <p className="text-xs text-gray-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</p>
                            </div>
                            {r.isVerifiedPurchase && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">✓ Verified</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: artisan info card */}
              <div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 sticky top-28 border border-gray-200 space-y-4">
                  <h3 className="font-bold text-gray-900 text-lg">Artisan Info</h3>

                  <div className="space-y-3">
                    {artisan.location && (
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FiMapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Location</p>
                          <p className="font-semibold">{artisan.location}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiPackage className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Products</p>
                        <p className="font-semibold">{products.length} item{products.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiAward className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Experience</p>
                        <p className="font-semibold">{experience} year{experience !== 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {artisan.isVerified && (
                      <div className="flex items-center gap-3 text-sm text-green-700 bg-green-50 rounded-xl p-3">
                        <FiShield className="h-4 w-4 flex-shrink-0" />
                        <span className="font-semibold">Verified Artisan</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-400 text-center">
                      🎨 Batticaloa District Artisan
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>

        {/* ── Products Grid ─────────────────────────────────────────── */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Products by {bizName}
            <span className="ml-2 text-base font-normal text-gray-400">({products.length})</span>
          </h2>
          {products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-gray-500 font-medium">No products listed yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
            </div>
          )}
        </div>

      </div>

      {/* ── Custom Request Panel ─────────────────────────────────────── */}
      <AnimatePresence>
        {(requestStep === 'request' || requestStep === 'pending' || requestStep === 'rejected') && !showChat && (
          <motion.div
            key="request-panel"
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.92 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-6 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary-dark px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                {artisan?.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{bizName}</p>
                <p className="text-white/60 text-xs">Custom Request</p>
              </div>
              <button onClick={() => setRequestStep('idle')} className="text-white/70 hover:text-white p-1">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              {requestStep === 'request' && (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                    <p className="text-xs text-amber-800 font-medium">📋 Your message will be treated as a custom product request. The artisan must accept before the chat opens.</p>
                  </div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Your Message / Custom Request</label>
                  <textarea
                    value={requestMsg}
                    onChange={e => setRequestMsg(e.target.value)}
                    rows={4}
                    placeholder="Describe your custom order request, questions, or ideas…"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-primary outline-none resize-none transition-colors mb-4"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setRequestStep('idle')}
                      className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50">
                      Cancel
                    </button>
                    <button onClick={handleSendRequest} disabled={sendingRequest || !requestMsg.trim()}
                      className="flex-1 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-primary-dark transition-colors">
                      {sendingRequest ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiSend className="h-4 w-4" />}
                      {sendingRequest ? 'Sending…' : 'Send Request'}
                    </button>
                  </div>
                </>
              )}

              {requestStep === 'pending' && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiLoader className="h-8 w-8 text-amber-600 animate-spin" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Request Sent!</h3>
                  <p className="text-gray-500 text-sm mb-4">Waiting for {bizName} to accept your request…</p>
                  <div className="flex items-center justify-center gap-2 bg-amber-50 rounded-xl p-3">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs text-amber-700 font-medium">You will be notified when the artisan responds</span>
                  </div>
                  <button onClick={() => setRequestStep('idle')} className="mt-4 text-xs text-gray-400 hover:text-gray-600">Dismiss</button>
                </div>
              )}

              {requestStep === 'rejected' && (
                <div className="text-center py-6">
                  <div className="text-4xl mb-3">😔</div>
                  <h3 className="font-bold text-gray-900 mb-2">Request Declined</h3>
                  <p className="text-gray-500 text-sm mb-4">{bizName} is unable to fulfil this request at the moment.</p>
                  <button onClick={() => setRequestStep('request')}
                    className="w-full py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors">
                    Try a Different Request
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Real-time Chat Floating Panel ─────────────────────────────── */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={  { opacity: 0, y: 60, scale: 0.92 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-6 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col"
            style={{ maxHeight: 'min(540px, calc(100vh - 100px))' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary-dark px-4 py-3 flex items-center gap-3 rounded-t-2xl flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={artisan.name} className="w-9 h-9 rounded-full object-cover border-2 border-white/30 flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {artisan.name?.[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{bizName}</p>
                <p className="text-white/60 text-xs">
                  {loadingChat ? 'Connecting…' : chatRoom ? '● Online' : 'Real-time chat'}
                </p>
              </div>
              <button onClick={() => setShowChat(false)}
                className="text-white/70 hover:text-white transition-colors p-1 flex-shrink-0">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50" style={{ minHeight: 240 }}>
              {loadingChat ? (
                <div className="flex items-center justify-center h-32">
                  <FiLoader className="h-7 w-7 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <FiMessageCircle className="h-12 w-12 text-gray-200 mb-2" />
                  <p className="text-gray-400 text-sm font-medium">Start the conversation!</p>
                  <p className="text-gray-300 text-xs mt-1">Messages are private.</p>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={m._id || i} className={`flex items-end gap-2 ${m.isOwn ? 'justify-end' : 'justify-start'}`}>
                    {!m.isOwn && (
                      <div className="w-7 h-7 rounded-full bg-primary/90 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mb-1">
                        {artisan.name?.[0]}
                      </div>
                    )}
                    <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-snug shadow-sm ${
                      m.isOwn
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                    }`}>
                      <p>{m.message}</p>
                      {m.timestamp && (
                        <p className={`text-[10px] mt-1 ${m.isOwn ? 'text-white/50' : 'text-gray-300'}`}>
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
              {otherTyping && (
                <div className="flex items-end gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-primary/90 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                    {artisan.name?.[0]}
                  </div>
                  <TypingDots />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input bar */}
            <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 rounded-b-2xl flex-shrink-0">
              <input
                type="text"
                value={newMsg}
                onChange={handleInput}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={loadingChat ? 'Connecting…' : 'Type a message…'}
                disabled={loadingChat || sending}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
                autoFocus
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                disabled={!newMsg.trim() || sending || loadingChat}
                className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-40 flex-shrink-0">
                {sending
                  ? <FiLoader className="h-4 w-4 animate-spin" />
                  : <FiSend className="h-4 w-4" />}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArtisanDetail;
