// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Ensure uploads directory exists on startup
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/userRoutes.js';
import artisanRoutes from './routes/artisanRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

// ─── App & HTTP server ────────────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

// ─── CORS origins ─────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

// ─── Socket.IO ───────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join-user', (userId) => {
    if (!userId) return;
    socket.join(`user-${userId}`);
    socket.data.userId = userId;
    console.log(`User ${userId} joined room via join-user`);
  });

  socket.on('register-user', (userId) => {
    if (!userId) return;
    socket.join(`user-${userId}`);
    socket.data.userId = userId;
    console.log(`User ${userId} joined notification room`);
  });

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('send-message', async (data) => {
    io.to(data.roomId).emit('receive-message', data);
  });

  socket.on('typing', ({ roomId, isTyping, userId }) => {
    socket.to(roomId).emit('user-typing', { roomId, isTyping, userId });
  });

  socket.on('message-read', ({ roomId, readBy }) => {
    socket.to(roomId).emit('messages-read', { roomId, readBy });
  });

  socket.on('user-online', ({ userId, online }) => {
    socket.broadcast.emit('user-online', { userId, online });
    if (online && userId) socket.data.userId = userId;
  });

  socket.on('chat-request-response', (data) => {
    const { buyerId, artisanId, artisanName, roomId, available, status } = data;
    if (!buyerId) return;
    io.to(`user-${buyerId}`).emit('customization-response', {
      requestId:   roomId,
      productId:   null,
      productName: 'your message',
      artisan: { id: artisanId, name: artisanName || 'The artisan' },
      available,
      status:    status || (available ? 'accepted' : 'rejected'),
      timestamp: new Date(),
      roomId,
      isChatRequest: true,
    });
  });

  socket.on('message-custom-request', (data) => {
    const { artisanId, buyerName, buyerId, message, roomId } = data;
    if (!artisanId) return;
    io.to(`user-${artisanId}`).emit('customization-request', {
      requestId:  roomId,
      sender: { id: buyerId, name: buyerName || 'A buyer', avatar: '' },
      product: { id: '', name: 'Custom Message', image: '' },
      message, color: '', size: '', notes: message,
      timestamp: new Date(),
      status:    'pending',
      isChatRequest: true,
      roomId,
    });
  });

  socket.on('disconnect', () => {
    if (socket.data.userId) {
      socket.broadcast.emit('user-online', { userId: socket.data.userId, online: false });
    }
    console.log('Socket disconnected:', socket.id);
  });
});

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`CORS blocked origin: ${origin} — allowed: ${allowedOrigins}`);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Serve uploaded images statically ────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/artisans', artisanRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
});

export default app;