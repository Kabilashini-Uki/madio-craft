// pages/Register.js
import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiUser, FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff,
  FiBriefcase, FiShoppingBag, FiArrowLeft, FiAlertCircle,
  FiCheckCircle, FiMapPin,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const BATTICALOA_LOCATIONS = [
  'Batticaloa', 'Eravur', 'Marudhamunai', 'Valaichenai', 'Ottamavadi',
  'Kaatankudy', 'Kaluwanchikudy', 'Paddippalai', 'Thiraimadu',
  'Chenkalady', 'Kattankudy',
];

const craftCategories = [
  { id: 'pottery',    name: 'Pottery & Ceramics', icon: '🏺' },
  { id: 'jewelry',    name: 'Jewelry Making',      icon: '💎' },
  { id: 'textiles',   name: 'Textiles & Weaving',  icon: '🧵' },
  { id: 'woodwork',   name: 'Woodworking',          icon: '🪵' },
  { id: 'metalwork',  name: 'Metalwork',            icon: '⚒️' },
  { id: 'glass',      name: 'Glass Art',            icon: '🥂' },
  { id: 'leather',    name: 'Leather Craft',        icon: '👝' },
  { id: 'paper',      name: 'Paper Crafts',         icon: '📜' },
  { id: 'embroidery', name: 'Embroidery',           icon: '🪡' },
  { id: 'carpentry',  name: 'Carpentry',            icon: '🔨' },
  { id: 'sculpture',  name: 'Sculpture',            icon: '🗿' },
  { id: 'other',      name: 'Other Craft',          icon: '🎨' },
];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'buyer', businessName: '', craftCategory: '',
    yearsOfExperience: '', craftDescription: '',
    location: '', specialties: [],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [emailStatus, setEmailStatus] = useState('idle');
  const [locationError, setLocationError] = useState('');
  const emailCheckTimer = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'craftCategory') {
      setFormData(prev => ({
        ...prev, craftCategory: value,
        specialties: value !== 'other' ? [value] : [],
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (name === 'location') {
      setLocationError('');
      if (value) {
        const lower = value.toLowerCase();
        const isBatti = BATTICALOA_LOCATIONS.some(l => lower.includes(l.toLowerCase()));
        if (!isBatti) {
          setLocationError('⚠️ This application is only available for Batticaloa District users.');
        }
      }
    }

    if (name === 'email') {
      setEmailStatus('idle');
      clearTimeout(emailCheckTimer.current);
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setEmailStatus('checking');
        emailCheckTimer.current = setTimeout(async () => {
          try {
            const res = await api.post('/auth/check-email', { email: value });
            setEmailStatus(res.data.exists ? 'taken' : 'available');
          } catch { setEmailStatus('idle'); }
        }, 600);
      }
    }
  };



  const validateStep = () => {
    if (step === 1) {
      if (!formData.name.trim()) { toast.error('Please enter your name'); return false; }
      if (!formData.email.trim()) { toast.error('Please enter your email'); return false; }
      if (emailStatus === 'taken') { toast.error('Email is already taken'); return false; }
      if (formData.password.length < 6) { toast.error('Password must be at least 6 characters'); return false; }
      if (formData.password !== formData.confirmPassword) { toast.error('Passwords do not match'); return false; }
    }
    if (step === 2) {
      if (!formData.role) { toast.error('Please select a role'); return false; }
    }
    if (step === 3 && formData.role === 'artisan') {
      if (!formData.location) { toast.error('Please enter your location'); return false; }
      if (locationError) { toast.error('Please enter a valid Batticaloa location'); return false; }
    }
    return true;
  };

  const nextStep = () => { if (!validateStep()) return; setStep(s => s + 1); };
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    if (locationError) { toast.error('Please choose a valid Batticaloa location'); return; }

    setLoading(true);
    try {
      const { confirmPassword, ...dataToSend } = formData;
      if (dataToSend.yearsOfExperience) dataToSend.yearsOfExperience = parseInt(dataToSend.yearsOfExperience) || 0;

      if (dataToSend.role === 'artisan') {
        dataToSend.artisanProfile = {
          businessName:      dataToSend.businessName,
          description:       dataToSend.craftDescription || '',
          specialties:       dataToSend.specialties.length > 0
            ? dataToSend.specialties
            : (dataToSend.craftCategory ? [dataToSend.craftCategory] : []),
          yearsOfExperience: dataToSend.yearsOfExperience || 0,
        };
        delete dataToSend.businessName;
        delete dataToSend.craftCategory;
        delete dataToSend.yearsOfExperience;
        delete dataToSend.craftDescription;
        delete dataToSend.specialties;
      }

      const result = await register(dataToSend);

      if (result.success) {
        toast.success('Registration successful!');
        if (result.user.role === 'admin') navigate('/admin');
        else if (result.user.role === 'artisan') navigate('/artisan-dashboard');
        else navigate('/');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const emailIndicator = () => {
    if (emailStatus === 'checking')
      return <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />;
    if (emailStatus === 'taken')  return <FiAlertCircle className="h-4 w-4 text-red-500" />;
    if (emailStatus === 'available') return <FiCheckCircle className="h-4 w-4 text-green-500" />;
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-md w-full">
        <button onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-600 hover:text-primary mb-6 transition-colors">
          <FiArrowLeft className="h-5 w-5" /><span>Back to Home</span>
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-xl p-8 md:p-10">

          <div className="text-center mb-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-2xl rotate-6 mx-auto mb-6 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">MC</span>
            </motion.div>
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Join MadioCraft</h2>
            <p className="text-gray-600">Start your journey with Batticaloa's finest artisans</p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${step >= s ? 'bg-gradient-to-r from-primary to-primary-dark text-white' : 'bg-gray-200 text-gray-600'}`}>{s}</div>
                {s < 3 && <div className={`w-12 h-1 mx-2 rounded ${step > s ? 'bg-primary' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>

            {/* ── Step 1: Basic info ─────────────────────────── */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiUser className="h-5 w-5 text-gray-400" /></div>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="John Doe" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiMail className="h-5 w-5 text-gray-400" /></div>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required
                      className={`block w-full pl-10 pr-10 py-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${emailStatus === 'taken' ? 'border-red-400 focus:ring-red-300' : emailStatus === 'available' ? 'border-green-400 focus:ring-green-300' : 'border-gray-300'}`}
                      placeholder="you@example.com" />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{emailIndicator()}</div>
                  </div>
                  {emailStatus === 'taken' && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-600 flex items-center gap-1">
                      <FiAlertCircle className="h-3.5 w-3.5" /> This email is already registered.{' '}
                      <Link to="/login" className="underline font-medium">Sign in instead?</Link>
                    </motion.p>
                  )}
                  {emailStatus === 'available' && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-green-600 flex items-center gap-1">
                      <FiCheckCircle className="h-3.5 w-3.5" /> Email is available
                    </motion.p>
                  )}
                </div>

                <button type="button" onClick={nextStep}
                  className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-xl text-white bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg transform hover:-translate-y-0.5 transition-all">
                  <span>Continue</span><FiArrowRight className="h-5 w-5" />
                </button>
              </motion.div>
            )}

            {/* ── Step 2: Account type & artisan info ─────────── */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">I want to...</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => { setFormData(f => ({ ...f, role: 'buyer' })); nextStep(); }}
                      className={`p-6 border-2 rounded-xl text-center transition-all ${formData.role === 'buyer' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/30'}`}>
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3"><FiShoppingBag className="h-6 w-6 text-primary" /></div>
                      <h3 className="font-semibold text-gray-900 mb-1">Buy Products</h3>
                      <p className="text-xs text-gray-500">Discover and purchase unique handmade items</p>
                    </button>
                    <button type="button" onClick={() => setFormData(f => ({ ...f, role: 'artisan' }))}
                      className={`p-6 border-2 rounded-xl text-center transition-all ${formData.role === 'artisan' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/30'}`}>
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3"><FiBriefcase className="h-6 w-6 text-primary" /></div>
                      <h3 className="font-semibold text-gray-900 mb-1">Sell as Artisan</h3>
                      <p className="text-xs text-gray-500">Showcase and sell your creations</p>
                    </button>
                  </div>
                </div>

                {formData.role === 'artisan' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Business Name *</label>
                      <input type="text" name="businessName" value={formData.businessName} onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Your Craft Studio" required={formData.role === 'artisan'} />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Craft Category *</label>
                      <select name="craftCategory" value={formData.craftCategory} onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                        required={formData.role === 'artisan'}>
                        <option value="">Select a category</option>
                        {craftCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Location * (Batticaloa District only)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiMapPin className="h-4 w-4 text-gray-400" /></div>
                        <select name="location" value={formData.location} onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                          required={formData.role === 'artisan'}>
                          <option value="">Select your location</option>
                          {BATTICALOA_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                      <input type="number" name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="5" min="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Tell us about your craft</label>
                      <textarea name="craftDescription" value={formData.craftDescription} onChange={handleChange} rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        placeholder="Describe your techniques, materials, and inspiration..." />
                    </div>
                  </motion.div>
                )}

                <div className="flex space-x-4">
                  <button type="button" onClick={prevStep}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">Back</button>
                  <button type="button" onClick={nextStep}
                    className="flex-1 py-3 px-4 border border-transparent rounded-xl text-white bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg transition-all disabled:opacity-40"
                    disabled={formData.role === 'artisan' && (!formData.businessName || !formData.craftCategory || !formData.location)}>
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Password ─────────────────────────────── */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">

                {/* Optional location for buyers */}
                {formData.role === 'buyer' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Your Location (optional)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiMapPin className="h-4 w-4 text-gray-400" /></div>
                      <select name="location" value={formData.location} onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-white">
                        <option value="">Select location (Batticaloa District only)</option>
                        {BATTICALOA_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    {locationError && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <FiAlertCircle className="h-3.5 w-3.5" /> {locationError}
                      </p>
                    )}
                    <p className="text-xs text-amber-600">⚠️ This app is exclusively for Batticaloa District users.</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiLock className="h-5 w-5 text-gray-400" /></div>
                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                      required minLength="6"
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {showPassword ? <FiEyeOff className="h-5 w-5 text-gray-400" /> : <FiEye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiLock className="h-5 w-5 text-gray-400" /></div>
                    <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                      required minLength="6"
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="••••••••" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {showConfirmPassword ? <FiEyeOff className="h-5 w-5 text-gray-400" /> : <FiEye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button type="button" onClick={prevStep}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">Back</button>
                  <button type="submit" disabled={loading}
                    className="flex-1 py-3 px-4 border border-transparent rounded-xl text-white bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              </motion.div>
            )}
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:text-primary-dark">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
