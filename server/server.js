// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

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

//database connection
connectDB();

//express app setup
const app = express();
const httpServer = createServer(app);

// ─── Socket.IO ───────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST'] },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Handle both 'join-user' (legacy) and 'register-user' (current client)
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined room via join-user`);
  });

  socket.on('register-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} registered to notification room`);
  });

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('send-message', async (data) => {
    io.to(data.roomId).emit('receive-message', data);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

//middleware
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

//api routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/artisans', artisanRoutes);

//error handling
app.use(notFound);
app.use(errorHandler);

//start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

export default app;
