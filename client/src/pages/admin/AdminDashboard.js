import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotif } from '../../context/NotifContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function AdminDashboard() {
  const { token } = useAuth();
  const { addToast } = useNotif();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');

  const adminFetch = (url, opts = {}) => fetch(`${API}${url}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers }
  });

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, uRes, pRes, oRes] = await Promise.all([
        adminFetch('/admin/stats'),
        adminFetch('/admin/users'),
        adminFetch('/admin/products'),
        adminFetch('/admin/orders')
      ]);
      const [sData, uData, pData, oData] = await Promise.all([sRes.json(), uRes.json(), pRes.json(), oRes.json()]);
      setStats(sData.stats);
      setUsers(uData.users || []);
      setProducts(pData.products || []);
      setOrders(oData.orders || []);
    } catch {}
    setLoading(false);
  };

  const verifyArtisan = async (id) => {
    await adminFetch(`/admin/users/${id}/verify`, { method: 'PUT' });
    addToast('Artisan verified!', 'success');
    loadData();
  };

  const suspendUser = async (id) => {
    await adminFetch(`/admin/users/${id}/suspend`, { method: 'PUT' });
    addToast('User status updated', 'success');
    loadData();
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    await adminFetch(`/admin/users/${id}`, { method: 'DELETE' });
    addToast('User deleted', 'success');
    loadData();
  };

  const toggleProduct = async (id, isActive) => {
    await adminFetch(`/admin/products/${id}/status`, { method: 'PUT', body: JSON.stringify({ isActive: !isActive }) });
    addToast('Product status updated', 'success');
    loadData();
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await adminFetch(`/admin/products/${id}`, { method: 'DELETE' });
    addToast('Product deleted', 'success');
    loadData();
  };

  const filteredUsers = filterRole === 'all' ? users : users.filter(u => u.role === filterRole);
  const artisans = users.filter(u => u.role === 'artisan');
  const buyers = users.filter(u => u.role === 'buyer');

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'artisans', label: `🎨 Artisans (${artisans.length})` },
    { id: 'buyers', label: `🛍️ Buyers (${buyers.length})` },
    { id: 'products', label: `📦 Products (${products.length})` },
    { id: 'orders', label: `🧾 Orders (${orders.length})` },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', borderRadius: 16, padding: 28, marginBottom: 28, color: 'white' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, marginBottom: 4 }}>
          🛡️ Admin Dashboard
        </h1>
        <p style={{ opacity: 0.7, fontSize: 14 }}>MadioCraft Platform Control Center</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '2px solid #eee', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap',
            color: activeTab === t.id ? '#8B4513' : '#666',
            borderBottom: activeTab === t.id ? '2px solid #8B4513' : '2px solid transparent',
            marginBottom: -2
          }}>{t.label}</button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Loading...</div>}

      {/* Overview */}
      {!loading && activeTab === 'overview' && stats && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
            <StatCard icon="👥" label="Total Users" value={stats.users?.total || 0} sub={`${stats.users?.artisans || 0} artisans, ${stats.users?.buyers || 0} buyers`} color="#8B4513" />
            <StatCard icon="📦" label="Products" value={stats.products?.total || 0} sub={`${stats.products?.active || 0} active`} color="#2d6a4f" />
            <StatCard icon="🧾" label="Orders" value={stats.orders?.total || 0} sub={`${stats.orders?.pending || 0} pending`} color="#0c5460" />
            <StatCard icon="💰" label="Revenue" value={`Rs. ${(stats.orders?.revenue || 0).toLocaleString()}`} sub="All time" color="#856404" />
          </div>

          {/* Recent orders */}
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, marginBottom: 16 }}>Recent Orders</h3>
          <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  {['Order ID', 'Buyer', 'Artisan', 'Total', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#555' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map(o => (
                  <tr key={o._id} style={{ borderTop: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{o.orderId}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>{o.buyer?.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>{o.artisan?.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>Rs. {o.totalAmount?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        textTransform: 'capitalize',
                        background: o.orderStatus === 'delivered' ? '#d4edda' : o.orderStatus === 'pending' ? '#fff3cd' : '#d1ecf1',
                        color: o.orderStatus === 'delivered' ? '#155724' : o.orderStatus === 'pending' ? '#856404' : '#0c5460',
                      }}>{o.orderStatus}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#666' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Artisans */}
      {!loading && activeTab === 'artisans' && (
        <div>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, marginBottom: 20 }}>Artisan Management</h3>
          <div style={{ display: 'grid', gap: 14 }}>
            {artisans.map(u => (
              <div key={u._id} style={{ background: 'white', borderRadius: 12, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', background: '#8B4513',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: 18
                  }}>{u.name?.[0]}</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{u.name}</p>
                    <p style={{ fontSize: 13, color: '#666' }}>{u.email}</p>
                    <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Business: {u.artisanProfile?.businessName || 'N/A'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {u.isVerified ? (
                    <span style={{ background: '#d4edda', color: '#155724', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✓ Verified</span>
                  ) : (
                    <button onClick={() => verifyArtisan(u._id)} style={{
                      padding: '6px 14px', background: '#2d6a4f', color: 'white',
                      border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12
                    }}>✓ Verify</button>
                  )}
                  {u.isSuspended ? (
                    <button onClick={() => suspendUser(u._id)} style={{
                      padding: '6px 14px', background: '#2d6a4f', color: 'white',
                      border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12
                    }}>Unsuspend</button>
                  ) : (
                    <button onClick={() => suspendUser(u._id)} style={{
                      padding: '6px 14px', background: '#856404', color: 'white',
                      border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12
                    }}>Suspend</button>
                  )}
                  <button onClick={() => deleteUser(u._id)} style={{
                    padding: '6px 14px', background: '#c62828', color: 'white',
                    border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12
                  }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buyers */}
      {!loading && activeTab === 'buyers' && (
        <div>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, marginBottom: 20 }}>Buyer Management</h3>
          <div style={{ display: 'grid', gap: 14 }}>
            {buyers.map(u => (
              <div key={u._id} style={{ background: 'white', borderRadius: 12, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', background: '#D2691E',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: 18
                  }}>{u.name?.[0]}</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{u.name}</p>
                    <p style={{ fontSize: 13, color: '#666' }}>{u.email}</p>
                    <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Joined: {new Date(u.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {u.isSuspended && <span style={{ background: '#f8d7da', color: '#721c24', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>Suspended</span>}
                  <button onClick={() => suspendUser(u._id)} style={{
                    padding: '6px 14px', background: u.isSuspended ? '#2d6a4f' : '#856404', color: 'white',
                    border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12
                  }}>{u.isSuspended ? 'Unsuspend' : 'Suspend'}</button>
                  <button onClick={() => deleteUser(u._id)} style={{
                    padding: '6px 14px', background: '#c62828', color: 'white',
                    border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12
                  }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      {!loading && activeTab === 'products' && (
        <div>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, marginBottom: 20 }}>Product Management</h3>
          <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  {['Product', 'Artisan', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#555' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id} style={{ borderTop: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</p>
                      <p style={{ fontSize: 12, color: '#666' }}>{p.category}</p>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>{p.artisan?.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>Rs. {p.price?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>{p.stock}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: p.isActive ? '#d4edda' : '#f8d7da',
                        color: p.isActive ? '#155724' : '#721c24'
                      }}>{p.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => toggleProduct(p._id, p.isActive)} style={{
                          padding: '5px 10px', border: 'none', borderRadius: 6,
                          background: p.isActive ? '#856404' : '#2d6a4f', color: 'white',
                          cursor: 'pointer', fontSize: 11, fontWeight: 600
                        }}>{p.isActive ? 'Deactivate' : 'Activate'}</button>
                        <button onClick={() => deleteProduct(p._id)} style={{
                          padding: '5px 10px', border: 'none', borderRadius: 6,
                          background: '#c62828', color: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 600
                        }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders */}
      {!loading && activeTab === 'orders' && (
        <div>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, marginBottom: 20 }}>Order Management</h3>
          <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  {['Order ID', 'Buyer', 'Artisan', 'Items', 'Total', 'Payment', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#555' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id} style={{ borderTop: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700 }}>{o.orderId}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12 }}>{o.buyer?.name}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12 }}>{o.artisan?.name}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12 }}>{o.items?.length}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600 }}>Rs. {o.totalAmount?.toLocaleString()}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12 }}>{o.paymentMethod?.toUpperCase()}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        textTransform: 'capitalize',
                        background: o.orderStatus === 'delivered' ? '#d4edda' : o.orderStatus === 'pending' ? '#fff3cd' : '#d1ecf1',
                        color: o.orderStatus === 'delivered' ? '#155724' : o.orderStatus === 'pending' ? '#856404' : '#0c5460'
                      }}>{o.orderStatus}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: '#666' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{
      background: 'white', borderRadius: 12, padding: 20,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${color}`
    }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <p style={{ fontWeight: 800, fontSize: 28, color }}>{value}</p>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#333', marginTop: 2 }}>{label}</p>
      {sub && <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{sub}</p>}
    </div>
  );
}
