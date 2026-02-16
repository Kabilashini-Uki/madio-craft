// pages/Register.js (Updated artisan section)
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiUser, FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff,
  FiBriefcase, FiShoppingBag, FiTag, FiCheck, FiPlus
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer',
    // Artisan specific fields
    businessName: '',
    craftCategory: '',
    otherCraft: '',
    yearsOfExperience: '',
    craftDescription: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  // Craft categories for artisans
  const craftCategories = [
    { id: 'pottery', name: 'Pottery & Ceramics', icon: '🏺' },
    { id: 'jewelry', name: 'Jewelry Making', icon: '💎' },
    { id: 'textiles', name: 'Textiles & Weaving', icon: '🧵' },
    { id: 'woodwork', name: 'Woodworking', icon: '🪵' },
    { id: 'metalwork', name: 'Metalwork', icon: '⚒️' },
    { id: 'glass', name: 'Glass Art', icon: '🥂' },
    { id: 'leather', name: 'Leather Craft', icon: '👝' },
    { id: 'paper', name: 'Paper Crafts', icon: '📜' },
    { id: 'embroidery', name: 'Embroidery', icon: '🪡' },
    { id: 'carpentry', name: 'Carpentry', icon: '🔨' },
    { id: 'sculpture', name: 'Sculpture', icon: '🗿' },
    { id: 'other', name: 'Other Craft', icon: '🎨' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Validate artisan specific fields
    if (formData.role === 'artisan') {
      if (!formData.businessName) {
        toast.error('Please enter your business name');
        return;
      }
      if (!formData.craftCategory) {
        toast.error('Please select your craft category');
        return;
      }
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      
      // Prepare artisan profile data
      if (formData.role === 'artisan') {
        registerData.artisanProfile = {
          businessName: formData.businessName,
          specialties: [formData.craftCategory === 'other' ? formData.otherCraft : formData.craftCategory],
          yearsOfExperience: parseInt(formData.yearsOfExperience) || 0,
          description: formData.craftDescription
        };
      }

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, registerData);
      
      if (response.data.success) {
        toast.success('Account created successfully! Please login.');
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name) {
        toast.error('Please enter your name');
        return;
      }
      if (!formData.email) {
        toast.error('Please enter your email');
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-xl p-8 md:p-10"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-2xl rotate-6 mx-auto mb-6 flex items-center justify-center"
            >
              <span className="text-3xl font-bold text-white">MC</span>
            </motion.div>
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">
              Join MadioCraft
            </h2>
            <p className="text-gray-600">
              Start your journey with Sri Lanka's finest artisans
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  step >= s 
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`w-12 h-1 mx-2 rounded ${
                    step > s ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-xl text-white bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                >
                  <span>Continue</span>
                  <FiArrowRight className="h-5 w-5" />
                </button>
              </motion.div>
            )}

            {/* Step 2: Account Type */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    I want to...
                  </label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({...formData, role: 'buyer'});
                        setStep(3);
                      }}
                      className={`p-6 border-2 rounded-xl text-center transition-all ${
                        formData.role === 'buyer'
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-primary/30'
                      }`}
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FiShoppingBag className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Buy Products</h3>
                      <p className="text-xs text-gray-500">
                        Discover and purchase unique handmade items
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormData({...formData, role: 'artisan'});
                      }}
                      className={`p-6 border-2 rounded-xl text-center transition-all ${
                        formData.role === 'artisan'
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-primary/30'
                      }`}
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FiBriefcase className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Sell as Artisan</h3>
                      <p className="text-xs text-gray-500">
                        Showcase and sell your creations
                      </p>
                    </button>
                  </div>
                </div>

                {formData.role === 'artisan' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-4 border-t"
                  >
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Business Name
                      </label>
                      <input
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Your Craft Studio"
                        required={formData.role === 'artisan'}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Craft Category
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
                        {craftCategories.map((craft) => (
                          <button
                            key={craft.id}
                            type="button"
                            onClick={() => setFormData({
                              ...formData, 
                              craftCategory: craft.id,
                              otherCraft: craft.id === 'other' ? formData.otherCraft : ''
                            })}
                            className={`p-3 border rounded-lg text-left transition-all ${
                              formData.craftCategory === craft.id
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-gray-200 hover:border-primary/30'
                            }`}
                          >
                            <span className="text-2xl mb-1 block">{craft.icon}</span>
                            <span className="text-xs font-medium">{craft.name}</span>
                            {formData.craftCategory === craft.id && (
                              <FiCheck className="absolute top-2 right-2 text-primary h-4 w-4" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {formData.craftCategory === 'other' && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Specify Your Craft
                        </label>
                        <input
                          type="text"
                          name="otherCraft"
                          value={formData.otherCraft}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                          placeholder="e.g., Basketry, Calligraphy"
                          required
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        name="yearsOfExperience"
                        value={formData.yearsOfExperience}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                        placeholder="5"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Tell us about your craft
                      </label>
                      <textarea
                        name="craftDescription"
                        value={formData.craftDescription}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none"
                        placeholder="Describe your techniques, materials, and inspiration..."
                      />
                    </div>
                  </motion.div>
                )}

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 py-3 px-4 border border-transparent rounded-xl text-white bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg transition-all"
                    disabled={formData.role === 'artisan' && (!formData.businessName || !formData.craftCategory)}
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Password */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? <FiEyeOff className="h-5 w-5 text-gray-400" /> : <FiEye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? <FiEyeOff className="h-5 w-5 text-gray-400" /> : <FiEye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 border border-transparent rounded-xl text-white bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </motion.div>
            )}
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;