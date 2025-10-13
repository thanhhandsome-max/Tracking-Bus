const app = require('./app');
const http = require('http');
const socketIo = require('socket.io');

// Import configurations
// const dbConfig = require('./config/db');
// const firebaseConfig = require('./config/firebase');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Join bus tracking room
  socket.on('join-bus-tracking', (busId) => {
    socket.join(`bus-${busId}`);
    console.log(`Socket ${socket.id} joined bus-${busId}`);
  });
  
  // Leave bus tracking room
  socket.on('leave-bus-tracking', (busId) => {
    socket.leave(`bus-${busId}`);
    console.log(`Socket ${socket.id} left bus-${busId}`);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to other modules
app.set('io', io);

// Start server
server.listen(PORT, () => {
  console.log(`🚌 Smart School Bus Tracking System API running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for real-time tracking`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
