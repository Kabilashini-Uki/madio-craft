// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiEdit3, FiShoppingBag } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import toast from 'react-hot-toast';

// Simple Product Card for Home Page - Only shows essentials
const SimpleProductCard = ({ product, index }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  const isOwnProduct = isAuthenticated && user && (
    String(user?.id || user?._id) === String(product.artisan?._id || product.artisan)
  );

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    if (isOwnProduct) {
      toast.error("You can't order your own product");
      return;
    }
    if (user?.role === 'admin') {
      toast.error('Admins cannot place orders');
      return;
    }
    
    setAddingToCart(true);
    try {
      const success = await addToCart(product, null, 1);
      if (success !== false) {
        toast.success('Added to cart!');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }
    if (isOwnProduct) {
      toast.error("You can't order your own product");
      return;
    }
    if (user?.role === 'admin') {
      toast.error('Admins cannot place orders');
      return;
    }
    
    setBuyingNow(true);
    try {
      const success = await addToCart(product, null, 1);
      if (success !== false) {
        navigate('/checkout?productId=' + product._id);
      }
    } catch (error) {
      console.error('Buy now error:', error);
    } finally {
      setBuyingNow(false);
    }
  };

  const handleCustomize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please login to customize');
      navigate('/login');
      return;
    }
    if (isOwnProduct) {
      toast.error("You can't customize your own product");
      return;
    }
    if (user?.role === 'admin') {
      toast.error('Admins cannot customize products');
      return;
    }
    
    // Navigate to product page with customization modal open
    navigate(`/products/${product._id}?customize=true`);
  };

  const handleCardClick = () => {
    navigate(`/products/${product._id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={handleCardClick}
      style={{
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'all 0.3s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
      }}
    >
      {/* Product Image */}
      <div style={{ position: 'relative', height: '280px', overflow: 'hidden' }}>
        <img
          src={product.images?.[0]?.url || 'https://via.placeholder.com/300'}
          alt={product.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Product Info */}
      <div style={{ padding: '20px' }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#111827',
          marginBottom: '8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {product.name}
        </h3>

        {/* Artisan Name */}
        <p style={{
          fontSize: '0.875rem',
          color: '#9ca3af',
          marginBottom: '8px',
          cursor: 'pointer',
          textDecoration: 'none',
          transition: 'color 0.2s',
        }}
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/artisans/${product.artisan?._id || product.artisan}`);
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#E29578'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
        >
          by {product.artisan?.name || 'Unknown Artisan'}
        </p>

        <p style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#E29578',
          marginBottom: '12px',
        }}>
          Rs. {product.price?.toLocaleString()}
        </p>

        {/* Short Description */}
        <p style={{
          fontSize: '0.875rem',
          color: '#6b7280',
          marginBottom: '16px',
          lineHeight: '1.4',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          minHeight: '2.8em',
        }}>
          {product.description || product.shortDescription || 'Handcrafted with care and attention to detail'}
        </p>

        {/* Icon Buttons */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {/* Add to Cart Icon */}
          <button
            onClick={handleAddToCart}
            disabled={addingToCart || isOwnProduct}
            title="Add to Cart"
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isOwnProduct ? '#e5e7eb' : '#E29578',
              color: isOwnProduct ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isOwnProduct ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              pointerEvents: 'auto',
            }}
            onMouseEnter={(e) => {
              if (!isOwnProduct && !addingToCart) {
                e.currentTarget.style.background = '#D17A5C';
                e.currentTarget.style.transform = 'scale(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isOwnProduct) {
                e.currentTarget.style.background = '#E29578';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {addingToCart ? '...' : <FiShoppingCart size={18} />}
          </button>

          {/* Customization Icon */}
          <button
            onClick={handleCustomize}
            disabled={isOwnProduct}
            title="Customize Product"
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isOwnProduct ? '#e5e7eb' : 'white',
              color: isOwnProduct ? '#9ca3af' : '#E29578',
              border: `2px solid ${isOwnProduct ? '#e5e7eb' : '#E29578'}`,
              borderRadius: '8px',
              cursor: isOwnProduct ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              pointerEvents: 'auto',
            }}
            onMouseEnter={(e) => {
              if (!isOwnProduct) {
                e.currentTarget.style.background = '#E29578';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'scale(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isOwnProduct) {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#E29578';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <FiEdit3 size={18} />
          </button>

          {/* Buy Now Icon */}
          <button
            onClick={handleBuyNow}
            disabled={buyingNow || isOwnProduct}
            title="Buy Now"
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isOwnProduct ? '#e5e7eb' : '#111827',
              color: isOwnProduct ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isOwnProduct ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              pointerEvents: 'auto',
            }}
            onMouseEnter={(e) => {
              if (!isOwnProduct && !buyingNow) {
                e.currentTarget.style.background = '#374151';
                e.currentTarget.style.transform = 'scale(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isOwnProduct) {
                e.currentTarget.style.background = '#111827';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {buyingNow ? '...' : <FiShoppingBag size={18} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Inline styles
const styles = {
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 24px',
  },
  heroSection: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    background: '#1a1a1a',
  },
  heroImage: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.4))',
    zIndex: 10,
  },
  heroContent: {
    position: 'relative',
    zIndex: 20,
    color: 'white',
    maxWidth: '800px',
  },
  heroBadge: {
    display: 'inline-block',
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '9999px',
    fontSize: '14px',
    border: '1px solid rgba(255,255,255,0.2)',
    marginBottom: '24px',
  },
  heroTitle: {
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    fontFamily: "'Playfair Display', serif",
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: '24px',
  },
  heroTitleGradient: {
    background: 'linear-gradient(to right, #f59e0b, #d97706)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroDescription: {
    fontSize: '1.25rem',
    color: '#e5e5e5',
    marginBottom: '32px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  primaryButton: {
    padding: '16px 32px',
    background: 'linear-gradient(to right, #b45309, #92400e)',
    color: 'white',
    border: 'none',
    borderRadius: '9999px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  secondaryButton: {
    padding: '16px 32px',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '9999px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  section: {
    padding: '80px 0',
  },
  sectionHeader: {
    textAlign: 'center',
    maxWidth: '800px',
    margin: '0 auto 64px',
  },
  sectionSubtitle: {
    color: '#b45309',
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '2.5rem',
    fontFamily: "'Playfair Display', serif",
    fontWeight: 700,
    color: '#111827',
    marginBottom: '16px',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '32px',
    marginTop: '48px',
  },
  featureCard: {
    textAlign: 'center',
    padding: '24px',
  },
  featureIcon: {
    width: '64px',
    height: '64px',
    background: '#fef3c7',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    fontSize: '24px',
    color: '#b45309',
  },
  featureTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '12px',
  },
  featureDescription: {
    color: '#4b5563',
    fontSize: '0.875rem',
    lineHeight: 1.6,
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '32px',
    marginTop: '48px',
    filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.05))',
  },
  categoriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '32px',
    filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.05))',
  },
  categoryCard: {
    position: 'relative',
    height: '320px',
    borderRadius: '16px',
    overflow: 'hidden',
    cursor: 'pointer',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.5s',
  },
  categoryOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
  },
  categoryContent: {
    position: 'absolute',
    bottom: '24px',
    left: '24px',
    color: 'white',
  },
  categoryName: {
    fontSize: '1.5rem',
    fontFamily: "'Playfair Display', serif",
    fontWeight: 700,
    marginBottom: '8px',
  },
  categoryLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.875rem',
    color: 'white',
    textDecoration: 'none',
  },
  ctaSection: {
    background: '#111827',
    padding: '96px 0',
    textAlign: 'center',
    color: 'white',
  },
  ctaTitle: {
    fontSize: '2.5rem',
    fontFamily: "'Playfair Display', serif",
    fontWeight: 700,
    marginBottom: '24px',
  },
  ctaDescription: {
    fontSize: '1.25rem',
    color: '#9ca3af',
    maxWidth: '600px',
    margin: '0 auto 40px',
  },
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #b45309',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '48px auto',
  },
};

const Home = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);



  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch latest 4 products for Trending Treasures
      const productsRes = await api.get('/products?limit=4&sort=-createdAt');
      const fetchedProducts = productsRes.data?.products || [];
      
      // Filter out any null or invalid products
      const validProducts = fetchedProducts.filter(p => p && p._id && p.name && p.images);
      setProducts(validProducts);

      // Fetch categories from products
      const allProductsRes = await api.get('/products?limit=100');
      const allProducts = allProductsRes.data?.products || [];

      // Extract unique categories with images
      const categoryMap = new Map();
      allProducts.forEach(product => {
        if (product && product.category && !categoryMap.has(product.category)) {
          categoryMap.set(product.category, {
            name: product.category,
            image: product.images?.[0]?.url || 'https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=400',
            count: 1
          });
        } else if (product && product.category) {
          const existing = categoryMap.get(product.category);
          if (existing) existing.count += 1;
        }
      });

      setCategories(Array.from(categoryMap.values()).slice(0, 4));

    } catch (error) {
      console.error('Error fetching data:', error);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: '🏆', title: 'Authentic Craftsmanship', description: 'Every piece is handcrafted by skilled artisans' },
    { icon: '🛡️', title: 'Secure Payments', description: '100% secure transactions with Razorpay' },
    { icon: '❤️', title: 'Support Artisans', description: 'Directly support traditional crafts' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Hero Section */}
      <section style={styles.heroSection}>
        <img
          src="/assets/hero.png"
          alt="Artisan at work"
          style={styles.heroImage}
        />
        <div style={styles.heroOverlay}></div>

        <div style={{ ...styles.container, position: 'relative', zIndex: 20 }}>
          <div style={styles.heroContent}>
            <span style={styles.heroBadge}>
              ✨ Handcrafted with Love
            </span>
            <h1 style={styles.heroTitle}>
              Discover the Art of{' '}
              <span style={styles.heroTitleGradient}>Traditional</span><br />
              Craftsmanship
            </h1>
            <p style={styles.heroDescription}>
              Connect directly with Batticaloa's finest artisans. Each piece tells a unique story.
            </p>

            <div style={styles.buttonGroup}>
              <button
                onClick={() => navigate('/products')}
                style={styles.primaryButton}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                Explore Collection
              </button>
              <button
                onClick={() => navigate('/artisans')}
                style={styles.secondaryButton}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                Meet Artisans
              </button>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              style={{
                marginTop: '32px',
                fontSize: '0.95rem',
                color: 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ color: '#f59e0b' }}>✨</span>
              Need something unique?
              <span
                onClick={() => navigate('/products')}
                style={{
                  color: 'white',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontWeight: 500,
                  textUnderlineOffset: '4px'
                }}
              >
                Request a custom craft
              </span>
            </motion.p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ ...styles.section, background: 'white' }}>
        <div style={styles.container}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionSubtitle}>Why Choose Us</div>
            <h2 style={styles.sectionTitle}>Experience the Art of Handmade</h2>
          </div>

          <div style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} style={styles.featureCard}>
                <div style={styles.featureIcon}>{feature.icon}</div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ ...styles.section, background: '#f9fafb' }}>
        <div style={styles.container}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '64px' }}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionSubtitle}>Featured Collection</div>
              <h2 style={styles.sectionTitle}>Trending Treasures</h2>
            </div>
            <button
              onClick={() => navigate('/products')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#b45309',
                background: 'none',
                border: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>View All</span>
              <span>→</span>
            </button>
          </div>

          {loading ? (
            <div style={styles.loadingSpinner} />
          ) : (
            <div style={styles.productsGrid}>
              {products.map((product, index) => (
                <SimpleProductCard key={product._id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section style={{ ...styles.section, background: 'white' }}>
        <div style={styles.container}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionSubtitle}>Shop by</div>
            <h2 style={styles.sectionTitle}>Explore Categories</h2>
          </div>

          <div style={styles.categoriesGrid}>
            {categories.map((category, index) => (
              <div
                key={index}
                onClick={() => navigate(`/products?category=${category.name.toLowerCase()}`)}
                style={styles.categoryCard}
                onMouseEnter={(e) => {
                  const img = e.currentTarget.querySelector('img');
                  if (img) img.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  const img = e.currentTarget.querySelector('img');
                  if (img) img.style.transform = 'scale(1)';
                }}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  style={styles.categoryImage}
                />
                <div style={styles.categoryOverlay}></div>
                <div style={styles.categoryContent}>
                  <h3 style={styles.categoryName}>{category.name}</h3>
                  <span style={styles.categoryLink}>
                    <span>Shop Now</span>
                    <span>→</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.ctaSection}>
        <div style={styles.container}>
          <h2 style={styles.ctaTitle}>Join Our Artisan Community</h2>
          <p style={styles.ctaDescription}>
            Whether you're an artisan or a buyer, MadioCraft is your platform for authentic handmade crafts.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/register')}
              style={{
                padding: '16px 32px',
                background: 'linear-gradient(to right, #b45309, #92400e)',
                color: 'white',
                border: 'none',
                borderRadius: '9999px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Start Selling
            </button>
            <button
              onClick={() => navigate('/products')}
              style={{
                padding: '16px 32px',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '9999px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Start Shopping
            </button>
          </div>
        </div>
      </section>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Home;