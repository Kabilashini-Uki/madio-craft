// components/ProductCustomization.js
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSend, FiCheck, FiAlertCircle, FiClock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const ProductCustomization = ({ product, isOpen, onClose }) => {
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [customization, setCustomization] = useState({ color: '', size: '', notes: '' });
  const [sendingRequest, setSendingRequest] = useState(false);

  const handleSendCustomizationRequest = async () => {
    if (!user) { toast.error('Please login to send a customization request'); return; }
    setSendingRequest(true);
    try {
      const res = await api.post(`/products/${product._id}/customization-request`, {
        color: customization.color,
        size:  customization.size,
        notes: customization.notes,
      });
      if (res.data.success) {
        setStep(2);
        toast.success('✅ Request sent! The artisan will be notified shortly.');
      } else {
        toast.error(res.data.message || 'Failed to send request');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to send request. Please try again.');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setCustomization({ color: '', size: '', notes: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', duration: 0.4 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                <img src={product.images?.[0]?.url || 'https://via.placeholder.com/100'} alt={product.name}
                  className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold text-gray-900">Request Customization</h2>
                <p className="text-sm text-gray-500">{product.name}</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <FiX className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Step 1: Customize Form */}
          {step === 1 && (
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Tell the artisan what you need. They'll review your request and get back to you with availability and pricing.</p>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Color Preference</label>
                <input type="text" value={customization.color}
                  onChange={e => setCustomization(p => ({ ...p, color: e.target.value }))}
                  placeholder="e.g. Deep red, Navy blue, Gold"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Size / Dimensions</label>
                <input type="text" value={customization.size}
                  onChange={e => setCustomization(p => ({ ...p, size: e.target.value }))}
                  placeholder="e.g. Small, 30×40cm, Large"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description / Notes <span className="text-red-500">*</span></label>
                <textarea value={customization.notes}
                  onChange={e => setCustomization(p => ({ ...p, notes: e.target.value }))}
                  rows={4} placeholder="Describe your customization request in detail — design, patterns, engravings, special requirements..."
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleClose}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSendCustomizationRequest}
                  disabled={sendingRequest || !customization.notes.trim()}
                  className="flex-2 flex-[2] py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {sendingRequest
                    ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /><span>Sending...</span></>
                    : <><FiSend className="h-4 w-4" /><span>Send Request to Artisan</span></>
                  }
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Sent / Waiting */}
          {step === 2 && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiClock className="h-8 w-8 text-amber-600 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h3>
              <p className="text-gray-600 text-sm mb-6">
                Your customization request has been sent to <strong>{product.artisan?.name || 'the artisan'}</strong>.
                You'll receive a notification when they respond with pricing and availability.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left mb-6 space-y-2">
                {customization.color && (
                  <p className="text-sm text-gray-700"><span className="font-semibold">🎨 Color:</span> {customization.color}</p>
                )}
                {customization.size && (
                  <p className="text-sm text-gray-700"><span className="font-semibold">📐 Size:</span> {customization.size}</p>
                )}
                {customization.notes && (
                  <p className="text-sm text-gray-700"><span className="font-semibold">📝 Notes:</span> {customization.notes}</p>
                )}
              </div>
              <button onClick={handleClose}
                className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors">
                Close
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProductCustomization;
