// src/components/SecureCustomizationChat.js
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSend, FiPaperclip, FiImage, FiX, FiCheck,
  FiClock, FiShoppingCart, FiUser, FiStar,
  FiDownload, FiEye, FiTrash2, FiMessageCircle,
  FiLock, FiShield, FiCheckCircle, FiAlertCircle
} from 'react-icons/fi';
import { useSecureChat } from '../context/SecureChatContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const SecureCustomizationChat = ({ 
  isOpen, 
  onClose, 
  product, 
  artisan,
  initialCustomization = null 
}) => {
  const { user } = useAuth();
  const { 
    joinRoom, 
    leaveRoom, 
    sendMessage, 
    messages, 
    activeRoom,
    sendTyping,
    createCustomizationRoom,
    updateCustomization,
    loading 
  } = useSecureChat();
  
  const { addToCart } = useCart();
  
  const [chatMessage, setChatMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [customizationData, setCustomizationData] = useState(initialCustomization || {
    options: {},
    dimensions: { width: '', height: '', depth: '' },
    notes: '',
    quantity: 1,
    deadline: '',
    status: 'draft',
    price: product?.price || 0
  });
  const [showQuote, setShowQuote] = useState(false);
  const [quoteAccepted, setQuoteAccepted] = useState(false);
  const [roomInitialized, setRoomInitialized] = useState(false);
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize secure chat room
  useEffect(() => {
    if (isOpen && user && product && !roomInitialized) {
      initializeChat();
    }
    
    return () => {
      if (activeRoom) {
        leaveRoom();
      }
    };
  }, [isOpen, user, product]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeRoom]);

  // Handle typing indicator
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (chatMessage) {
      sendTyping(true);
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(false);
      }, 1000);
    } else {
      sendTyping(false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatMessage, sendTyping]);

  const initializeChat = async () => {
    try {
      const room = await createCustomizationRoom(
        artisan?._id || product?.artisan?._id,
        product?._id,
        customizationData
      );
      
      if (room) {
        await joinRoom(room._id);
        setRoomInitialized(true);
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      toast.error('Could not start customization chat');
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() && attachments.length === 0) return;

    let messageText = chatMessage;
    
    // Add attachments to message
    if (attachments.length > 0) {
      const attachmentUrls = attachments.map(a => a.url).join('\n');
      messageText = `${chatMessage}\n\n📎 Attachments:\n${attachmentUrls}`;
      
      // Clear attachments after sending
      setAttachments([]);
    }

    const success = await sendMessage(messageText, customizationData._id);
    
    if (success) {
      setChatMessage('');
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'chat_attachment');
        
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/upload/chat`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        return {
          url: response.data.url,
          name: file.name,
          type: file.type,
          size: file.size
        };
      });
      
      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...uploadedFiles]);
      
      toast.success(`${uploadedFiles.length} file(s) uploaded`);
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuoteAction = async (accept) => {
    if (accept) {
      setQuoteAccepted(true);
      await updateCustomization(customizationData._id, { 
        status: 'accepted',
        acceptedAt: new Date().toISOString()
      });
      
      await sendMessage(
        `✅ I accept the quote of Rs${customizationData.price}. Please proceed with the customization.`,
        customizationData._id
      );
      
      toast.success('Quote accepted!');
    } else {
      await sendMessage(
        `❌ I'd like to negotiate the price. Can we discuss further?`,
        customizationData._id
      );
      
      toast.success('Quote declined - you can continue negotiating');
    }
    
    setShowQuote(false);
  };

  const handleAddToCart = () => {
    const cartItem = {
      ...product,
      customization: customizationData,
      quantity: customizationData.quantity,
      finalPrice: customizationData.price
    };
    
    addToCart(cartItem);
    toast.success('Custom item added to cart!');
    onClose();
  };

  const currentRoomMessages = activeRoom ? messages[activeRoom] || [] : [];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Secure Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Chat Modal */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.3 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col"
        >
          {/* Header with Security Badge */}
          <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                  <FiLock className="h-3 w-3" />
                  <span className="text-xs font-medium">End-to-End Encrypted</span>
                </div>
                <div className="flex items-center space-x-1 bg-green-500/20 px-3 py-1 rounded-full">
                  <FiShield className="h-3 w-3" />
                  <span className="text-xs font-medium">Private Chat</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center space-x-4 mt-4">
              <div className="relative">
                <img
                  src={artisan?.avatar?.url || product?.artisan?.avatar?.url || 'https://via.placeholder.com/50'}
                  alt={artisan?.name || product?.artisan?.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white"
                />
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">
                  {artisan?.name || product?.artisan?.name}
                </h3>
                <p className="text-sm opacity-90 flex items-center">
                  <FiStar className="h-4 w-4 fill-current mr-1" />
                  {artisan?.rating || product?.artisan?.rating || 4.8} · Artisan
                </p>
              </div>
            </div>
          </div>

          {/* Product Info Bar */}
          <div className="bg-gray-50 border-b p-3 flex items-center space-x-3">
            <img
              src={product?.images?.[0]?.url || 'https://via.placeholder.com/40'}
              alt={product?.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{product?.name}</p>
              <p className="text-sm text-gray-500">
                Customization: {Object.keys(customizationData.options || {}).length} options
              </p>
            </div>
            {customizationData.status === 'accepted' && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center">
                <FiCheckCircle className="mr-1" /> Ready
              </span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {loading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              </div>
            )}

            {currentRoomMessages.map((msg, index) => (
              <div
                key={msg._id || index}
                className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.isOwn
                    ? 'bg-primary text-white rounded-br-none'
                    : 'bg-white text-gray-900 shadow-sm rounded-bl-none'
                }`}>
                  {!msg.isOwn && (
                    <p className="text-xs font-medium text-primary mb-1">
                      {msg.senderName}
                    </p>
                  )}
                  
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  
                  {msg.attachments?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.attachments.map((att, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={att}
                            alt="attachment"
                            className="w-20 h-20 rounded-lg object-cover cursor-pointer hover:opacity-75"
                            onClick={() => window.open(att, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs ${
                      msg.isOwn ? 'text-primary-light' : 'text-gray-500'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    {msg.isOwn && msg.status === 'sending' && (
                      <FiClock className="h-3 w-3 ml-2 opacity-70" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Quote Request Card */}
            {showQuote && (
              <div className="bg-white rounded-2xl shadow-lg p-4 border-2 border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900">Quote from Artisan</span>
                  <span className="text-2xl font-bold text-primary">Rs{customizationData.price}</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>✓ Customization options included</p>
                  <p>✓ Estimated delivery: 7-10 days</p>
                  <p>✓ Free shipping</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleQuoteAction(false)}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
                  >
                    Negotiate
                  </button>
                  <button
                    onClick={() => handleQuoteAction(true)}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark"
                  >
                    Accept Quote
                  </button>
                </div>
              </div>
            )}
            
            {/* Accepted Confirmation */}
            {quoteAccepted && (
              <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <FiCheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Quote Accepted!</p>
                    <p className="text-sm text-green-600">
                      Your customization is confirmed. Add to cart to proceed.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center justify-center space-x-2"
                >
                  <FiShoppingCart className="h-4 w-4" />
                  <span>Add to Cart (Rs{customizationData.price})</span>
                </button>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Attachment Preview */}
          {attachments.length > 0 && (
            <div className="px-4 py-2 bg-gray-100 border-t flex space-x-2 overflow-x-auto">
              {attachments.map((file, index) => (
                <div key={index} className="relative flex-shrink-0">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={file.url}
                      alt="preview"
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <FiPaperclip className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t bg-white">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
                className="p-3 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                ) : (
                  <FiPaperclip className="h-5 w-5" />
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
              />
              
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={!activeRoom}
              />
              
              <button
                onClick={handleSendMessage}
                disabled={(!chatMessage.trim() && attachments.length === 0) || !activeRoom}
                className="p-3 bg-primary text-white rounded-xl hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiSend className="h-5 w-5" />
              </button>
            </div>

            {/* Security Notice */}
            <p className="text-xs text-gray-500 text-center mt-3 flex items-center justify-center">
              <FiLock className="h-3 w-3 mr-1" />
              Messages are end-to-end encrypted. Only you and the artisan can view them.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SecureCustomizationChat;