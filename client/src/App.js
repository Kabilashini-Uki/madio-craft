// App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import BuyerDashboard from './pages/BuyerDashboard';
import ArtisanDashboard from './pages/ArtisanDashboard';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Artisans from './pages/Artisans';
import AllArtisans from './pages/AllArtisans';
import Categories from './pages/Categories';
import AllCategories from './pages/AllCategories';
import AdminDashboard from './pages/AdminDashboard';
import ArtisanDetail from './pages/ArtisanDetail';
import ArtisanShop from './pages/ArtisanShop';
import Chat from './pages/Chat';
import OrderTracking from './pages/OrderTracking';

import { useAuth } from './context/AuthContext';

const NO_LAYOUT_PATHS = ['/login', '/register', '/artisan-dashboard', '/artisan/dashboard', '/buyer/dashboard', '/buyer-dashboard', '/admin', '/dashboard'];

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  // Use activeRole (for role-switched users) when checking access
  const effectiveRole = user.activeRole || user.role;
  if (requiredRole && effectiveRole !== requiredRole) return <Navigate to="/" replace />;
  return children;
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  // Support role switching: use activeRole when present
  const activeRole = user.activeRole || user.role;
  if (activeRole === 'admin') return <Navigate to="/admin" replace />;
  if (activeRole === 'artisan') return <Navigate to="/artisan-dashboard" replace />;
  return <BuyerDashboard />;
};

const AppLayout = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const hideLayout = NO_LAYOUT_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

  useEffect(() => {
    // Issue 18: logout on every fresh app start (npm start / page reload)
    const isFirstLoad = !sessionStorage.getItem('app_session_started');
    if (isFirstLoad) {
      sessionStorage.setItem('app_session_started', 'true');
      logout(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!hideLayout && <Navbar />}
      <main className={`flex-grow ${!hideLayout ? 'pt-20' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/artisans" element={<Artisans />} />
          <Route path="/artisans/all" element={<AllArtisans />} />
          <Route path="/artisans/:id" element={<ArtisanDetail />} />
          <Route path="/artisans/:id/shop" element={<ArtisanShop />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/categories/all" element={<AllCategories />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
          <Route path="/buyer/dashboard" element={<ProtectedRoute requiredRole="buyer"><BuyerDashboard /></ProtectedRoute>} />
          <Route path="/buyer-dashboard" element={<ProtectedRoute requiredRole="buyer"><BuyerDashboard /></ProtectedRoute>} />
          <Route path="/artisan/dashboard" element={<ProtectedRoute requiredRole="artisan"><ArtisanDashboard /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/order-confirmation/:id" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
          <Route path="/order-tracking/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
          <Route path="/artisan-dashboard" element={<ProtectedRoute><ArtisanDashboard /></ProtectedRoute>} />
          <Route path="/chat/:roomId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/admin/*" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
                <a href="/" className="text-primary hover:underline">Go Home</a>
              </div>
            </div>
          } />
        </Routes>
      </main>
      {!hideLayout && <Footer />}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1f2937',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            padding: '16px 24px',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
