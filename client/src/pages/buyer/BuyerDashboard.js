import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotif } from '../../context/NotifContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const STATUS_COLORS = {
  pending: { bg: '#fff3cd', color: '#856404' },
  confirmed: { bg: '#d1ecf1', color: '#0c5460' },
  processing: { bg: '#cce5ff', color: '#004085' },
  'order ready': { bg: '#d4edda', color: '#155724' },
  shipped: { bg: '#d4edda', color: '#155724' },
  delivered: { bg: '#d4edda', color: '#155724' },
  cancelled: { bg: '#f8d7da', color: '#721c24' }
};

export default function BuyerDashboard() {
  const { user, token } = useAuth();
  const { addToast, addNotification } = useNotif();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetch(`${API}/orders/my`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => {
      setOrders(d.orders || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const submitReview = async () => {
    if (!reviewForm.comment.trim()) { addToast('Please write a review', 'error'); return; }
    setSubmittingReview(true);
    try {
      const res = await fetch(`${API}/artisans/${reviewModal.artisanId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          rating: reviewForm.rating,
          comment: reviewForm.comment,
          orderId: reviewModal.orderId,
          productId: reviewModal.productId
        })
      });
      if (res.ok) {
        addToast('Review submitted! Thank you.', 'success');
        setReviewModal(null);
        setReviewForm({ rating: 5, comment: '' });
      } else {
        addToast('Failed to submit review', 'error');
      }
    } catch {
      addToast('Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const deliveredOrders = orders.filter(o => o.orderStatus === 'delivered');

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #8B4513, #D2691E)', borderRadius: 16, padding: 28, marginBottom: 28, color: 'white' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, marginBottom: 6 }}>
          Welcome, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p style={{ opacity: 0.85 }}>Manage your orders and purchases</p>
        <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
          <div>
            <p style={{ fontSize: 24, fontWeight: 700 }}>{orders.length}</p>
            <p style={{ fontSize: 12, opacity: 0.8 }}>Total Orders</p>
          </div>
          <div>
            <p style={{ fontSize: 24, fontWeight: 700 }}>{deliveredOrders.length}</p>
            <p style={{ fontSize: 12, opacity: 0.8 }}>Delivered</p>
          </div>
          <div>
            <p style={{ fontSize: 24, fontWeight: 700 }}>{orders.filter(o => o.orderStatus === 'pending').length}</p>
            <p style={{ fontSize: 12, opacity: 0.8 }}>Pending</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <Link to="/products" style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
          background: 'white', borderRadius: 10, textDecoration: 'none', color: '#333',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontWeight: 600, fontSize: 14
        }}>🛍️ Shop Products</Link>
        <Link to="/artisans" style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
          background: 'white', borderRadius: 10, textDecoration: 'none', color: '#333',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontWeight: 600, fontSize: 14
        }}>🎨 Browse Artisans</Link>
        <Link to="/cart" style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
          background: 'white', borderRadius: 10, textDecoration: 'none', color: '#333',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontWeight: 600, fontSize: 14
        }}>🛒 View Cart</Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #eee' }}>
        {[
          { id: 'orders', label: 'My Orders' },
          { id: 'reviews', label: 'Leave Reviews' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 14,
            color: activeTab === t.id ? '#8B4513' : '#666',
            borderBottom: activeTab === t.id ? '2px solid #8B4513' : '2px solid transparent',
            marginBottom: -2
          }}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'orders' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Loading orders...</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 12 }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>📦</div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, marginBottom: 8 }}>No orders yet</h3>
              <p style={{ color: '#666', marginBottom: 20 }}>Start shopping to see your orders here.</p>
              <Link to="/products" style={{
                background: '#8B4513', color: 'white', padding: '12px 28px',
                borderRadius: 10, textDecoration: 'none', fontWeight: 700
              }}>Shop Now</Link>
            </div>
          ) : (
            orders.map(order => <OrderCard key={order._id} order={order} onReview={(data) => setReviewModal(data)} />)
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div>
          {deliveredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 12, color: '#999' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
              <p>You can leave reviews after your orders are delivered.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {deliveredOrders.map(order => (
                <div key={order._id} style={{ background: 'white', borderRadius: 12, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <p style={{ fontWeight: 700 }}>{order.orderId}</p>
                      <p style={{ fontSize: 13, color: '#666' }}>From: {order.artisan?.name}</p>
                    </div>
                    <button onClick={() => setReviewModal({
                      orderId: order._id,
                      artisanId: order.artisan?._id,
                      artisanName: order.artisan?.name,
                      productId: order.items?.[0]?.product?._id
                    })} style={{
                      background: '#f59e0b', color: 'white', border: 'none',
                      padding: '10px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer'
                    }}>
                      ⭐ Leave Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
        }} onClick={() => setReviewModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 16, padding: 28, maxWidth: 460, width: '100%'
          }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, marginBottom: 6 }}>Leave a Review</h3>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>for {reviewModal.artisanName}</p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 8 }}>Rating</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setReviewForm(f => ({ ...f, rating: s }))} style={{
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: 28,
                    color: s <= reviewForm.rating ? '#f59e0b' : '#ddd'
                  }}>★</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 8 }}>Your Review</label>
              <textarea
                value={reviewForm.comment}
                onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                placeholder="Share your experience with this artisan..."
                rows={4}
                style={{ width: '100%', padding: 12, border: '1.5px solid #e8ddd5', borderRadius: 10, resize: 'vertical', fontFamily: 'inherit', fontSize: 14 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setReviewModal(null)} style={{
                flex: 1, padding: 12, border: '1.5px solid #ddd', borderRadius: 10,
                background: 'white', cursor: 'pointer', fontWeight: 600
              }}>Cancel</button>
              <button onClick={submitReview} disabled={submittingReview} style={{
                flex: 1, padding: 12, background: '#8B4513', color: 'white',
                border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer'
              }}>
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onReview }) {
  const [expanded, setExpanded] = useState(false);
  const s = order.orderStatus || 'pending';
  const colors = STATUS_COLORS[s] || { bg: '#eee', color: '#333' };
  const isDelivered = s === 'delivered';

  return (
    <div style={{ background: 'white', borderRadius: 12, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 15 }}>{order.orderId}</p>
          <p style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
            {order.artisan?.name} • {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            textTransform: 'capitalize', background: colors.bg, color: colors.color
          }}>
            {s === 'order ready' ? '🎁 Order Ready' : s}
          </span>
          <p style={{ fontWeight: 700, color: '#8B4513' }}>Rs. {order.totalAmount?.toLocaleString()}</p>
          <button onClick={() => setExpanded(!expanded)} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 18
          }}>{expanded ? '▲' : '▼'}</button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 20px 16px', borderTop: '1px solid #f5f5f5' }}>
          <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            {order.items?.map((item, i) => {
              const p = item.product;
              const img = p?.images?.[0]?.url;
              return (
                <div key={i} style={{ display: 'flex', gap: 10, padding: 10, background: '#fafafa', borderRadius: 10, alignItems: 'center' }}>
                  {img && <img src={img} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />}
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{p?.name || 'Product'}</p>
                    <p style={{ fontSize: 12, color: '#666' }}>Qty: {item.quantity} × Rs. {item.price?.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 12, padding: '10px 14px', background: '#f8f8f8', borderRadius: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Shipping to:</p>
            <p style={{ fontSize: 13, color: '#555' }}>
              {order.shippingAddress?.name}, {order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.state}
            </p>
          </div>

          {isDelivered && (
            <button onClick={() => onReview({
              orderId: order._id,
              artisanId: order.artisan?._id,
              artisanName: order.artisan?.name,
              productId: order.items?.[0]?.product?._id
            })} style={{
              marginTop: 12, padding: '10px 18px', background: '#f59e0b', color: 'white',
              border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14
            }}>
              ⭐ Leave a Review
            </button>
          )}
        </div>
      )}
    </div>
  );
}
