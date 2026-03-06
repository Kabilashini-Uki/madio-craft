// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import { SecureChatProvider } from './context/SecureChatContext';
import { ChatProvider } from './context/ChatContext';
import { SocketProvider } from './context/SocketContext';
import { NotifProvider } from './context/NotifContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
        <NotifProvider>
          <CartProvider>
            <OrderProvider>
              <SecureChatProvider>
                <ChatProvider>
                  <App />
                </ChatProvider>
              </SecureChatProvider>
            </OrderProvider>
          </CartProvider>
        </NotifProvider>
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>
);