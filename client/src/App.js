// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Dashboard from './pages/Dashboard';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Artisans from './pages/Artisans';
import Categories from './pages/Categories';
import AdminDashboard from './pages/AdminDashboard';
import ArtisanDetail from './pages/ArtisanDetail'; 
import Chat from './pages/Chat';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar user={user} setUser={setUser} />
        <main className="flex-grow pt-20"> {/* Add padding-top for fixed navbar */}
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/artisans" element={<Artisans />} />
            <Route path="/artisans/:id" element={<ArtisanDetail />} />
            <Route path="/categories" element={<Categories />} />
            
            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/cart" 
              element={user ? <Cart /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/checkout" 
              element={user ? <Checkout /> : <Navigate to="/login" />} 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin/*" 
              element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} 
            />
            <Route path="/chat/:roomId" element={<Chat />} />
          </Routes>
        </main>
        <Footer />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
              padding: '16px 24px',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;