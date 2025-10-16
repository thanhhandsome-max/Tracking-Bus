// // // --- server.js ---

// const express = require('express');
// const http = require('http');
// const { Server } = require("socket.io"); // Import Server từ socket.io
// const cors = require('cors');

// const app = express();
// // Tạo một server HTTP chuẩn từ app Express. Socket.IO sẽ gắn vào đây.
// const server = http.createServer(app);

// // Khởi tạo Socket.IO và cho phép CORS để Frontend có thể kết nối
// const io = new Server(server, {
//     cors: {
//         origin: "*", // Cho phép mọi nguồn kết nối
//     }
// });
// const port = 3001;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Kho dữ liệu giả lập (để code chạy được)
// const mockData = {
//     buses: new Map([['bus01', { id: 'bus01' }]]),
//     schedules: new Map([['sched01', { id: 'sched01', busId: 'bus01' }]]),
// };

// // CẢI TIẾN QUAN TRỌNG: Gắn 'io' vào đối tượng 'app'
// // Việc này giúp chúng ta có thể truy cập 'io' từ các file route khác thông qua req.app.get('io')
// app.set('io', io);

// // Truyền dữ liệu giả vào các request để các file route có thể sử dụng
// app.use((req, res, next) => {
//     req.mockData = mockData;
//     next();
// });

// // Import và sử dụng các routes
// const busRoutes = require('./routes/api/buses');
// const scheduleRoutes = require('./routes/api/schedules');

// app.use('/api/buses', busRoutes);
// app.use('/api/schedules', scheduleRoutes);

// // Xử lý các kết nối mới từ client đến Socket.IO
// io.on('connection', (socket) => {
//     console.log('✅ Một client đã kết nối qua Socket.IO:', socket.id);

//     // Lắng nghe sự kiện khi client muốn tham gia "phòng" theo dõi một xe bus cụ thể
//     socket.on('join-bus-room', (busId) => {
//         socket.join(`bus-${busId}`); // Cho socket này vào một phòng riêng
//         console.log(`Socket ${socket.id} đã tham gia phòng theo dõi bus-${busId}`);
//     });

//     socket.on('disconnect', () => {
//         console.log('❌ Client đã ngắt kết nối:', socket.id);
//     });
// });

// // Dùng 'server.listen' thay vì 'app.listen' để cả Express và Socket.IO cùng chạy
// server.listen(port, () => {
//     console.log(`🚀 Backend server (API & Socket.IO) đang chạy tại http://localhost:${port}`);
// });
// --- server.js ---

const app = require("./app");
const http = require("http");
const socketIo = require("socket.io");

const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with proper CORS for Vite dev
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Khi client gửi join-bus-tracking
  socket.on("join-bus-tracking", (busId) => {
    socket.join(`bus-${busId}`);
    console.log(`Socket ${socket.id} joined bus-${busId}`);
    // Emit lại cho chính client này
    socket.emit("joined-bus-tracking", { busId, status: "joined" });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Expose io to routes via app
app.set("io", io);

// Start server
server.listen(PORT, () => {
  console.log(
    `🚌 Smart School Bus Tracking System API running on port ${PORT}`
  );
  console.log("📡 Socket.IO server ready for real-time tracking");
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(
    `🔐 CORS FRONTEND_URL: ${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }`
  );
});
