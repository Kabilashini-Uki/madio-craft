import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTool, FiSend } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const COLORS = [
  { name: 'Natural Brown', hex: '#8B4513' },
  { name: 'Ivory White', hex: '#FFFFF0' },
  { name: 'Midnight Black', hex: '#1a1a1a' },
  { name: 'Ruby Red', hex: '#9B2335' },
  { name: 'Ocean Blue', hex: '#1E6B8C' },
  { name: 'Forest Green', hex: '#2D6A4F' },
  { name: 'Golden Yellow', hex: '#D4AF37' },
  { name: 'Rose Pink', hex: '#E8A0BF' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'];

const ProductCustomizationModal = ({ product, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendRequest = async () => {
    if (!selectedColor && !selectedSize && !description.trim()) {
      toast.error('Please add at least one customization detail');
      return;
    }
    setSending(true);
    try {
      // Send customization request notification to artisan via API
      await api.post(`/products/${product._id}/customization-request`, {
        color: selectedColor,
        size: selectedSize,
        notes: description,
      });

      const message = `
Customization Request for: ${product.name}
${selectedColor ? `Color: ${selectedColor}` : ''}
${selectedSize ? `Size: ${selectedSize}` : ''}
${description ? `Additional Details: ${description}` : ''}
      `.trim();

      // Also try to create a chat room for follow-up
      try {
        const res = await api.post('/chat/rooms', {
          artisanId: product.artisan?._id,
          productId: product._id,
          type: 'customization',
          initialMessage: message
        });
        toast.success('Customization request sent! The artisan will be notified.');
        onClose();
        if (res.data?.room?._id || res.data?._id) {
          navigate(`/chat/${res.data?.room?._id || res.data?._id}`);
        }
      } catch {
        toast.success('Customization request sent! The artisan will be notified.');
        onClose();
      }
    } catch (error) {
      toast.success('Customization request noted! The artisan will contact you.');
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <FiTool className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Customize Product</h2>
                <p className="text-sm text-gray-500">{product.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <FiX className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Product Preview */}
          <div className="p-6 flex items-start gap-4 bg-gray-50 mx-4 mt-4 rounded-2xl">
            <img
              src={product.images?.[0]?.url || 'https://via.placeholder.com/80'}
              alt={product.name}
              className="w-16 h-16 object-cover rounded-xl"
            />
            <div>
              <p className="font-semibold text-gray-900">{product.name}</p>
              <p className="text-sm text-gray-500 capitalize">{product.category}</p>
              <p className="text-primary font-bold">Rs. {product.price}</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Color Selection */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Choose Color</h3>
              <div className="grid grid-cols-4 gap-3">
                {COLORS.map(color => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(selectedColor === color.name ? '' : color.name)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                      selectedColor === color.name ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full border border-gray-200 shadow-sm"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-[10px] text-gray-600 text-center leading-tight">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Choose Size</h3>
              <div className="flex flex-wrap gap-2">
                {SIZES.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                    className={`px-4 py-2 rounded-xl border-2 font-medium text-sm transition-all ${
                      selectedSize === size
                        ? 'border-purple-500 bg-purple-500 text-white'
                        : 'border-gray-200 text-gray-700 hover:border-purple-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Describe Your Requirements</h3>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe any specific details, patterns, inscriptions, or special requirements you'd like..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none resize-none text-sm"
              />
            </div>

            {/* Summary */}
            {(selectedColor || selectedSize || description) && (
              <div className="bg-purple-50 rounded-xl p-4">
                <h4 className="font-semibold text-purple-800 mb-2 text-sm">Your Customization:</h4>
                {selectedColor && <p className="text-sm text-purple-700">🎨 Color: {selectedColor}</p>}
                {selectedSize && <p className="text-sm text-purple-700">📐 Size: {selectedSize}</p>}
                {description && <p className="text-sm text-purple-700 mt-1">📝 {description.slice(0, 80)}{description.length > 80 ? '...' : ''}</p>}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button onClick={onClose}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSendRequest} disabled={sending}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-60">
                {sending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <><FiSend className="h-4 w-4" /> Send Request</>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductCustomizationModal;
