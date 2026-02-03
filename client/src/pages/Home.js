import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data.products || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="hero">
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            Handcrafted Treasures
          </h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
            Discover unique handmade products from skilled artisans.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => navigate('/products')}
              className="btn btn-primary"
            >
              Shop Now
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="btn btn-secondary"
              style={{ borderColor: 'white', color: 'white' }}
            >
              Become an Artisan
            </button>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <section>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.8rem', color: '#5D4037' }}>
            Featured Products
          </h2>
          <button 
            onClick={() => navigate('/products')}
            style={{ 
              color: '#8B4513', 
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            View All →
          </button>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{
              display: 'inline-block',
              width: '3rem',
              height: '3rem',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #8B4513',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ marginTop: '1rem', color: '#666' }}>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            No products available yet.
          </div>
        ) : (
          <div className="product-grid">
            {products.slice(0, 6).map(product => (
              <div key={product._id} className="product-card">
                <img
                  src={product.images?.[0]?.url || 'https://via.placeholder.com/400x300?text=Product+Image'}
                  alt={product.name}
                  className="product-image"
                />
                <div className="product-info">
                  <h3 style={{ 
                    fontSize: '1.2rem', 
                    color: '#5D4037',
                    marginBottom: '0.5rem'
                  }}>
                    {product.name}
                  </h3>
                  <p style={{ 
                    color: '#666',
                    fontSize: '0.9rem',
                    marginBottom: '1rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {product.description}
                  </p>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      fontSize: '1.3rem', 
                      fontWeight: 'bold',
                      color: '#8B4513'
                    }}>
                      ₹{product.price}
                    </span>
                    <button 
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;