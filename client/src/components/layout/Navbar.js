import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotif } from '../../context/NotifContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { unreadCount, notifications, markRead, markAllRead } = useNotif();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'artisan') return '/artisan/dashboard';
    return '/buyer/dashboard';
  };

  return (
    <nav style={{
      background: 'white', borderBottom: '1px solid #e8ddd5',
      position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', height: 64, gap: 24 }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 28 }}>🏺</span>
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 22, color: '#8B4513' }}>MadioCraft</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 20, flex: 1 }}>
          <Link to="/products" style={{ textDecoration: 'none', color: '#444', fontWeight: 500, fontSize: 14 }}>Products</Link>
          <Link to="/artisans" style={{ textDecoration: 'none', color: '#444', fontWeight: 500, fontSize: 14 }}>Artisans</Link>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user ? (
            <>
              {/* Notifications */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowNotifs(!showNotifs)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, position: 'relative'
                }}>
                  🔔
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -4, right: -4,
                      background: '#e53935', color: 'white', borderRadius: '50%',
                      width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>
                {showNotifs && (
                  <div style={{
                    position: 'absolute', right: 0, top: 40, width: 320, background: 'white',
                    borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', overflow: 'hidden'
                  }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 14 }}>Notifications</strong>
                      {unreadCount > 0 && <button onClick={markAllRead} style={{ fontSize: 12, color: '#8B4513', background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>}
                    </div>
                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <p style={{ padding: 16, textAlign: 'center', color: '#999', fontSize: 13 }}>No notifications</p>
                      ) : notifications.map(n => (
                        <div key={n.id} onClick={() => markRead(n.id)} style={{
                          padding: '10px 16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer',
                          background: n.read ? 'white' : '#FFF8F0'
                        }}>
                          <p style={{ fontSize: 13, fontWeight: n.read ? 400 : 600 }}>{n.message}</p>
                          <p style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{new Date(n.id).toLocaleTimeString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Cart (buyers only) */}
              {user.role === 'buyer' && (
                <Link to="/cart" style={{ position: 'relative', textDecoration: 'none', fontSize: 20 }}>
                  🛒
                  {cartCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -4, right: -4,
                      background: '#8B4513', color: 'white', borderRadius: '50%',
                      width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>{cartCount}</span>
                  )}
                </Link>
              )}

              {/* User menu */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowMenu(!showMenu)} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'none', border: '1.5px solid #e8ddd5', borderRadius: 8,
                  padding: '6px 12px', cursor: 'pointer'
                }}>
                  <span style={{ fontSize: 18 }}>👤</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{user.name?.split(' ')[0]}</span>
                  <span style={{ fontSize: 10, color: '#999' }}>▼</span>
                </button>
                {showMenu && (
                  <div style={{
                    position: 'absolute', right: 0, top: 44, width: 200, background: 'white',
                    borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden'
                  }}>
                    <Link to={getDashboardLink()} onClick={() => setShowMenu(false)} style={{
                      display: 'block', padding: '10px 16px', textDecoration: 'none', color: '#333', fontSize: 14
                    }}>📊 Dashboard</Link>
                    <div style={{ height: 1, background: '#eee' }} />
                    <button onClick={handleLogout} style={{
                      width: '100%', padding: '10px 16px', background: 'none', border: 'none',
                      textAlign: 'left', cursor: 'pointer', fontSize: 14, color: '#c62828'
                    }}>🚪 Logout</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" style={{ textDecoration: 'none', color: '#8B4513', fontWeight: 600, fontSize: 14 }}>Login</Link>
              <Link to="/register" style={{
                textDecoration: 'none', background: '#8B4513', color: 'white',
                padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 14
              }}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
