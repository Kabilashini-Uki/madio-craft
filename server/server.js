const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Atlas connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'MadioCraft API is running' });
});

// WebSocket for real-time chat
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on('send-message', ({ roomId, message, sender }) => {
    io.to(roomId).emit('receive-message', { message, sender, timestamp: new Date() });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Import routes (make sure these files exist)
try {
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/users', require('./routes/userRoutes'));
  app.use('/api/products', require('./routes/productRoutes'));
  app.use('/api/orders', require('./routes/orderRoutes'));
  app.use('/api/chat', require('./routes/chatRoutes'));
  app.use('/api/payment', require('./routes/paymentRoutes'));
  app.use('/api/admin', require('./routes/adminRoutes'));
  console.log('All routes loaded successfully');
} catch (error) {
  console.error('Error loading routes:', error.message);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

// WebSocket for real-time chat
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join a specific room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  // Leave a room
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room: ${roomId}`);
  });

  // Send message to specific room
  socket.on('send-message', ({ roomId, message, sender }) => {
    console.log(`Message in room ${roomId}:`, message);
    
    // Broadcast to everyone in the room except sender
    socket.to(roomId).emit('receive-message', { 
      roomId, 
      message, 
      sender, 
      timestamp: new Date() 
    });
    
    // Also emit to sender for consistency
    socket.emit('receive-message', { 
      roomId, 
      message, 
      sender, 
      timestamp: new Date() 
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});