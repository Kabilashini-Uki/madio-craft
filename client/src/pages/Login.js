// pages/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff, FiArrowLeft, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lockInfo, setLockInfo] = useState(null); // { lockedUntil, minutesLeft }
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (lockInfo) setLockInfo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) { toast.error('Please enter your email'); return; }
    if (!formData.password.trim()) { toast.error('Please enter your password'); return; }

    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        if (result.user.role === 'admin') navigate('/admin');
        else if (result.user.role === 'artisan') navigate('/artisan-dashboard');
        else navigate('/');
      } else {
        // Check if the error is a lockout
        if (result.locked) {
          const now   = new Date();
          const until = new Date(result.lockedUntil);
          const mins  = Math.ceil((until - now) / 60000);
          setLockInfo({ lockedUntil: until, minutesLeft: mins });
        }
      }
    } catch (error) {
      console.error('Unexpected login error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Remaining-time countdown display
  const lockMinutes = lockInfo
    ? Math.max(0, Math.ceil((new Date(lockInfo.lockedUntil) - Date.now()) / 60000))
    : 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
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
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to continue your journey with MadioCraft</p>
          </div>

          {/* Lock warning */}
          {lockInfo && lockMinutes > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <FiClock className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-700">Account temporarily locked</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Too many failed attempts. Please wait <strong>{lockMinutes} minute{lockMinutes !== 1 ? 's' : ''}</strong> before trying again.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="you@example.com" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {showPassword
                    ? <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    : <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || (lockInfo && lockMinutes > 0)}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-white bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg transform hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                {lockInfo && lockMinutes > 0
                  ? <FiClock className="h-5 w-5 text-primary-light" />
                  : <FiArrowRight className="h-5 w-5 text-primary-light group-hover:translate-x-1 transition-transform" />
                }
              </span>
              {loading ? 'Signing in...' : lockInfo && lockMinutes > 0 ? `Locked — wait ${lockMinutes} min` : 'Sign in'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-500">New to MadioCraft?</span></div>
          </div>

          <div className="text-center">
            <Link to="/register" className="inline-flex items-center space-x-2 text-primary hover:text-primary-dark font-medium">
              <span>Create an account</span><FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
