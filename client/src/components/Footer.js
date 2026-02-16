// components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiFacebook, 
  FiInstagram, 
  FiTwitter,
  FiArrowRight 
} from 'react-icons/fi';
import { motion } from 'framer-motion';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 to-gray-950 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary rounded-full filter blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pt-20 pb-12">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="flex items-center space-x-3">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dark rounded-xl rotate-6"></div>
                  <div className="absolute inset-0 bg-white rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">MC</span>
                  </div>
                </div>
                <span className="text-2xl font-serif font-bold">MadioCraft</span>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-md">
                Bridging the gap between traditional artisans and modern buyers, 
                preserving centuries-old crafts for future generations.
              </p>
            </motion.div>

            {/* Social Links */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex space-x-4"
            >
              {[
                { icon: <FiFacebook />, href: '#', label: 'Facebook' },
                { icon: <FiInstagram />, href: '#', label: 'Instagram' },
                { icon: <FiTwitter />, href: '#', label: 'Twitter' },
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  whileHover={{ y: -3, scale: 1.1 }}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-gradient-to-r hover:from-primary hover:to-primary-dark transition-all duration-300"
                  aria-label={social.label}
                >
                  {social.icon}
                </motion.a>
              ))}
            </motion.div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
              <ul className="space-y-4">
                {['About Us', 'Products', 'Artisans', 'Categories'].map((item, index) => (
                  <li key={index}>
                    <Link 
                      to={`/${item.toLowerCase().replace(' ', '')}`}
                      className="text-gray-400 hover:text-white flex items-center space-x-2 group"
                    >
                      <FiArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      <span>{item}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Support */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h3 className="text-lg font-semibold mb-6">Support</h3>
              <ul className="space-y-4">
                {['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service'].map((item, index) => (
                  <li key={index}>
                    <Link 
                      to={`/${item.toLowerCase().replace(' ', '-')}`}
                      className="text-gray-400 hover:text-white flex items-center space-x-2 group"
                    >
                      <FiArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      <span>{item}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h3 className="text-lg font-semibold mb-6">Get in Touch</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-4 group">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <FiMail className="h-5 w-5 text-primary-light" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <a href="mailto:support@madiocraft.com" className="hover:text-primary-light transition-colors">
                      support@madiocraft.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 group">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <FiPhone className="h-5 w-5 text-primary-light" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Phone</p>
                    <a href="tel:+919876543210" className="hover:text-primary-light transition-colors">
                      +94 98765 43210
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 group">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <FiMapPin className="h-5 w-5 text-primary-light" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Address</p>
                    <p className="hover:text-primary-light transition-colors">
                      Batticaloa, SriLanka
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="border-t border-white/10 pt-12 pb-8"
        >
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl font-serif font-semibold mb-3">
              Join the Artisan Community
            </h3>
            <p className="text-gray-400 mb-6">
              Subscribe to receive updates about new artisans, exclusive collections, and craft stories.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button className="px-8 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all">
                Subscribe
              </button>
            </form>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 py-8 mt-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">
              © {currentYear} MadioCraft. All rights reserved. 
              <span className="mx-2">•</span>
              Crafted with ❤️ for artisans
            </p>
            <div className="flex space-x-6 text-sm text-gray-400">
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link to="/cookies" className="hover:text-white transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;