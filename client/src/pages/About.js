import React from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiUsers, FiShoppingBag, FiAward, FiShield, FiMessageCircle } from 'react-icons/fi';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">
                About MadioCraft
              </p>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4 leading-tight">
                Handcrafted stories from Batticaloa to your home.
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed mb-4">
                MadioCraft is a digital marketplace that connects buyers with independent artisans
                from Batticaloa district and across Sri Lanka. Every product carries the colours,
                textures, and stories of the East Coast.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                We focus on a safe, simple experience: browse freely, chat securely with artisans,
                and purchase in LKR using familiar payment methods.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <FiMapPin className="h-6 w-6 text-primary mb-3" />
                <p className="text-sm font-semibold text-gray-900 mb-1">Rooted in Batticaloa</p>
                <p className="text-sm text-gray-600">
                  From Kallady to Kattankudy and Eravur, we highlight makers from the Batticaloa
                  district first, then extend island-wide.
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <FiUsers className="h-6 w-6 text-primary mb-3" />
                <p className="text-sm font-semibold text-gray-900 mb-1">For buyers & artisans</p>
                <p className="text-sm text-gray-600">
                  One platform with dedicated dashboards for buyers, artisans, and admins so each
                  role has the tools they need.
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <FiShield className="h-6 w-6 text-primary mb-3" />
                <p className="text-sm font-semibold text-gray-900 mb-1">Secure interactions</p>
                <p className="text-sm text-gray-600">
                  Private chat rooms connect a buyer only with the specific artisan for an order or
                  custom request.
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <FiShoppingBag className="h-6 w-6 text-primary mb-3" />
                <p className="text-sm font-semibold text-gray-900 mb-1">Built for LKR payments</p>
                <p className="text-sm text-gray-600">
                  Product prices, carts, and orders are shown in Sri Lankan Rupees so it feels
                  natural for local buyers.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

    
        {/* Closing CTA */}
        <section className="bg-gradient-to-r from-primary to-primary-dark rounded-3xl px-8 py-10 text-white flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0">
            <h2 className="text-2xl md:text-3xl font-serif font-bold mb-2">
              Building a home for eastern crafts.
            </h2>
            <p className="text-sm md:text-base text-white/80 max-w-xl">
              Whether you are a buyer in Batticaloa town, a student in Colombo, or an artisan in a
              small village, MadioCraft is designed to feel simple, safe, and local-first.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/register"
              className="px-6 py-3 bg-white text-primary font-semibold rounded-full text-sm hover:bg-gray-100 text-center"
            >
              Sign up as Buyer or Artisan
            </a>
            <a
              href="/products"
              className="px-6 py-3 border-2 border-white/70 text-white font-semibold rounded-full text-sm hover:bg-white/10 text-center"
            >
              Start Exploring Products
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;

