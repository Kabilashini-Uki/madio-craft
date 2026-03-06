import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotif } from '../context/NotifContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function ArtisanShop() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const { addToast } = useNotif();
  const navigate = useNavigate();
  const [artisan, setArtisan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState(null);
  const [showCoverUpload, setShowCoverUpload] = useState(false);

  useEffect(() => {
    fetch(`${API}/artisans/${id}`)
      .then(r => r.json())
      .then(d => setArtisan(d.artisan))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [id]);

  const handleBuyNow = async (product) => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'buyer') { addToast('Only buyers can purchase', 'error'); return; }
    const result = await addToCart(product._id, 1);
    if (result.success) navigate('/cart');
    else addToast(result.message || 'Failed', 'error');
  };

  const handleAddToCart = async (product) => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'buyer') { addToast('Only buyers can add to cart', 'error'); return; }
    await addToCart(product._id, 1);
  };

  const sendCustomizationMsg = async () => {
    if (!user) { navigate('/login'); return; }
    if (!chatMessage.trim()) return;
    try {
      const res = await fetch(`${API}/chat/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ artisanId: id, initialMessage: chatMessage })
      });
      if (res.ok) {
        addToast('Message sent! The artisan will respond soon.', 'success');
        setChatMessage('');
        setShowChat(false);
      } else {
        addToast('Failed to send message', 'error');
      }
    } catch {
      addToast('Failed to send message', 'error');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>Loading shop...</div>;
  if (!artisan) return <div style={{ textAlign: 'center', padding: 80 }}>Artisan not found.</div>;

  const avatar = artisan.profileImage || artisan.avatar?.url;
  const stars = Math.round(artisan.rating || 0);

  return (
    <div>
      {/* Cover - Editable */}
      <div style={{
        height: 280,
        background: `url(${coverImageUrl || artisan.coverImage || 'https://images.pexels.com/photos/18633243/pexels-photo-18633243.jpeg'}) center/cover`,
        backgroundColor: '#8B4513', position: 'relative'
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6) 100%)'
        }} />
        {/* Upload banner button - visible always for artisan owner or as demo */}
        <button
          onClick={() => setShowCoverUpload(true)}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(0,0,0,0.6)', color: 'white', border: '2px solid white',
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          📷 Change Cover Photo
        </button>
      </div>

      {/* Cover Image Upload Modal */}
      {showCoverUpload && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setShowCoverUpload(false)}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 28, maxWidth: 480, width: '90%'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: 20, marginBottom: 16 }}>Upload Cover Photo</h3>
            <input
              type="file"
              accept="image/*"
              onChange={e => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = ev => {
                    setCoverImageUrl(ev.target.result);
                    setShowCoverUpload(false);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              style={{
                display: 'block', width: '100%', padding: 12,
                border: '2px dashed #8B4513', borderRadius: 12,
                cursor: 'pointer', marginBottom: 12
              }}
            />
            <p style={{ fontSize: 13, color: '#666', textAlign: 'center' }}>
              Choose an image from your device (JPG, PNG, etc.)
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setShowCoverUpload(false)}
                style={{ flex: 1, padding: '10px', border: '2px solid #ddd', borderRadius: 8, cursor: 'pointer', background: 'white' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile header */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 20, marginTop: -60,
          flexWrap: 'wrap', position: 'relative', zIndex: 1
        }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%', border: '4px solid white',
            background: avatar ? `url(${avatar}) center/cover` : '#8B4513',
            backgroundColor: '#8B4513', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 48, color: 'white', fontWeight: 700,
            flexShrink: 0
          }}>
            {!avatar && artisan.name?.[0]}
          </div>
          <div style={{ flex: 1, paddingBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 30, color: '#1a1a1a' }}>
                {artisan.businessName || artisan.name}
              </h1>
              {artisan.isVerified && (
                <span style={{ background: '#2d6a4f', color: 'white', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>✓ Verified</span>
              )}
            </div>
            <p style={{ color: '#666', fontSize: 14, marginTop: 2 }}>by {artisan.name}</p>
            {artisan.location && <p style={{ color: '#888', fontSize: 13 }}>📍 {artisan.location}</p>}
          </div>

          {/* Chat button */}
          {user && user.role === 'buyer' && (
            <button onClick={() => setShowChat(true)} style={{
              background: '#8B4513', color: 'white', border: 'none',
              padding: '12px 24px', borderRadius: 10, fontWeight: 700,
              cursor: 'pointer', fontSize: 14
            }}>
              💬 Customization Chat
            </button>
          )}
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: 24, marginTop: 24, padding: '16px 24px',
          background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          flexWrap: 'wrap'
        }}>
          <div>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <span key={s} style={{ color: s <= stars ? '#f59e0b' : '#ddd', fontSize: 16 }}>★</span>
              ))}
            </div>
            <p style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{artisan.rating?.toFixed(1) || '0.0'} ({artisan.reviewCount || 0} reviews)</p>
          </div>
          <div style={{ width: 1, background: '#eee' }} />
          <div>
            <p style={{ fontWeight: 700, fontSize: 20, color: '#8B4513' }}>{artisan.products?.length || 0}</p>
            <p style={{ fontSize: 13, color: '#666' }}>Products</p>
          </div>
          <div style={{ width: 1, background: '#eee' }} />
          <div>
            <p style={{ fontWeight: 700, fontSize: 20, color: '#8B4513' }}>{artisan.experience || 0}</p>
            <p style={{ fontSize: 13, color: '#666' }}>Years Exp.</p>
          </div>
          {artisan.craftCategory && (
            <>
              <div style={{ width: 1, background: '#eee' }} />
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#333', textTransform: 'capitalize' }}>{artisan.craftCategory}</p>
                <p style={{ fontSize: 13, color: '#666' }}>Specialty</p>
              </div>
            </>
          )}
        </div>

        {/* Bio */}
        {(artisan.bio || artisan.description) && (
          <div style={{ margin: '24px 0', padding: 20, background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, marginBottom: 10 }}>About</h3>
            <p style={{ color: '#555', lineHeight: 1.7 }}>{artisan.bio || artisan.description}</p>
          </div>
        )}

        {/* Products */}
        <div style={{ margin: '24px 0 40px' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, marginBottom: 20 }}>
            All Products ({artisan.products?.length || 0})
          </h2>
          {!artisan.products?.length ? (
            <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 12, color: '#999' }}>
              No products yet in this shop.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {artisan.products.map(p => (
                <ShopProductCard key={p._id} product={p}
                  onView={() => setSelectedProduct(p)}
                  onCart={() => handleAddToCart(p)}
                  onBuy={() => handleBuyNow(p)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        {artisan.fullArtisanData?.reviews?.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, marginBottom: 20 }}>Customer Reviews</h2>
            <div style={{ display: 'grid', gap: 14 }}>
              {artisan.fullArtisanData.reviews.map((r, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', background: '#8B4513',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: 14
                    }}>{r.buyerName?.[0] || 'B'}</div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{r.buyerName}</p>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map(s => <span key={s} style={{ fontSize: 12, color: s <= r.rating ? '#f59e0b' : '#ddd' }}>★</span>)}
                      </div>
                    </div>
                    {r.isVerifiedPurchase && (
                      <span style={{ marginLeft: 'auto', background: '#d4edda', color: '#155724', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        ✓ Verified Purchase
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6 }}>{r.comment}</p>
                  <p style={{ fontSize: 12, color: '#999', marginTop: 6 }}>{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product detail modal */}
      {selectedProduct && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
        }} onClick={() => setSelectedProduct(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 16, padding: 28, maxWidth: 600, width: '100%',
            maxHeight: '85vh', overflowY: 'auto', position: 'relative'
          }}>
            <button onClick={() => setSelectedProduct(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>✕</button>
            {selectedProduct.images?.[0]?.url && (
              <img src={selectedProduct.images[0].url} alt={selectedProduct.name} style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 10, marginBottom: 16 }} />
            )}
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, marginBottom: 8 }}>{selectedProduct.name}</h2>
            <p style={{ color: '#8B4513', fontWeight: 700, fontSize: 22, marginBottom: 12 }}>Rs. {selectedProduct.price?.toLocaleString()}</p>
            <p style={{ color: '#555', lineHeight: 1.6, marginBottom: 16 }}>{selectedProduct.description}</p>
            {selectedProduct.materials?.length > 0 && (
              <p style={{ fontSize: 13, marginBottom: 12 }}><strong>Materials:</strong> {selectedProduct.materials.join(', ')}</p>
            )}
            <p style={{ fontSize: 13, marginBottom: 20, color: selectedProduct.stock > 0 ? '#2d6a4f' : '#c62828', fontWeight: 600 }}>
              {selectedProduct.stock > 0 ? `✓ ${selectedProduct.stock} in stock` : '✗ Out of stock'}
            </p>
            {selectedProduct.stock > 0 && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { handleAddToCart(selectedProduct); setSelectedProduct(null); }} style={{
                  flex: 1, padding: 12, border: '2px solid #8B4513', borderRadius: 10,
                  background: 'white', color: '#8B4513', fontWeight: 700, cursor: 'pointer'
                }}>🛒 Add to Cart</button>
                <button onClick={() => { handleBuyNow(selectedProduct); }} style={{
                  flex: 1, padding: 12, border: 'none', borderRadius: 10,
                  background: '#8B4513', color: 'white', fontWeight: 700, cursor: 'pointer'
                }}>⚡ Buy Now</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat modal */}
      {showChat && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
        }} onClick={() => setShowChat(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 16, padding: 28, maxWidth: 480, width: '100%'
          }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, marginBottom: 6 }}>💬 Customization Chat</h3>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>
              Send a message to {artisan.businessName || artisan.name} about custom orders.
            </p>
            <textarea
              value={chatMessage}
              onChange={e => setChatMessage(e.target.value)}
              placeholder="Describe your customization requirements, size, color, materials, etc..."
              rows={4}
              style={{ width: '100%', padding: 12, border: '1.5px solid #e8ddd5', borderRadius: 10, resize: 'vertical', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={() => setShowChat(false)} style={{
                flex: 1, padding: 12, border: '1.5px solid #ddd', borderRadius: 10,
                background: 'white', cursor: 'pointer', fontWeight: 600
              }}>Cancel</button>
              <button onClick={sendCustomizationMsg} style={{
                flex: 1, padding: 12, background: '#8B4513', color: 'white',
                border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer'
              }}>Send Message</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShopProductCard({ product: p, onView, onCart, onBuy }) {
  const img = p.images?.find(i => i.isPrimary)?.url || p.images?.[0]?.url;
  return (
    <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div
        onClick={onView}
        style={{
          height: 190, background: img ? `url(${img}) center/cover` : '#f0e6dc',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 48, cursor: 'pointer'
        }}
      >
        {!img && '🏺'}
      </div>
      <div style={{ padding: 14 }}>
        <p style={{ fontSize: 11, color: '#8B4513', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{p.category}</p>
        <h3 onClick={onView} style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, cursor: 'pointer' }}>{p.name}</h3>
        <p style={{ fontSize: 20, fontWeight: 800, color: '#8B4513', marginBottom: 10 }}>Rs. {p.price?.toLocaleString()}</p>
        {p.stock > 0 ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onCart} style={{
              flex: 1, padding: '8px 0', border: '1.5px solid #8B4513', borderRadius: 8,
              background: 'white', color: '#8B4513', fontWeight: 600, cursor: 'pointer', fontSize: 12
            }}>🛒 Cart</button>
            <button onClick={onBuy} style={{
              flex: 1, padding: '8px 0', border: 'none', borderRadius: 8,
              background: '#8B4513', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 12
            }}>⚡ Buy</button>
          </div>
        ) : (
          <p style={{ color: '#c62828', fontSize: 13, fontWeight: 600 }}>Out of stock</p>
        )}
      </div>
    </div>
  );
}
