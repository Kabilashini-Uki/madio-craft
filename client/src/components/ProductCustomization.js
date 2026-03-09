// components/ProductCustomization.js
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiSend, FiUpload, FiCheck, 
  FiShoppingCart, FiMessageCircle,
  FiClock, FiPaperclip,
  FiPlus, FiMinus,
  FiAlertCircle
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const ProductCustomization = ({ product, isOpen, onClose }) => {
  const { user } = useAuth();
  const { createRoom, joinRoom, sendMessage, loadMessages, socket } = useChat();
  const { addToCart } = useCart();
  
  const [step, setStep] = useState(1);
  const [customization, setCustomization] = useState({
    notes: '', referenceImages: [],
    dimensions: { width: '', height: '', depth: '' },
    color: '', size: '', description: '', quantity: 1, deadline: ''
  });
  
  const [chatMessage, setChatMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [price, setPrice] = useState(product?.price || 0);
  const [chatRoom, setChatRoom] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    if (isOpen && user && product) {
      const initChat = async () => {
        try {
          const artisanId = product.artisan?._id || product.artisan;
          if (!artisanId) { toast.error('Artisan not found for this product'); return; }
          const room = await createRoom(artisanId, product._id);
          if (room) {
            setChatRoom(room);
            joinRoom(room._id);
            const res = await loadMessages(room._id);
            setChatHistory(res || []);
          }
        } catch (error) {
          console.error('Failed to initialize chat:', error);
        }
      };
      initChat();
    }
  }, [isOpen, user, product]);

  useEffect(() => {
    if (!socket || !chatRoom) return;
    const handleIncoming = ({ roomId, message, sender, timestamp }) => {
      if (roomId !== chatRoom._id) return;
      const newMsg = { message, sender, timestamp: timestamp || new Date() };
      setChatHistory(prev => [...prev, newMsg]);
      if (requestSent && sender !== user?._id) {
        const lower = (message || '').toLowerCase();
        if (lower.includes('confirm') || lower.includes('accept') || lower.includes('approved')) {
          setStep(4);
          toast.success('Artisan confirmed your customization!');
        } else if (lower.includes('cancel') || lower.includes('decline') || lower.includes('reject') || lower.includes('unavailable')) {
          setStep(5);
          toast.error('Artisan cancelled your customization request');
        }
      }
    };
    socket.on('receive-message', handleIncoming);
    return () => socket.off('receive-message', handleIncoming);
  }, [socket, chatRoom, requestSent, user]);

  useEffect(() => {
    let calc = product?.price || 0;
    if (product?.customizationOptions) {
      product.customizationOptions.forEach(opt => {
        if (selectedOptions[opt.name] && opt.priceAdjustment) calc += opt.priceAdjustment;
      });
    }
    calc *= customization.quantity;
    setPrice(calc);
  }, [selectedOptions, customization.quantity, product]);

  const handleOptionSelect = (name, value) => {
    setSelectedOptions(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploads = await Promise.all(files.map(async (file) => {
        const fd = new FormData();
        fd.append('image', file);
        const res = await api.post('/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return { url: res.data.url, name: file.name };
      }));
      setUploadedFiles(prev => [...prev, ...uploads]);
      setCustomization(prev => ({ ...prev, referenceImages: [...prev.referenceImages, ...uploads] }));
      toast.success(`${uploads.length} image(s) uploaded`);
    } catch { toast.error('Failed to upload images'); }
    finally { setUploading(false); }
  };

  const removeImage = (i) => {
    const updated = uploadedFiles.filter((_, idx) => idx !== i);
    setUploadedFiles(updated);
    setCustomization(prev => ({ ...prev, referenceImages: updated }));
  };

  const handleSendCustomizationRequest = async () => {
    setSendingRequest(true);
    try {
      const parts = [
        `🎨 CUSTOMIZATION REQUEST`,
        `Product: ${product.name}`,
        `Quantity: ${customization.quantity}`,
        `Estimated Budget: Rs. ${price.toLocaleString()}`,
      ];
      if (customization.color) parts.push(`Color: ${customization.color}`);
      if (customization.size) parts.push(`Size: ${customization.size}`);
      if (customization.description) parts.push(`Description: ${customization.description}`);
      Object.entries(selectedOptions).forEach(([k, v]) => parts.push(`${k}: ${v}`));
      if (customization.dimensions.width) parts.push(`Dimensions: ${customization.dimensions.width}x${customization.dimensions.height}x${customization.dimensions.depth} cm`);
      if (customization.notes) parts.push(`Notes: ${customization.notes}`);
      if (customization.deadline) parts.push(`Deadline: ${new Date(customization.deadline).toLocaleDateString()}`);
      parts.push(`\nPlease reply CONFIRM to accept or CANCEL if unavailable.`);
      const message = parts.join('\n');
      await sendMessage(message, chatRoom?._id);
      setChatHistory(prev => [...prev, { message, sender: user?._id, timestamp: new Date() }]);
      setRequestSent(true);
      setStep(3);
      toast.success('Customization request sent! Waiting for artisan response...');
    } catch { toast.error('Failed to send request. Please try again.'); }
    finally { setSendingRequest(false); }
  };

  const handleSendChatMessage = async () => {
    if (!chatMessage.trim()) return;
    try {
      await sendMessage(chatMessage, chatRoom?._id);
      setChatHistory(prev => [...prev, { message: chatMessage, sender: user?._id, timestamp: new Date() }]);
      setChatMessage('');
    } catch { toast.error('Failed to send message'); }
  };

  const handleAddToCart = async () => {
    try {
      const customizationData = {
        options: Object.entries(selectedOptions).map(([name, value]) => ({ name, value })),
        notes: customization.notes, color: customization.color, size: customization.size,
        description: customization.description, referenceImages: customization.referenceImages,
        dimensions: customization.dimensions,
        deadline: customization.deadline ? new Date(customization.deadline) : null
      };
      const success = await addToCart(product, customizationData, customization.quantity);
      if (success) { toast.success('Custom order added to cart!'); onClose(); }
      else toast.error('Failed to add to cart');
    } catch (err) { toast.error(err.message || 'Error adding to cart'); }
  };

  if (!isOpen) return null;

  const STEP_LABELS = ['Customize', 'Chat', 'Waiting', 'Order'];
  const STEP_ICONS = ['🎨', '💬', '⏳', '✅'];

  const ChatMessages = () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ minHeight: 200 }}>
      {chatHistory.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <FiMessageCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No messages yet. Send your request!</p>
        </div>
      )}
      {chatHistory.map((msg, i) => (
        <div key={i} className={`flex ${msg.sender === user?._id ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${msg.sender === user?._id ? 'bg-primary text-white rounded-br-none' : 'bg-white text-gray-900 shadow-sm rounded-bl-none'}`}>
            <p className="whitespace-pre-wrap">{msg.message}</p>
            <span className={`text-xs mt-1 block ${msg.sender === user?._id ? 'text-white/70' : 'text-gray-400'}`}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      ))}
      <div ref={chatEndRef} />
    </div>
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.3 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-4xl bg-white shadow-2xl flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden">
                <img src={product.images?.[0]?.url || 'https://via.placeholder.com/100'} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-gray-900">Customize Product</h2>
                <p className="text-sm text-gray-600">{product.name} · by {product.artisan?.name || 'Artisan'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><FiX className="h-6 w-6" /></button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-3 bg-gray-50 border-b">
            <div className="flex items-center justify-between max-w-sm mx-auto">
              {STEP_LABELS.map((label, i) => {
                const sNum = i + 1;
                const isActive = step >= sNum;
                return (
                  <div key={i} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${step === 5 && sNum === 4 ? 'bg-red-400 text-white' : isActive ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {step > sNum ? <FiCheck className="h-4 w-4" /> : STEP_ICONS[i]}
                      </div>
                      <span className="text-xs mt-1 text-gray-500">{label}</span>
                    </div>
                    {i < STEP_LABELS.length - 1 && (
                      <div className={`w-12 h-1 mx-1 rounded-full mb-3 ${step > sNum ? 'bg-primary' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">

            {/* STEP 1: Customize */}
            {step === 1 && (
              <div className="p-6 space-y-5">
                <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <span className="w-1 h-5 bg-primary rounded-full mr-3"></span>Customization Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color Preference</label>
                      <input type="text" value={customization.color}
                        onChange={e => setCustomization(p => ({ ...p, color: e.target.value }))}
                        placeholder="e.g. Deep red, Navy blue"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                      <input type="text" value={customization.size}
                        onChange={e => setCustomization(p => ({ ...p, size: e.target.value }))}
                        placeholder="e.g. Small, 30x40cm"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Description</label>
                    <textarea value={customization.description}
                      onChange={e => setCustomization(p => ({ ...p, description: e.target.value }))}
                      rows={3} placeholder="Describe what you want customized — design, patterns, engravings..."
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                  </div>
                </div>

                {product.customizationOptions?.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <span className="w-1 h-5 bg-primary rounded-full mr-3"></span>Product Options
                    </h3>
                    {product.customizationOptions.map((opt, i) => (
                      <div key={i}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {opt.name}{opt.required && <span className="text-red-500 ml-1">*</span>}
                          {opt.priceAdjustment > 0 && <span className="text-green-600 ml-2 text-xs">+Rs. {opt.priceAdjustment}</span>}
                        </label>
                        {opt.type === 'color' && (
                          <div className="flex flex-wrap gap-2">
                            {opt.options?.map((c, j) => (
                              <button key={j} onClick={() => handleOptionSelect(opt.name, c)}
                                className={`w-9 h-9 rounded-full border-4 transition-all ${selectedOptions[opt.name] === c ? 'border-primary scale-110' : 'border-gray-300'}`}
                                style={{ backgroundColor: c }} title={c} />
                            ))}
                          </div>
                        )}
                        {opt.type === 'size' && (
                          <div className="flex flex-wrap gap-2">
                            {opt.options?.map((s, j) => (
                              <button key={j} onClick={() => handleOptionSelect(opt.name, s)}
                                className={`px-4 py-2 border-2 rounded-lg text-sm font-medium transition-all ${selectedOptions[opt.name] === s ? 'bg-primary text-white border-primary' : 'border-gray-300 hover:border-primary'}`}>
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                        {(opt.type === 'text' || opt.type === 'material') && (
                          <input type="text" value={selectedOptions[opt.name] || ''}
                            onChange={e => handleOptionSelect(opt.name, e.target.value)}
                            placeholder={`Enter ${opt.name.toLowerCase()}`}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-1 h-5 bg-primary rounded-full mr-3"></span>Dimensions (Optional)
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {['width', 'height', 'depth'].map(dim => (
                      <div key={dim}>
                        <label className="block text-xs text-gray-500 mb-1 capitalize">{dim} (cm)</label>
                        <input type="number" min="0" placeholder="0"
                          value={customization.dimensions[dim]}
                          onChange={e => setCustomization(p => ({ ...p, dimensions: { ...p.dimensions, [dim]: e.target.value } }))}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-1 h-5 bg-primary rounded-full mr-3"></span>Reference Images (Optional)
                  </h3>
                  <input type="file" ref={fileInputRef} multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => fileInputRef.current.click()} disabled={uploading}
                      className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary flex flex-col items-center justify-center transition-colors">
                      {uploading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" /> : <><FiUpload className="h-5 w-5 text-gray-400 mb-1" /><span className="text-xs text-gray-400">Upload</span></>}
                    </button>
                    {uploadedFiles.map((file, i) => (
                      <div key={i} className="relative w-20 h-20 group">
                        <img src={file.url} alt="" className="w-full h-full rounded-xl object-cover" />
                        <button onClick={() => removeImage(i)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <div className="flex items-center justify-between bg-white rounded-xl border-2 border-gray-200">
                      <button onClick={() => setCustomization(p => ({ ...p, quantity: Math.max(1, p.quantity - 1) }))}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-l-lg"><FiMinus className="h-4 w-4" /></button>
                      <span className="text-xl font-bold w-12 text-center">{customization.quantity}</span>
                      <button onClick={() => setCustomization(p => ({ ...p, quantity: p.quantity + 1 }))}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-r-lg"><FiPlus className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Deadline</label>
                    <input type="date" value={customization.deadline} min={new Date().toISOString().split('T')[0]}
                      onChange={e => setCustomization(p => ({ ...p, deadline: e.target.value }))}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary" />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="w-1 h-5 bg-primary rounded-full mr-3"></span>Additional Notes
                  </h3>
                  <textarea value={customization.notes}
                    onChange={e => setCustomization(p => ({ ...p, notes: e.target.value }))}
                    rows={3} placeholder="Any other special requirements..."
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            )}

            {/* STEP 2: Chat */}
            {step === 2 && (
              <div className="flex flex-col" style={{ minHeight: 400 }}>
                <div className="flex items-center space-x-3 p-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-lg font-bold">
                    {product.artisan?.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{product.artisan?.name || 'Artisan'}</h3>
                    <p className="text-xs text-gray-500 flex items-center"><FiClock className="h-3 w-3 mr-1" />Typically replies within 1 hour</p>
                  </div>
                </div>
                <ChatMessages />
                <div className="p-4 border-t bg-white">
                  <div className="flex items-center space-x-2">
                    <input type="text" value={chatMessage} onChange={e => setChatMessage(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleSendChatMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent" />
                    <button onClick={handleSendChatMessage} disabled={!chatMessage.trim()}
                      className="p-3 bg-primary text-white rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors">
                      <FiSend className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Waiting */}
            {step === 3 && (
              <div className="flex flex-col" style={{ minHeight: 400 }}>
                <div className="p-5 text-center border-b bg-amber-50">
                  <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FiClock className="h-7 w-7 text-amber-600 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Waiting for Artisan Response</h3>
                  <p className="text-gray-600 text-sm mt-1">Your request has been sent. The artisan will confirm or cancel shortly.</p>
                </div>
                <ChatMessages />
                <div className="p-4 border-t bg-white">
                  <div className="flex items-center space-x-2">
                    <input type="text" value={chatMessage} onChange={e => setChatMessage(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleSendChatMessage()}
                      placeholder="Send a follow-up message..."
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary" />
                    <button onClick={handleSendChatMessage} disabled={!chatMessage.trim()}
                      className="p-3 bg-primary text-white rounded-xl hover:bg-primary-dark disabled:opacity-50">
                      <FiSend className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Confirmed */}
            {step === 4 && (
              <div className="p-8 flex flex-col items-center justify-center" style={{ minHeight: 400 }}>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <FiCheck className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Customization Confirmed!</h3>
                <p className="text-gray-600 text-center mb-6">The artisan has confirmed your request. You can now place your order.</p>
                <div className="w-full max-w-md bg-green-50 border border-green-200 rounded-2xl p-5 space-y-2 mb-6">
                  <h4 className="font-semibold text-gray-900">Order Summary</h4>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Product</span><span className="font-medium">{product.name}</span></div>
                  {customization.color && <div className="flex justify-between text-sm"><span className="text-gray-600">Color</span><span className="font-medium">{customization.color}</span></div>}
                  {customization.size && <div className="flex justify-between text-sm"><span className="text-gray-600">Size</span><span className="font-medium">{customization.size}</span></div>}
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Quantity</span><span className="font-medium">{customization.quantity}</span></div>
                  <div className="flex justify-between text-sm border-t pt-2 font-bold"><span>Total</span><span className="text-primary">Rs. {price.toLocaleString()}</span></div>
                </div>
                <button onClick={handleAddToCart}
                  className="w-full max-w-md px-6 py-4 bg-primary text-white rounded-xl hover:bg-primary-dark font-semibold flex items-center justify-center space-x-2 transition-all">
                  <FiShoppingCart className="h-5 w-5" /><span>Add to Cart & Order</span>
                </button>
              </div>
            )}

            {/* STEP 5: Cancelled */}
            {step === 5 && (
              <div className="p-8 flex flex-col items-center justify-center" style={{ minHeight: 400 }}>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <FiAlertCircle className="h-10 w-10 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Customization Unavailable</h3>
                <p className="text-gray-600 text-center mb-6">The artisan has cancelled your request. Please try another product or contact a different artisan.</p>
                <div className="flex space-x-4 w-full max-w-md">
                  <button onClick={() => { setStep(1); setRequestSent(false); }}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                    Try Again
                  </button>
                  <button onClick={onClose}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark font-semibold">
                    Browse Other Products
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Bar */}
          <div className="border-t p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Estimated Total</p>
                <p className="text-2xl font-bold text-primary">Rs. {price.toLocaleString()}</p>
              </div>
              <div className="flex space-x-3">
                {step === 1 && (
                  <>
                    <button onClick={onClose} className="px-5 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                    <button onClick={() => setStep(2)} className="px-5 py-2.5 border-2 border-primary text-primary rounded-xl hover:bg-primary/5 font-medium flex items-center space-x-1">
                      <FiMessageCircle className="h-4 w-4" /><span>Chat First</span>
                    </button>
                    <button onClick={handleSendCustomizationRequest} disabled={sendingRequest}
                      className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark font-medium flex items-center space-x-1 disabled:opacity-50">
                      {sendingRequest ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1" /><span>Sending...</span></> : <><FiSend className="h-4 w-4" /><span>Send to Artisan</span></>}
                    </button>
                  </>
                )}
                {step === 2 && (
                  <>
                    <button onClick={() => setStep(1)} className="px-5 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">← Back</button>
                    <button onClick={handleSendCustomizationRequest} disabled={sendingRequest}
                      className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark font-medium flex items-center space-x-1 disabled:opacity-50">
                      {sendingRequest ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1" /><span>Sending...</span></> : <><FiSend className="h-4 w-4" /><span>Send Request</span></>}
                    </button>
                  </>
                )}
                {step === 3 && (
                  <button onClick={() => setStep(2)} className="px-5 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">← Back to Chat</button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProductCustomization;
