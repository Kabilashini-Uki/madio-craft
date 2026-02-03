import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTwitter, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-primary-dark to-primary text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h2 className="text-2xl font-serif font-bold mb-4">MadioCraft</h2>
            <p className="text-white/80 mb-4">
              Bringing artisans and buyers together. Discover unique handmade treasures.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-primary-light">
                <FaFacebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-white hover:text-primary-light">
                <FaInstagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-white hover:text-primary-light">
                <FaTwitter className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/products" className="text-white/80 hover:text-white">Products</Link></li>
              <li><Link to="/artisans" className="text-white/80 hover:text-white">Artisans</Link></li>
              <li><Link to="/categories" className="text-white/80 hover:text-white">Categories</Link></li>
              <li><Link to="/about" className="text-white/80 hover:text-white">About Us</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link to="/help" className="text-white/80 hover:text-white">Help Center</Link></li>
              <li><Link to="/contact" className="text-white/80 hover:text-white">Contact Us</Link></li>
              <li><Link to="/privacy" className="text-white/80 hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-white/80 hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <FaEnvelope className="h-5 w-5" />
                <span className="text-white/80">support@madiocraft.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <FaPhone className="h-5 w-5" />
                <span className="text-white/80">+91 98765 43210</span>
              </li>
              <li className="flex items-center space-x-2">
                <FaMapMarkerAlt className="h-5 w-5" />
                <span className="text-white/80">Mumbai, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/60">
          <p>&copy; {new Date().getFullYear()} MadioCraft. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;