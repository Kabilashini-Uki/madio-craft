// components/ProductCustomization.js
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiSend, FiUpload, FiImage, FiCheck, 
  FiShoppingCart, FiMessageCircle, FiUser,
  FiClock, FiPaperclip, FiDownload, FiStar,
  FiPlus, FiMinus, FiTrash2, FiEye
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProductCustomization = ({ product, isOpen, onClose }) => {
  const { user } = useAuth();
  const { createRoom, joinRoom, sendMessage, messages, activeRoom, loadMessages } = useChat();
  const { addToCart } = useCart();
  
  const [step, setStep] = useState(1);
  const [customization, setCustomization] = useState({
    options: [],
    notes: '',
    referenceImages: [],
    dimensions: { width: '', height: '', depth: '' },
    color: '',
    material: '',
    quantity: 1,
    deadline: ''
  });
  
  const [chatMessage, setChatMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [price, setPrice] = useState(product?.price || 0);
  const [chatRoom, setChatRoom] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [artisanTyping, setArtisanTyping] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [customizationRequests, setCustomizationRequests] = useState([]);
  const [activeRequest, setActiveRequest] = useState(null);
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatHistory]);

  // Initialize chat room with artisan
  useEffect(() => {
    if (isOpen && user && product) {
      const initChat = async () => {
        try {
          const room = await createRoom(product.artisan?._id || product.artisan, product._id);
          if (room) {
            setChatRoom(room);
            joinRoom(room._id);
            // Load previous messages
            const history = await loadMessages(room._id);
            setChatHistory(history || []);
          }
        } catch (error) {
          console.error('Failed to initialize chat:', error);
          toast.error('Could not connect to artisan');
        }
      };
      initChat();
    }
  }, [isOpen, user, product]);

  // Calculate price based on customizations
  useEffect(() => {
    let calculatedPrice = product?.price || 0;
    
    // Add customization option prices
    if (product?.customizationOptions) {
      product.customizationOptions.forEach(option => {
        if (selectedOptions[option.name] && option.priceAdjustment) {
          calculatedPrice += option.priceAdjustment;
        }
      });
    }
    
    // Add material upcharge if selected
    if (customization.material && product?.materials) {
      const material = product.materials.find(m => m.name === customization.material);
      if (material?.priceAdjustment) {
        calculatedPrice += material.priceAdjustment;
      }
    }
    
    // Multiply by quantity
    calculatedPrice *= customization.quantity;
    
    setPrice(calculatedPrice);
  }, [selectedOptions, customization.quantity, customization.material, product]);

  const handleOptionSelect = (optionName, value, priceAdjustment = 0) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: value
    }));
    
    // Update customization object
    setCustomization(prev => ({
      ...prev,
      options: [
        ...prev.options.filter(opt => opt.name !== optionName),
        { name: optionName, value, priceAdjustment }
      ]
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/upload`,
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
          publicId: response.data.publicId,
          name: file.name,
          size: file.size,
          type: file.type
        };
      });
      
      const uploadedImages = await Promise.all(uploadPromises);
      
      setUploadedFiles(prev => [...prev, ...uploadedImages]);
      setCustomization(prev => ({
        ...prev,
        referenceImages: [...prev.referenceImages, ...uploadedImages]
      }));
      
      toast.success(`${uploadedImages.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    const newImages = [...uploadedFiles];
    newImages.splice(index, 1);
    setUploadedFiles(newImages);
    
    setCustomization(prev => ({
      ...prev,
      referenceImages: newImages
    }));
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() && uploadedFiles.length === 0) return;
    
    let messageText = chatMessage;
    
    // If there are files, include them in the message
    if (uploadedFiles.length > 0) {
      const fileLinks = uploadedFiles.map(f => f.url).join('\n');
      messageText = `${chatMessage}\n\n📎 Attachments:\n${fileLinks}`;
      
      // Clear uploaded files after sending
      setUploadedFiles([]);
    }
    
    try {
      await sendMessage(messageText, chatRoom?._id);
      setChatMessage('');
      
      // Simulate artisan typing (for demo)
      setTimeout(() => {
        setArtisanTyping(true);
        setTimeout(() => {
          setArtisanTyping(false);
          // Auto-reply for demo (remove in production)
          if (chatMessage.toLowerCase().includes('price')) {
            const autoReply = {
              sender: 'artisan',
              message: `Based on your requirements, the estimated price would be around Rs${price}. Would you like to proceed?`,
              timestamp: new Date()
            };
            setChatHistory(prev => [...prev, autoReply]);
          }
        }, 2000);
      }, 1000);
      
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleSendCustomizationRequest = async () => {
    // Validate required fields
    const requiredOptions = product?.customizationOptions?.filter(opt => opt.required) || [];
    const missingRequired = requiredOptions.filter(opt => !selectedOptions[opt.name]);
    
    if (missingRequired.length > 0) {
      toast.error(`Please fill in: ${missingRequired.map(o => o.name).join(', ')}`);
      return;
    }
    
    // Create customization request
    const requestDetails = {
      productId: product._id,
      productName: product.name,
      options: selectedOptions,
      dimensions: customization.dimensions,
      notes: customization.notes,
      quantity: customization.quantity,
      estimatedPrice: price,
      deadline: customization.deadline,
      images: customization.referenceImages.map(img => img.url),
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    // Send to artisan via chat
    const message = `
🎨 **NEW CUSTOMIZATION REQUEST**

**Product:** ${product.name}
**Quantity:** ${customization.quantity}
**Estimated Budget:** Rs${price}

**Selected Options:**
${Object.entries(selectedOptions).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

${customization.dimensions.width ? `**Dimensions:** ${customization.dimensions.width} x ${customization.dimensions.height} x ${customization.dimensions.depth} cm` : ''}

${customization.notes ? `**Notes:** ${customization.notes}` : ''}

${customization.deadline ? `**Deadline:** ${new Date(customization.deadline).toLocaleDateString()}` : ''}

${customization.referenceImages.length > 0 ? `**Reference Images:** ${customization.referenceImages.length} attached` : ''}

Please review and let me know if you can accommodate this request.
    `;
    
    try {
      await sendMessage(message, chatRoom?._id);
      
      // Save request locally
      setCustomizationRequests(prev => [requestDetails, ...prev]);
      setActiveRequest(requestDetails);
      
      toast.success('Customization request sent to artisan!');
      setStep(2);
    } catch (error) {
      toast.error('Failed to send request');
    }
  };

  const handleAddToCart = () => {
    const cartItem = {
      ...product,
      customization: {
        ...customization,
        selectedOptions,
        finalPrice: price
      },
      quantity: customization.quantity
    };
    
    addToCart(cartItem);
    toast.success('Added to cart with customization!');
    onClose();
  };

  const handleQuoteAccept = () => {
    toast.success('Quote accepted! Proceeding to checkout...');
    setStep(3);
  };

  const handleQuoteDecline = () => {
    toast.error('Quote declined. You can continue negotiating.');
    setStep(2);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.3 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-5xl bg-white shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden">
                <img
                  src={product.images?.[0]?.url || 'https://via.placeholder.com/100'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-gray-900">
                  Customize Your Product
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {product.name} by {product.artisan?.name || 'Artisan'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {[
                { number: 1, label: 'Customize', icon: '🎨' },
                { number: 2, label: 'Chat with Artisan', icon: '💬' },
                { number: 3, label: 'Review & Cart', icon: '🛒' }
              ].map((s, index) => (
                <div key={s.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      step >= s.number 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step > s.number ? <FiCheck className="h-5 w-5" /> : s.icon}
                    </div>
                    <span className="text-xs mt-2 font-medium text-gray-600">{s.label}</span>
                  </div>
                  {index < 2 && (
                    <div className={`w-24 h-1 mx-4 rounded-full ${
                      step > s.number ? 'bg-primary' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Quick Actions */}
                <div className="grid grid-cols-4 gap-4">
                  <button
                    onClick={() => setStep(2)}
                    className="p-4 bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors text-center"
                  >
                    <FiMessageCircle className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <span className="text-xs font-medium">Chat with Artisan</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="p-4 bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors text-center"
                  >
                    <FiUpload className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <span className="text-xs font-medium">Upload Reference</span>
                  </button>
                  <button
                    onClick={() => {
                      setCustomization(prev => ({
                        ...prev,
                        quantity: prev.quantity + 1
                      }));
                    }}
                    className="p-4 bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors text-center"
                  >
                    <FiPlus className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <span className="text-xs font-medium">Increase Qty</span>
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setCustomization(prev => ({
                        ...prev,
                        deadline: today
                      }));
                    }}
                    className="p-4 bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors text-center"
                  >
                    <FiClock className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <span className="text-xs font-medium">Set Deadline</span>
                  </button>
                </div>

                {/* Customization Options */}
                {product.customizationOptions?.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <span className="w-1 h-6 bg-primary rounded-full mr-3"></span>
                      Customization Options
                    </h3>
                    
                    {product.customizationOptions.map((option, index) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <label className="font-medium text-gray-900">
                            {option.name}
                            {option.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {option.priceAdjustment > 0 && (
                            <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                              +Rs{option.priceAdjustment}
                            </span>
                          )}
                        </div>
                        
                        {option.type === 'color' && (
                          <div className="flex flex-wrap gap-3">
                            {option.options?.map((color, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleOptionSelect(option.name, color, option.priceAdjustment)}
                                className={`w-12 h-12 rounded-full border-2 transition-all transform hover:scale-110 ${
                                  selectedOptions[option.name] === color
                                    ? 'border-primary ring-4 ring-primary/20 scale-110'
                                    : 'border-gray-300 hover:border-primary'
                                }`}
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        )}
                        
                        {option.type === 'size' && (
                          <div className="flex flex-wrap gap-3">
                            {option.options?.map((size, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleOptionSelect(option.name, size, option.priceAdjustment)}
                                className={`px-6 py-3 border-2 rounded-xl text-sm font-medium transition-all ${
                                  selectedOptions[option.name] === size
                                    ? 'bg-primary text-white border-primary shadow-lg'
                                    : 'border-gray-300 text-gray-700 hover:border-primary hover:bg-primary/5'
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {option.type === 'text' && (
                          <input
                            type="text"
                            placeholder={`Enter ${option.name.toLowerCase()}`}
                            value={selectedOptions[option.name] || ''}
                            onChange={(e) => handleOptionSelect(option.name, e.target.value, option.priceAdjustment)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        )}
                        
                        {option.type === 'material' && (
                          <select
                            value={selectedOptions[option.name] || ''}
                            onChange={(e) => handleOptionSelect(option.name, e.target.value, option.priceAdjustment)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
                          >
                            <option value="">Select {option.name}</option>
                            {option.options?.map((material, idx) => (
                              <option key={idx} value={material}>
                                {material}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Dimensions */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-1 h-6 bg-primary rounded-full mr-3"></span>
                    Dimensions (Optional)
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Width (cm)</label>
                      <input
                        type="number"
                        value={customization.dimensions.width}
                        onChange={(e) => setCustomization(prev => ({
                          ...prev,
                          dimensions: { ...prev.dimensions, width: e.target.value }
                        }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Height (cm)</label>
                      <input
                        type="number"
                        value={customization.dimensions.height}
                        onChange={(e) => setCustomization(prev => ({
                          ...prev,
                          dimensions: { ...prev.dimensions, height: e.target.value }
                        }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Depth (cm)</label>
                      <input
                        type="number"
                        value={customization.dimensions.depth}
                        onChange={(e) => setCustomization(prev => ({
                          ...prev,
                          dimensions: { ...prev.dimensions, depth: e.target.value }
                        }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Reference Images */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-1 h-6 bg-primary rounded-full mr-3"></span>
                    Reference Images
                  </h3>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  
                  <div className="grid grid-cols-6 gap-4">
                    <button
                      onClick={() => fileInputRef.current.click()}
                      disabled={uploading}
                      className="aspect-square border-2 border-dashed border-gray-300 rounded-xl hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center"
                    >
                      {uploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-primary border-t-transparent" />
                      ) : (
                        <>
                          <FiUpload className="h-6 w-6 text-gray-400 mb-2" />
                          <span className="text-xs text-gray-500">Upload</span>
                        </>
                      )}
                    </button>
                    
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img
                          src={file.url}
                          alt={`Reference ${index + 1}`}
                          className="w-full h-full rounded-xl object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                          <button
                            onClick={() => window.open(file.url, '_blank')}
                            className="p-2 bg-white rounded-lg hover:bg-gray-100"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeImage(index)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="absolute bottom-1 left-1 text-xs text-white bg-black/50 px-2 py-1 rounded">
                          {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    Upload images showing similar styles, colors, or designs you like
                  </p>
                </div>

                {/* Additional Notes */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-1 h-6 bg-primary rounded-full mr-3"></span>
                    Additional Notes
                  </h3>
                  <textarea
                    value={customization.notes}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    rows="4"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-primary"
                    placeholder="Describe your requirements in detail... 
- Specific design elements you want
- Color preferences
- Any modifications to the original design
- Questions for the artisan"
                  />
                </div>

                {/* Quantity and Deadline */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Quantity
                    </label>
                    <div className="flex items-center justify-between bg-white rounded-xl border-2 border-gray-200 p-1">
                      <button
                        onClick={() => setCustomization(prev => ({
                          ...prev,
                          quantity: Math.max(1, prev.quantity - 1)
                        }))}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <FiMinus className="h-4 w-4" />
                      </button>
                      <span className="text-xl font-semibold w-16 text-center">
                        {customization.quantity}
                      </span>
                      <button
                        onClick={() => setCustomization(prev => ({
                          ...prev,
                          quantity: prev.quantity + 1
                        }))}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <FiPlus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Preferred Deadline (Optional)
                    </label>
                    <input
                      type="date"
                      value={customization.deadline}
                      onChange={(e) => setCustomization(prev => ({
                        ...prev,
                        deadline: e.target.value
                      }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col"
              >
                {/* Chat Header with Artisan Info */}
                <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-transparent rounded-t-xl">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-xl font-bold">
                        {product.artisan?.name?.charAt(0) || 'A'}
                      </div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {product.artisan?.name || 'Artisan'}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center">
                        <FiClock className="h-3 w-3 mr-1" />
                        Typically replies within 1 hour
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center text-yellow-500">
                      <FiStar className="h-4 w-4 fill-current" />
                      <FiStar className="h-4 w-4 fill-current" />
                      <FiStar className="h-4 w-4 fill-current" />
                      <FiStar className="h-4 w-4 fill-current" />
                      <FiStar className="h-4 w-4" />
                      <span className="ml-2 text-gray-600">4.8</span>
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {chatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.sender === user?._id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.sender === user?._id
                          ? 'bg-primary text-white rounded-br-none'
                          : 'bg-white text-gray-900 shadow-sm rounded-bl-none'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        {msg.attachments?.length > 0 && (
                          <div className="mt-2 flex space-x-2">
                            {msg.attachments.map((att, i) => (
                              <img
                                key={i}
                                src={att}
                                alt="attachment"
                                className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-75"
                                onClick={() => window.open(att, '_blank')}
                              />
                            ))}
                          </div>
                        )}
                        <span className={`text-xs mt-2 block ${
                          msg.sender === user?._id ? 'text-primary-light' : 'text-gray-500'
                        }`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {artisanTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={chatEndRef} />
                </div>

                {/* Upload Preview */}
                {uploadedFiles.length > 0 && (
                  <div className="px-4 py-2 bg-gray-100 border-t flex space-x-2 overflow-x-auto">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="relative flex-shrink-0">
                        <img
                          src={file.url}
                          alt="preview"
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Chat Input */}
                <div className="p-4 border-t bg-white">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="p-3 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                      title="Attach images"
                    >
                      <FiPaperclip className="h-5 w-5" />
                    </button>
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!chatMessage.trim() && uploadedFiles.length === 0}
                      className="p-3 bg-primary text-white rounded-xl hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiSend className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Quick Replies */}
                  <div className="flex mt-3 space-x-2 overflow-x-auto pb-1">
                    {[
                      'What\'s the estimated price?',
                      'Can you do it by next week?',
                      'I\'d like to see more samples',
                      'Is this design possible?',
                      'What materials do you recommend?'
                    ].map((reply, index) => (
                      <button
                        key={index}
                        onClick={() => setChatMessage(reply)}
                        className="px-3 py-1.5 bg-gray-100 rounded-full text-xs whitespace-nowrap hover:bg-gray-200 transition-colors"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quote Actions (if quote received) */}
                {activeRequest && (
                  <div className="p-4 border-t bg-green-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Quote Received: Rs{price}
                        </p>
                        <p className="text-xs text-green-600">
                          Estimated delivery: 7-10 days
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleQuoteDecline}
                          className="px-4 py-2 border-2 border-red-500 text-red-500 rounded-xl hover:bg-red-50 text-sm font-medium"
                        >
                          Decline
                        </button>
                        <button
                          onClick={handleQuoteAccept}
                          className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 text-sm font-medium"
                        >
                          Accept Quote
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto space-y-6"
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiCheck className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                    Customization Ready!
                  </h3>
                  <p className="text-gray-600">
                    Your custom design has been confirmed. Review the details below.
                  </p>
                </div>

                {/* Order Summary Card */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-primary/20 overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-primary-dark px-6 py-4">
                    <h4 className="text-white font-semibold">Custom Order Summary</h4>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {/* Product Info */}
                    <div className="flex items-center space-x-4 pb-4 border-b">
                      <img
                        src={product.images?.[0]?.url}
                        alt={product.name}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                      <div>
                        <h5 className="font-semibold text-gray-900">{product.name}</h5>
                        <p className="text-sm text-gray-600">by {product.artisan?.name}</p>
                      </div>
                    </div>

                    {/* Customization Details */}
                    <div className="space-y-3">
                      <h6 className="font-medium text-gray-900">Customization Details:</h6>
                      {Object.entries(selectedOptions).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600">{key}:</span>
                          <span className="font-medium text-gray-900">{value}</span>
                        </div>
                      ))}
                      {customization.dimensions.width && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Dimensions:</span>
                          <span className="font-medium text-gray-900">
                            {customization.dimensions.width} x {customization.dimensions.height} x {customization.dimensions.depth} cm
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-medium text-gray-900">{customization.quantity}</span>
                      </div>
                      {customization.deadline && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Deadline:</span>
                          <span className="font-medium text-gray-900">
                            {new Date(customization.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Price Breakdown */}
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Base Price:</span>
                        <span>Rs{product.price}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Customization:</span>
                        <span className="text-green-600">+Rs{price - (product.price * customization.quantity)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total:</span>
                        <span className="text-primary">Rs{price}</span>
                      </div>
                    </div>

                    {/* Reference Images */}
                    {customization.referenceImages.length > 0 && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium text-gray-700 mb-3">Reference Images:</p>
                        <div className="flex space-x-2">
                          {customization.referenceImages.map((img, index) => (
                            <img
                              key={index}
                              src={img.url}
                              alt={`ref-${index}`}
                              className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-75"
                              onClick={() => window.open(img.url, '_blank')}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Artisan Notes */}
                    {customization.notes && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Your Notes:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          {customization.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium flex items-center justify-center space-x-2"
                  >
                    <FiMessageCircle className="h-5 w-5" />
                    <span>Back to Chat</span>
                  </button>
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark font-medium flex items-center justify-center space-x-2"
                  >
                    <FiShoppingCart className="h-5 w-5" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Bottom Bar */}
          <div className="border-t p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Estimated Total</p>
                <p className="text-2xl font-bold text-primary">Rs{price.toLocaleString()}</p>
              </div>
              <div className="flex space-x-3">
                {step === 1 && (
                  <>
                    <button
                      onClick={onClose}
                      className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendCustomizationRequest}
                      className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark font-medium flex items-center space-x-2"
                    >
                      <FiMessageCircle className="h-5 w-5" />
                      <span>Send to Artisan</span>
                    </button>
                  </>
                )}
                {step === 2 && (
                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark font-medium"
                  >
                    Continue to Review
                  </button>
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