import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotif } from '../../context/NotifContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const STATUS_COLORS = {
  pending: { bg: '#fff3cd', color: '#856404', label: 'Pending' },
  confirmed: { bg: '#d1ecf1', color: '#0c5460', label: 'Confirmed' },
  processing: { bg: '#cce5ff', color: '#004085', label: 'Processing' },
  'order ready': { bg: '#d4edda', color: '#155724', label: 'Order Ready' },
  shipped: { bg: '#c3e6cb', color: '#155724', label: 'Shipped' },
  delivered: { bg: '#d4edda', color: '#155724', label: 'Delivered' },
  cancelled: { bg: '#f8d7da', color: '#721c24', label: 'Cancelled' }
};

export default function ArtisanDashboard() {
  const { user, token } = useAuth();
  const { addToast, addNotification } = useNotif();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', category: 'jewelry', stock: 1, materials: '', isCustomizable: false });
  const [addingProduct, setAddingProduct] = useState(false);

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch(`${API}/orders/artisan`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/products/my-products`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [ordersData, productsData] = await Promise.all([ordersRes.json(), productsRes.json()]);
      setOrders(ordersData.orders || []);
      setProducts(productsData.products || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [token]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        addToast(`Order status updated to: ${newStatus}`, 'success');
        // Notify the buyer
        addNotification({ message: `Order status changed to ${newStatus}` });
        fetchData();
      } else {
        addToast('Failed to update status', 'error');
      }
    } catch {
      addToast('Failed to update status', 'error');
    }
  };

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.description) {
      addToast('Please fill all required fields', 'error'); return;
    }
    setAddingProduct(true);
    try {
      const res = await fetch(`${API}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock),
          materials: newProduct.materials ? newProduct.materials.split(',').map(m => m.trim()) : []
        })
      });
      if (res.ok) {
        addToast('Product added successfully!', 'success');
        setShowAddProduct(false);
        setNewProduct({ name: '', description: '', price: '', category: 'jewelry', stock: 1, materials: '', isCustomizable: false });
        fetchData();
      } else {
        const d = await res.json();
        addToast(d.message || 'Failed to add product', 'error');
      }
    } catch {
      addToast('Failed to add product', 'error');
    } finally {
      setAddingProduct(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    await fetch(`${API}/products/${productId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    addToast('Product deleted', 'success');
    fetchData();
  };

  const pendingOrders = orders.filter(o => o.orderStatus === 'pending');
  const totalRevenue = orders.filter(o => o.orderStatus === 'delivered').reduce((s, o) => s + (o.totalAmount || 0), 0);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #8B4513, #D2691E)', borderRadius: 16, padding: 28, marginBottom: 28, color: 'white' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, marginBottom: 4 }}>
          Artisan Dashboard 🎨
        </h1>
        <p style={{ opacity: 0.85 }}>Welcome back, {user?.name}</p>
        <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
          <Stat label="Total Orders" value={orders.length} />
          <Stat label="Pending" value={pendingOrders.length} />
          <Stat label="Products" value={products.length} />
          <Stat label="Revenue" value={`Rs. ${totalRevenue.toLocaleString()}`} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #eee' }}>
        {[
          { id: 'orders', label: `Orders (${orders.length})` },
          { id: 'products', label: `Products (${products.length})` },
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

      {/* Orders tab */}
      {activeTab === 'orders' && (
        <div>
          {loading ? <LoadingState /> : orders.length === 0 ? (
            <EmptyState icon="📦" title="No orders yet" desc="Orders from buyers will appear here." />
          ) : (
            orders.map(order => (
              <ArtisanOrderCard key={order._id} order={order} onStatusChange={updateOrderStatus} />
            ))
          )}
        </div>
      )}

      {/* Products tab */}
      {activeTab === 'products' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button onClick={() => setShowAddProduct(true)} style={{
              background: '#8B4513', color: 'white', border: 'none',
              padding: '12px 24px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14
            }}>+ Add Product</button>
          </div>

          {loading ? <LoadingState /> : products.length === 0 ? (
            <EmptyState icon="🎨" title="No products yet" desc="Add your first product to start selling." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {products.map(p => (
                <ProductCard key={p._id} product={p} onDelete={() => deleteProduct(p._id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProduct && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
        }} onClick={() => setShowAddProduct(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 16, padding: 28, maxWidth: 520, width: '100%',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, marginBottom: 20 }}>Add New Product</h3>

            {[
              { key: 'name', label: 'Product Name *', placeholder: 'e.g. Handwoven Silk Scarf' },
              { key: 'price', label: 'Price (Rs.) *', placeholder: '0', type: 'number' },
              { key: 'stock', label: 'Stock Quantity', placeholder: '1', type: 'number' },
              { key: 'materials', label: 'Materials (comma-separated)', placeholder: 'silk, cotton, gold' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>{f.label}</label>
                <input
                  type={f.type || 'text'}
                  value={newProduct[f.key]}
                  onChange={e => setNewProduct(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e8ddd5', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
            ))}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>Category *</label>
              <select value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e8ddd5', borderRadius: 8, fontSize: 14, background: 'white' }}>
                {['jewelry', 'pottery', 'textiles', 'woodwork', 'metalwork', 'glass', 'other'].map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>Description *</label>
              <textarea
                value={newProduct.description}
                onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe your product..."
                rows={3}
                style={{ width: '100%', padding: 10, border: '1.5px solid #e8ddd5', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="customizable" checked={newProduct.isCustomizable}
                onChange={e => setNewProduct(p => ({ ...p, isCustomizable: e.target.checked }))} style={{ width: 'auto' }} />
              <label htmlFor="customizable" style={{ fontSize: 14, fontWeight: 600 }}>This product is customizable</label>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowAddProduct(false)} style={{
                flex: 1, padding: 12, border: '1.5px solid #ddd', borderRadius: 10,
                background: 'white', cursor: 'pointer', fontWeight: 600
              }}>Cancel</button>
              <button onClick={addProduct} disabled={addingProduct} style={{
                flex: 1, padding: 12, background: '#8B4513', color: 'white',
                border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer'
              }}>
                {addingProduct ? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ArtisanOrderCard({ order, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const s = order.orderStatus;
  const colors = STATUS_COLORS[s] || { bg: '#eee', color: '#333', label: s };

  const nextStatuses = {
    pending: ['processing', 'cancelled'],
    processing: ['order ready', 'cancelled'],
    'order ready': ['shipped'],
    shipped: ['delivered'],
    confirmed: ['processing'],
    delivered: [],
    cancelled: []
  };

  const available = nextStatuses[s] || [];

  return (
    <div style={{ background: 'white', borderRadius: 12, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 15 }}>{order.orderId}</p>
          <p style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
            Buyer: {order.buyer?.name} • {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: colors.bg, color: colors.color }}>
            {colors.label}
          </span>
          <p style={{ fontWeight: 700, color: '#8B4513' }}>Rs. {order.totalAmount?.toLocaleString()}</p>
          <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 20px 16px', borderTop: '1px solid #f5f5f5' }}>
          {/* Items */}
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            {order.items?.map((item, i) => {
              const p = item.product;
              return (
                <div key={i} style={{ padding: 10, background: '#fafafa', borderRadius: 8 }}>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{p?.name || 'Product'}</p>
                  <p style={{ fontSize: 12, color: '#666' }}>Qty: {item.quantity} × Rs. {item.price?.toLocaleString()}</p>
                </div>
              );
            })}
          </div>

          {/* Shipping */}
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#f8f8f8', borderRadius: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Ship to:</p>
            <p style={{ fontSize: 13, color: '#555' }}>
              {order.shippingAddress?.name}, {order.shippingAddress?.address}, {order.shippingAddress?.city}
            </p>
            <p style={{ fontSize: 13, color: '#555' }}>📞 {order.shippingAddress?.phone}</p>
          </div>

          {/* Status controls */}
          {available.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Update Status:</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {available.map(status => {
                  const c = STATUS_COLORS[status] || {};
                  return (
                    <button key={status} onClick={() => onStatusChange(order._id, status)} style={{
                      padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${c.color || '#333'}`,
                      background: 'white', color: c.color || '#333',
                      fontWeight: 700, cursor: 'pointer', fontSize: 13, textTransform: 'capitalize'
                    }}>
                      {status === 'processing' ? '⚙️ Mark Processing' :
                       status === 'order ready' ? '🎁 Mark Order Ready' :
                       status === 'shipped' ? '🚚 Mark Shipped' :
                       status === 'delivered' ? '✓ Mark Delivered' :
                       status === 'cancelled' ? '✗ Cancel Order' :
                       status}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product: p, onDelete }) {
  const img = p.images?.find(i => i.isPrimary)?.url || p.images?.[0]?.url;
  return (
    <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div style={{
        height: 160, background: img ? `url(${img}) center/cover` : '#f0e6dc',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
        position: 'relative'
      }}>
        {!img && '🏺'}
        {!p.isActive && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700
          }}>Inactive</div>
        )}
      </div>
      <div style={{ padding: 14 }}>
        <p style={{ fontSize: 11, color: '#8B4513', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{p.category}</p>
        <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{p.name}</h3>
        <p style={{ fontWeight: 700, color: '#8B4513', fontSize: 16, marginBottom: 6 }}>Rs. {p.price?.toLocaleString()}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#666' }}>Stock: {p.stock}</span>
          <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>🗑 Delete</button>
        </div>
      </div>
    </div>
  );
}

const Stat = ({ label, value }) => (
  <div>
    <p style={{ fontSize: 22, fontWeight: 700 }}>{value}</p>
    <p style={{ fontSize: 12, opacity: 0.8 }}>{label}</p>
  </div>
);
const LoadingState = () => <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Loading...</div>;
const EmptyState = ({ icon, title, desc }) => (
  <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 12 }}>
    <div style={{ fontSize: 60, marginBottom: 12 }}>{icon}</div>
    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, marginBottom: 8 }}>{title}</h3>
    <p style={{ color: '#666' }}>{desc}</p>
  </div>
);
