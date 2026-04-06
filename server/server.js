// server.js
// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import artisanRoutes from './routes/artisanRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/admin.js';
import cartRoutes from './routes/cartRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Import error handlers
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging disabled — only MongoDB/Socket messages shown in terminal

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/artisans', artisanRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Test endpoint for API connectivity
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(` New Socket Connection: ${socket.id}`);

  socket.on('register-user', (userId) => {
    if (userId) socket.join(`user-${userId}`);
  });

  socket.on('join-room', (roomId) => {
    if (roomId) socket.join(String(roomId));
  });

  socket.on('leave-room', (roomId) => {
    if (roomId) socket.leave(String(roomId));
  });

  socket.on('typing', ({ roomId, isTyping }) => {
    socket.to(String(roomId)).emit('user-typing', { roomId, isTyping, userId: socket.id });
  });

  socket.on('user-online', ({ userId, online }) => {
    if (userId) socket.broadcast.emit('user-online', { userId, online });
  });

  socket.on('disconnect', () => {
    console.log(` Socket Disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Global error handlers for uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error(' Uncaught Exception:', error);
  process.exit(1);
});

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handmade';
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

// Handle EADDRINUSE: kill blocking process and retry once
httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`  Port ${PORT} is in use. Attempting to free it...`);
    import('child_process').then(({ execSync }) => {
      try {
        execSync(`fuser -k ${PORT}/tcp`, { stdio: 'ignore' });
        console.log(`Killed process on port ${PORT}. Retrying...`);
        setTimeout(() => {
          httpServer.listen(PORT, () => {
            console.log(` Server running on http://localhost:${PORT}/api`);
          });
        }, 1000);
      } catch {
        console.error(` Could not free port ${PORT}. Please manually run: fuser -k ${PORT}/tcp`);
        process.exit(1);
      }
    });
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(` MADIO CRAFT is running on ${PORT}`);
  });
});

export default app;