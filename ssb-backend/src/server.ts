// Smart School Bus Tracking System - Backend Server
// File này khởi tạo server Express và Socket.IO

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { verifyWsJWT } from './middlewares/socketAuth.js'; 

// Import app từ file app.js
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 3001;

// Tạo HTTP server từ Express app
const server = http.createServer(app);

// Khởi tạo Socket.IO với CORS để frontend có thể kết nối
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*", // Cho phép frontend kết nối
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

// Gắn Socket.IO vào app để các route có thể sử dụng
app.set("io", io);


io.use(verifyWsJWT);
// Xử lý kết nối Socket.IO
io.on("connection", (socket) => {
  console.log("✅ Client đã kết nối:", socket.id);

  // Client muốn theo dõi một xe bus cụ thể
  socket.on("join-bus-room", (busId) => {
    socket.join(`bus-${busId}`);
    console.log(`Socket ${socket.id} đã tham gia phòng theo dõi bus-${busId}`);
    // Xác nhận cho client
    socket.emit("joined-bus-room", { busId, status: "joined" });
  });

  // Client ngắt kết nối
  socket.on("disconnect", () => {
    console.log("❌ Client đã ngắt kết nối:", socket.id);
  });
});

// Khởi động server
server.listen(PORT, () => {
  console.log(
    `🚌 Smart School Bus Tracking System API đang chạy trên port ${PORT}`
  );
  console.log("📡 Socket.IO server sẵn sàng cho real-time tracking");
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(
    `🔐 CORS Frontend URL: ${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }`
  );
});
