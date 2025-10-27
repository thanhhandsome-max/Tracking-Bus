import express from "express";
import { Server as SocketIOServer } from "socket.io";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import { createServer } from "http";

import config from "./config/env.js";
import {
  corsMiddleware,
  corsHandler,
  securityHeaders,
  rateLimitHeaders,
} from "./middlewares/cors.js";
import {
  errorHandler,
  notFoundHandler,
  successResponse,
} from "./middlewares/error.js";
import { API_PREFIX } from "./constants/http.js";
import { SOCKET_EVENTS } from "./constants/realtime.js";
import authRoutes from "./routes/api/auth.route.js";
import busRoutes from "./routes/bus.route.js";
import tripRoutes from "./routes/api/trip.route.js";

import { verifyWsJWT } from "./middlewares/socketAuth.js";

// Create Express app
const app = express();

// Trust proxy for rate limiting
app.set("trust proxy", 1);

// Logging middleware (morgan) - should be first
if (config.nodeEnv === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS middleware
app.use(corsMiddleware);
app.use(corsHandler);

// Security headers
app.use(securityHeaders);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests from this IP, please try again later.",
    });
  },
});

app.use(limiter);
app.use(rateLimitHeaders);

// Compression middleware
app.use(compression());

// Body parsing middleware (express.json) - should be before routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get(`${API_PREFIX}/health`, (_req, res) => {
  const healthData = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: process.env["npm_package_version"] || "1.0.0",
    services: {
      database: "up", // TODO: Add actual database health check
      redis: "up", // TODO: Add actual Redis health check
      socketio: "up",
    },
  };

  return successResponse(res, healthData);
});

// Detailed health check endpoint
app.get(`${API_PREFIX}/health/detailed`, async (_req, res) => {
  try {
    const healthData = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      version: process.env["npm_package_version"] || "1.0.0",
      memory: {
        used: process.memoryUsage(),
        free: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
      },
      services: {
        database: await checkDatabaseHealth(),
        redis: await checkRedisHealth(),
        socketio: "up",
      },
    };

    return successResponse(res, healthData);
  } catch (error) {
    return res.status(503).json({
      success: false,
      code: "SERVICE_UNAVAILABLE",
      message: "Health check failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Database health check
async function checkDatabaseHealth(): Promise<string> {
  try {
    // TODO: Implement actual database health check
    // const connection = await pool.getConnection();
    // await connection.ping();
    // connection.release();
    return "up";
  } catch (error) {
    return "down";
  }
}

// Redis health check
async function checkRedisHealth(): Promise<string> {
  try {
    // TODO: Implement actual Redis health check
    // await redisClient.ping();
    return "up";
  } catch (error) {
    return "down";
  }
}

// API Routes
app.use(`${API_PREFIX}/auth`, authRoutes);

// app.use(`${API_PREFIX}/buses`, (_req, res) => {
//   res.json({
//     success: true,
//     message: 'Bus routes will be implemented in Day 2',
//     data: {
//       availableEndpoints: [
//         'GET /buses',
//         'POST /buses',
//         'GET /buses/:id',
//         'PUT /buses/:id',
//         'DELETE /buses/:id',
//         'POST /buses/:id/position',
//       ],
//     },
//   });
// });

app.use(`${API_PREFIX}/trips`, tripRoutes);

// app.use(`${API_PREFIX}/reports`, (_req, res) => {
//   res.json({
//     success: true,
//     message: 'Report routes will be implemented in Day 2',
//     data: {
//       availableEndpoints: [
//         'GET /reports/buses/stats',
//         'GET /reports/trips/stats',
//         'GET /reports/students/stats',
//       ],
//     },
//   });
// });

app.use(`${API_PREFIX}/reports/buses`, busRoutes);
app.use(`${API_PREFIX}/reports/trips`, tripRoutes);

app.use(`${API_PREFIX}/drivers`, (_req, res) => {
  res.json({
    success: true,
    message: "Driver routes will be implemented in Day 2",
    data: {
      availableEndpoints: [
        "GET /drivers",
        "POST /drivers",
        "GET /drivers/:id",
        "PUT /drivers/:id",
        "DELETE /drivers/:id",
      ],
    },
  });
});

app.use(`${API_PREFIX}/routes`, (_req, res) => {
  res.json({
    success: true,
    message: "Route routes will be implemented in Day 2",
    data: {
      availableEndpoints: [
        "GET /routes",
        "POST /routes",
        "GET /routes/:id",
        "PUT /routes/:id",
        "DELETE /routes/:id",
        "GET /routes/:id/stops",
      ],
    },
  });
});

app.use(`${API_PREFIX}/schedules`, (_req, res) => {
  res.json({
    success: true,
    message: "Schedule routes will be implemented in Day 2",
    data: {
      availableEndpoints: [
        "GET /schedules",
        "POST /schedules",
        "GET /schedules/:id",
        "PUT /schedules/:id",
        "DELETE /schedules/:id",
      ],
    },
  });
});

// 404 handler for API routes (catch-all middleware for Express 5)
app.use(`${API_PREFIX}`, (req, res, next) => {
  // If no route was matched, return 404
  notFoundHandler(req, res);
});

// Root endpoint
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "SSB 1.0 Backend API",
    data: {
      version: "1.0.0",
      environment: config.nodeEnv,
      apiPrefix: API_PREFIX,
      healthCheck: `${API_PREFIX}/health`,
      documentation: "docs/openapi.yaml",
    },
  });
});

// Create HTTP server
const server = createServer(app);

// Create Socket.IO server
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// // Socket.IO authentication middleware
// io.use((_socket, next) => {
//   // TODO: Implement JWT authentication for Socket.IO
//   // For now, allow all connections
//   next();
// });

// // Socket.IO connection handling
// io.on(SOCKET_EVENTS.CONNECTION, (socket: any) => {
//   console.log(`✅ Socket connected: ${socket.id}`);

// // Handle room joining
// socket.on(SOCKET_EVENTS.JOIN_ROOM, (roomName: any) => {
//   socket.join(roomName);
//   socket.emit(SOCKET_EVENTS.JOINED_ROOM, { room: roomName });
//   console.log(`📱 Socket ${socket.id} joined room: ${roomName}`);
// });

io.use(verifyWsJWT); // <-- THAY THẾ code cũ

// Socket.IO connection handling
io.on(SOCKET_EVENTS.CONNECTION, (socket: any) => {
  console.log(
    `✅ Socket connected: ${socket.id} (User: ${socket.data.user.id}, Role: ${socket.data.user.role})`
  );

  // Handle room joining
  socket.on(SOCKET_EVENTS.JOIN_ROOM, (roomName: any) => {
    // === BỔ SUNG RBAC (KIỂM TRA QUYỀN) === [cite: 43, 79]
    const user = socket.data.user;

    // Ví dụ kiểm tra quyền (bạn cần làm chi tiết hơn)
    if (roomName.startsWith("bus-") && user.role === "phu_huynh") {
      // Tạm thời chặn phụ huynh join phòng bus (ví dụ)
      // (Logic thật: check xem phụ huynh có con trên bus đó không)
      // return socket.emit(SOCKET_EVENTS.ERROR, { message: 'Forbidden: Parents cannot join bus rooms directly' });
    }

    if (roomName.startsWith("trip-") && user.role === "tai_xe") {
      // (Logic thật: check xem tài xế có lái chuyến đó không)
    }

    socket.join(roomName);
    socket.emit(SOCKET_EVENTS.JOINED_ROOM, { room: roomName });
    console.log(`📱 Socket ${socket.id} joined room: ${roomName}`);
  });

  // Handle room leaving
  socket.on(SOCKET_EVENTS.LEAVE_ROOM, (roomName: any) => {
    socket.leave(roomName);
    socket.emit(SOCKET_EVENTS.LEFT_ROOM, { room: roomName });
    console.log(`📱 Socket ${socket.id} left room: ${roomName}`);
  });

  // Handle disconnection
  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });

  // Handle errors
  socket.on(SOCKET_EVENTS.ERROR, (error: any) => {
    console.error(`🚨 Socket error: ${error}`);
  });
});

// Store Socket.IO instance in app for use in routes
app.set("io", io);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;
server.listen(PORT, () => {
  console.log(`🚀 SSB Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}${API_PREFIX}`);
  console.log(`❤️  Health Check: http://localhost:${PORT}${API_PREFIX}/health`);
  console.log(`📡 Socket.IO: http://localhost:${PORT}`);
  console.log(`📚 Documentation: docs/openapi.yaml`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Process terminated");
    process.exit(0);
  });
});

export default app;
