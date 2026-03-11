// src/components/ProductCustomizationModal.js
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSend, FiCheck, FiLoader } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

/* ─── Config ──────────────────────────────────────────────────────── */
const COLORS = [
  { name: 'Natural Brown',  hex: '#8B4513' },
  { name: 'Ivory White',    hex: '#FFFFF0', dark: true },
  { name: 'Midnight Black', hex: '#1a1a1a' },
  { name: 'Ruby Red',       hex: '#9B2335' },
  { name: 'Ocean Blue',     hex: '#1E6B8C' },
  { name: 'Forest Green',   hex: '#2D6A4F' },
  { name: 'Golden Yellow',  hex: '#D4AF37' },
  { name: 'Rose Pink',      hex: '#E8A0BF', dark: true },
  { name: 'Deep Purple',    hex: '#6B3FA0' },
  { name: 'Terracotta',     hex: '#CB6D51' },
  { name: 'Teal',           hex: '#008080' },
  { name: 'Cream',          hex: '#FFFDD0', dark: true },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'];

/* ─── Step indicator ──────────────────────────────────────────────── */
const StepDot = ({ n, active, done }) => (
  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
    done   ? 'bg-violet-600 text-white' :
    active ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-400' :
             'bg-gray-100 text-gray-400'
  }`}>
    {done ? <FiCheck className="h-3.5 w-3.5" /> : n}
  </div>
);

const ProductCustomizationModal = ({ product, onClose }) => {
  const { user }   = useAuth();

  // Effective role: respects buyer-mode switching
  const effectiveRole = user?.activeRole || user?.role;
  const canSendRequest = effectiveRole === 'buyer' || effectiveRole === 'admin' || !user;
  const isOwnProduct = user && (
    String(user.id || user._id) === String(product.artisan?._id || product.artisan)
  );

  const [color,   setColor]   = useState(null);
  const [size,    setSize]    = useState('');
  const [notes,   setNotes]   = useState('');
  const [step,    setStep]    = useState(1);   // 1=colour  2=size  3=notes+review
  const [status,  setStatus]  = useState('idle'); // idle | sending | sent

  const hasColor  = Boolean(color);
  const hasSize   = Boolean(size);
  const hasNotes  = notes.trim().length > 0;
  const hasAny    = hasColor || hasSize || hasNotes;

  /* ─── Submit ──────────────────────────────────────────────────── */
  const handleSend = useCallback(async () => {
    if (!user) { toast.error('Please login to send customisation requests'); return; }
    if (isOwnProduct) { toast.error("You can't customise your own product", { icon: '🚫' }); onClose(); return; }
    if (!canSendRequest) { toast.error('Switch to buyer mode to send customisation requests'); onClose(); return; }
    if (!hasAny) { toast.error('Pick at least one option — colour, size, or notes'); return; }
    setStatus('sending');

    try {
      // Notify artisan via product endpoint → emits socket 'customization-request' popup
      await api.post(`/products/${product._id}/customization-request`, {
        color: color?.name || '',
        size,
        notes: notes.trim(),
      });

      setStatus('sent');
      toast.success('Request sent! Artisan has been notified.');

      setTimeout(() => {
        onClose();
      }, 1000);

    } catch {
      setStatus('idle');
      toast.error('Failed to send. Try again.');
    }
  }, [hasAny, color, size, notes, product, onClose]);

  const imgSrc = product.images?.[0]?.url;
  const artisanName = product.artisan?.name || 'the artisan';

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        {/* Panel */}
        <motion.div
          key="panel"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: '92vh' }}
        >

          {/* ── Header ───────────────────────────────────────────── */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-bold text-lg leading-tight">Customise Product</h2>
                <p className="text-violet-200 text-xs mt-0.5 truncate">{product.name}</p>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center ml-3 flex-shrink-0 transition-colors">
                <FiX className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Product preview strip */}
            <div className="flex items-center gap-3 mt-4 bg-white/15 rounded-2xl p-3">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                {imgSrc
                  ? <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-white/20 flex items-center justify-center text-2xl">🎨</div>
                }
                {/* Live colour overlay */}
                <AnimatePresence>
                  {color && (
                    <motion.div
                      key={color.hex}
                      initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 mix-blend-multiply"
                      style={{ backgroundColor: color.hex }}
                    />
                  )}
                </AnimatePresence>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{product.name}</p>
                <p className="text-violet-200 text-xs capitalize">{product.category}</p>
                {/* Live selection preview */}
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {color && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90"
                      style={{ color: color.dark ? '#374151' : color.hex }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: color.hex }} />
                      {color.name}
                    </span>
                  )}
                  {size && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 text-violet-700">
                      {size}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-2 mt-4">
              {[1, 2, 3].map(n => (
                <React.Fragment key={n}>
                  <StepDot n={n} active={step === n} done={step > n} />
                  {n < 3 && <div className={`flex-1 h-0.5 rounded-full transition-colors ${step > n ? 'bg-violet-400' : 'bg-white/20'}`} />}
                </React.Fragment>
              ))}
              <span className="text-violet-200 text-xs ml-2">
                {step === 1 ? 'Colour' : step === 2 ? 'Size' : 'Review'}
              </span>
            </div>
          </div>

          {/* ── Body ─────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">

              {/* Step 1 — Colour ─────────────────────────────────── */}
              {step === 1 && (
                <motion.div key="step1"
                  initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Choose a Colour</h3>
                    {color && (
                      <button onClick={() => setColor(null)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-6 gap-3">
                    {COLORS.map(c => (
                      <motion.button
                        key={c.name}
                        whileTap={{ scale: 0.85 }}
                        whileHover={{ scale: 1.12 }}
                        onClick={() => setColor(prev => prev?.name === c.name ? null : c)}
                        title={c.name}
                        className={`relative w-11 h-11 rounded-full border-3 shadow-sm transition-all ${
                          color?.name === c.name
                            ? 'border-violet-500 ring-4 ring-violet-200 scale-110'
                            : 'border-gray-200 hover:border-violet-300'
                        }`}
                        style={{ backgroundColor: c.hex, borderWidth: color?.name === c.name ? 3 : 2 }}
                      >
                        {color?.name === c.name && (
                          <FiCheck className="absolute inset-0 m-auto h-4 w-4 drop-shadow"
                            style={{ color: c.dark ? '#4b5563' : '#fff' }} />
                        )}
                      </motion.button>
                    ))}
                  </div>
                  {color && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-sm text-violet-700 font-medium mt-3 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color.hex }} />
                      {color.name} selected
                    </motion.p>
                  )}
                </motion.div>
              )}

              {/* Step 2 — Size ───────────────────────────────────── */}
              {step === 2 && (
                <motion.div key="step2"
                  initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Choose a Size</h3>
                    {size && (
                      <button onClick={() => setSize('')} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {SIZES.map(s => (
                      <motion.button
                        key={s}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setSize(prev => prev === s ? '' : s)}
                        className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                          size === s
                            ? 'border-violet-500 bg-violet-500 text-white shadow-md scale-105'
                            : 'border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700'
                        }`}
                      >
                        {s}
                      </motion.button>
                    ))}
                  </div>
                  {size && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-sm text-violet-700 font-medium mt-3">
                      Size <span className="font-bold">{size}</span> selected
                    </motion.p>
                  )}

                  {/* Size guide hint */}
                  <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                    Not sure about size? Select <strong>Custom</strong> and describe your dimensions in the notes.
                  </p>
                </motion.div>
              )}

              {/* Step 3 — Notes + Review ────────────────────────── */}
              {step === 3 && (
                <motion.div key="step3"
                  initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 space-y-5"
                >
                  {/* Review summary */}
                  <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100">
                    <p className="text-xs font-bold text-violet-700 uppercase tracking-wider mb-3">Your Request</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Product</span>
                        <span className="font-semibold text-gray-800 text-right max-w-[60%] truncate">{product.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Colour</span>
                        <span className={`font-semibold ${color ? 'text-gray-800' : 'text-gray-300'}`}>
                          {color ? (
                            <span className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-full border border-gray-200" style={{ background: color.hex }} />
                              {color.name}
                            </span>
                          ) : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Size</span>
                        <span className={`font-semibold ${size ? 'text-gray-800' : 'text-gray-300'}`}>{size || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      Special Notes
                      <span className="text-gray-400 font-normal text-sm ml-1">(optional)</span>
                    </h3>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={4}
                      placeholder={`Tell ${artisanName} about specific patterns, measurements, inscriptions, deadline or any special requirements…`}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-violet-400 outline-none resize-none text-sm transition-colors"
                    />
                    <p className="text-xs text-gray-400 mt-1">{notes.length}/300 characters</p>
                  </div>

                  {/* Artisan info */}
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      <img
                        src={product.artisan?.avatar?.url || `https://ui-avatars.com/api/?name=${artisanName}&background=8B4513&color=fff&size=40`}
                        alt={artisanName} className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{artisanName}</p>
                      <p className="text-xs text-gray-500">Will be notified instantly via popup</p>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* ── Footer navigation ─────────────────────────────────── */}
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-white">
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                ← Back
              </button>
            ) : (
              <button onClick={onClose}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            )}

            {step < 3 ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep(s => s + 1)}
                className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Next →
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSend}
                disabled={status !== 'idle' || !hasAny || isOwnProduct || !canSendRequest}
                className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  status === 'sent'
                    ? 'bg-green-500 text-white'
                    : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-lg disabled:opacity-50'
                }`}
              >
                {status === 'sent' ? (
                  <><FiCheck className="h-4 w-4" /> Sent!</>
                ) : status === 'sending' ? (
                  <><FiLoader className="h-4 w-4 animate-spin" /> Sending…</>
                ) : (
                  <><FiSend className="h-4 w-4" /> Send Request</>
                )}
              </motion.button>
            )}
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductCustomizationModal;