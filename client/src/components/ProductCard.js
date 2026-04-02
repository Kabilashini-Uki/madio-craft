// src/components/ProductCard.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotif } from '../context/NotifContext';
import toast from 'react-hot-toast';
import ProductCustomizationModal from './ProductCustomizationModal';

// Inline styles
const styles = {
  card: {
    background: 'white',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    transition: 'box-shadow 0.3s, transform 0.3s',
    cursor: 'pointer',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  imageContainer: {
    position: 'relative',
    height: '256px',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.5s',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)',
    opacity: 0,
    transition: 'opacity 0.3s',
  },
  actions: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  actionButton: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'white',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s',
  },
  wishlistButton: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'white',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s',
    color: '#6b7280',
  },
  wishlistActive: {
    background: '#ef4444',
    color: 'white',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: '16px',
    left: '16px',
    padding: '4px 12px',
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(4px)',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#111827',
    textTransform: 'capitalize',
  },
  outOfStockOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.5)',
  },
  outOfStockText: {
    color: 'white',
    fontWeight: 600,
    fontSize: '1.125rem',
  },
  content: {
    padding: '20px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  artisanRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  artisanInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  artisanAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    overflow: 'hidden',
    background: '#f3f4f6',
  },
  artisanAvatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  artisanName: {
    fontSize: '0.875rem',
    color: '#4b5563',
  },
  location: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#9ca3af',
  },
  locationText: {
    fontSize: '0.75rem',
  },
  productName: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  description: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '12px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  stockStatus: {
    fontSize: '0.75rem',
    fontWeight: 600,
    marginBottom: '12px',
  },
  inStock: {
    color: '#16a34a',
  },
  lowStock: {
    color: '#f97316',
  },
  outOfStock: {
    color: '#dc2626',
  },
  approvedBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '12px',
    padding: '12px',
    marginBottom: '12px',
  },
  approvedIcon: {
    color: '#16a34a',
    fontSize: '1rem',
  },
  approvedText: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#166534',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  price: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#111827',
  },
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  customizeButton: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#fef3c7',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#b45309',
    transition: 'all 0.2s',
    position: 'relative',
  },
  customizeButtonHover: {
    background: '#b45309',
    color: 'white',
  },
  cartButton: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#fef3c7',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#b45309',
    transition: 'all 0.2s',
  },
  cartButtonDisabled: {
    background: '#f3f4f6',
    color: '#9ca3af',
    cursor: 'not-allowed',
  },
  buyButton: {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  buyButtonDefault: {
    background: '#b45309',
    color: 'white',
  },
  buyButtonApproved: {
    background: '#16a34a',
    color: 'white',
    boxShadow: '0 0 0 2px #86efac',
  },
  buyButtonDisabled: {
    background: '#f3f4f6',
    color: '#9ca3af',
    cursor: 'not-allowed',
  },
};

const PaletteIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2 0-.56-.2-1.08-.53-1.47a.75.75 0 01.53-1.28H16c3.31 0 6-2.69 6-6C22 6.48 17.52 2 12 2z" />
    <circle cx="7" cy="12" r="1.5" fill="currentColor" />
    <circle cx="9.5" cy="7.5" r="1.5" fill="currentColor" />
    <circle cx="14.5" cy="7.5" r="1.5" fill="currentColor" />
    <circle cx="17" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

const ProductCard = ({ product, index = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [custBounce, setCustBounce] = useState(false);

  const navigate = useNavigate();
  const { addToCart, isInWishlist, addToWishlist, removeFromWishlist } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { isCustomizationApproved } = useNotif();

  // Safety check for null/invalid product - AFTER all hooks
  if (!product || !product._id) {
    return null;
  }

  const inWishlist = isInWishlist(product._id);
  const isOwnProduct = isAuthenticated && (
    String(user?.id || user?._id) === String(product.artisan?._id || product.artisan)
  );
  const canOrder = isAuthenticated && !isOwnProduct;
  const custApproved = isCustomizationApproved(product._id);
  const artisanLoc = product.artisan?.location || '';

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login'); navigate('/login'); return; }
    if (isOwnProduct) { toast.error("You can't order your own product", { icon: '🚫' }); return; }
    if (!canOrder) { toast.error('You cannot order your own product'); return; }
    setAddingToCart(true);
    await addToCart(product, null, 1);
    setAddingToCart(false);
  };

  const handleBuyNow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login'); navigate('/login'); return; }
    if (isOwnProduct) { toast.error("You can't order your own product", { icon: '🚫' }); return; }
    if (!canOrder) { toast.error('You cannot order your own product'); return; }
    setBuyingNow(true);
    const ok = await addToCart(product, null, 1);
    setBuyingNow(false);
    if (ok !== false) navigate('/cart');
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login'); navigate('/login'); return; }
    if (inWishlist) await removeFromWishlist(product._id);
    else await addToWishlist(product);
  };

  const openCustomize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to customise'); navigate('/login'); return; }
    if (isOwnProduct) { toast.error("You can't customise your own product", { icon: '🚫' }); return; }
    if (!canOrder) { toast.error('You cannot customise your own product'); return; }
    setCustBounce(true);
    setTimeout(() => setCustBounce(false), 500);
    setShowCustom(true);
  };

  const stockBadge = () => {
    if (product.stock === 0) {
      return <span style={{ ...styles.stockStatus, ...styles.outOfStock }}>Out of stock</span>;
    }
    if (product.stock <= 5) {
      return <span style={{ ...styles.stockStatus, ...styles.lowStock }}>Only {product.stock} left</span>;
    }
    return <span style={{ ...styles.stockStatus, ...styles.inStock }}>In stock ({product.stock})</span>;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={styles.card}
        onClick={() => navigate(`/products/${product._id}`)}
      >
        {/* Image Container */}
        <div style={styles.imageContainer}>
          <img
            src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=400'}
            alt={product.name}
            style={{
              ...styles.image,
              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            }}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=400';
            }}
          />
          <div style={{ ...styles.overlay, opacity: isHovered ? 1 : 0 }} />

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 16 }}
            transition={{ duration: 0.25 }}
            style={styles.actions}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleWishlist}
              style={{
                ...styles.wishlistButton,
                ...(inWishlist ? styles.wishlistActive : {}),
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/products/${product._id}`);
              }}
              style={styles.actionButton}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M22 12c-2.667 4.667-6 7-10 7s-7.333-2.333-10-7c2.667-4.667 6-7 10-7s7.333 2.333 10 7z" />
              </svg>
            </button>
          </motion.div>

          {/* Category Badge */}
          {product.category && (
            <span style={styles.categoryBadge}>
              {product.category}
            </span>
          )}

          {/* Out of Stock Overlay */}
          {product.stock === 0 && (
            <div style={styles.outOfStockOverlay}>
              <span style={styles.outOfStockText}>Out of Stock</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Artisan Row */}
          <div style={styles.artisanRow}>
            <div style={styles.artisanInfo}>
              <div style={styles.artisanAvatar}>
                <img
                  src={product.artisan?.avatar?.url || `https://ui-avatars.com/api/?name=${product.artisan?.name || 'A'}&background=b45309&color=fff&size=28`}
                  alt={product.artisan?.name}
                  style={styles.artisanAvatarImg}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${product.artisan?.name || 'A'}&background=b45309&color=fff&size=28`;
                  }}
                />
              </div>
              <span style={styles.artisanName}>{product.artisan?.name}</span>
            </div>
            {artisanLoc && (
              <div style={styles.location}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span style={styles.locationText}>{artisanLoc}</span>
              </div>
            )}
          </div>

          <h3 style={styles.productName}>{product.name}</h3>
          <p style={styles.description}>{product.description}</p>
          {stockBadge()}

          {/* Customization Approved Banner */}
          {custApproved && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={styles.approvedBanner}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.approvedIcon}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span style={styles.approvedText}>Customisation approved — you can now purchase!</span>
            </motion.div>
          )}

          {/* Price and Actions */}
          <div style={styles.priceRow}>
            <span style={styles.price}>Rs. {product.price?.toLocaleString()}</span>
            <div style={styles.actionsRow} onClick={(e) => e.stopPropagation()}>
              {/* Customize Button */}
              <motion.button
                onClick={openCustomize}
                animate={custBounce ? { scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] } : {}}
                whileHover={{ scale: 1.1 }}
                style={{
                  ...styles.customizeButton,
                  ...(isHovered ? styles.customizeButtonHover : {}),
                }}
                title="Customise colour & size"
              >
                <PaletteIcon />
              </motion.button>

              {/* Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock === 0}
                style={{
                  ...styles.cartButton,
                  ...(product.stock === 0 ? styles.cartButtonDisabled : {}),
                }}
              >
                {addingToCart ? (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid currentColor',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Buy Now Button */}
          <div onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleBuyNow}
              disabled={buyingNow || product.stock === 0}
              style={{
                ...styles.buyButton,
                ...(product.stock === 0 ? styles.buyButtonDisabled :
                  custApproved ? styles.buyButtonApproved : styles.buyButtonDefault),
              }}
            >
              {buyingNow ? 'Processing...' : custApproved ? '🛒 Buy Customised' : 'Buy Now'}
            </button>
          </div>
        </div>
      </motion.div>

      {showCustom && (
        <ProductCustomizationModal product={product} onClose={() => setShowCustom(false)} />
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export default ProductCard;