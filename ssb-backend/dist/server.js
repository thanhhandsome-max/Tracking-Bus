import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { createServer } from 'http';
import config from './config/env.js';
import { corsMiddleware, corsHandler, securityHeaders, rateLimitHeaders } from './middlewares/cors.js';
import { errorHandler, notFoundHandler, successResponse } from './middlewares/error.js';
import { API_PREFIX } from './constants/http.js';
import { SOCKET_EVENTS } from './constants/realtime.js';
const app = express();
app.set('trust proxy', 1);
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
}
else {
    app.use(morgan('combined'));
}
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));
app.use(corsMiddleware);
app.use(corsHandler);
app.use(securityHeaders);
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    handler: (_req, res) => {
        res.status(429).json({
            success: false,
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests from this IP, please try again later.',
        });
    },
});
app.use(limiter);
app.use(rateLimitHeaders);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.get(`${API_PREFIX}/health`, (_req, res) => {
    const healthData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,
        version: process.env['npm_package_version'] || '1.0.0',
        services: {
            database: 'up',
            redis: 'up',
            socketio: 'up',
        },
    };
    return successResponse(res, healthData);
});
app.get(`${API_PREFIX}/health/detailed`, async (_req, res) => {
    try {
        const healthData = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: config.nodeEnv,
            version: process.env['npm_package_version'] || '1.0.0',
            memory: {
                used: process.memoryUsage(),
                free: process.memoryUsage().heapUsed,
                total: process.memoryUsage().heapTotal,
            },
            services: {
                database: await checkDatabaseHealth(),
                redis: await checkRedisHealth(),
                socketio: 'up',
            },
        };
        return successResponse(res, healthData);
    }
    catch (error) {
        return res.status(503).json({
            success: false,
            code: 'SERVICE_UNAVAILABLE',
            message: 'Health check failed',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
async function checkDatabaseHealth() {
    try {
        return 'up';
    }
    catch (error) {
        return 'down';
    }
}
async function checkRedisHealth() {
    try {
        return 'up';
    }
    catch (error) {
        return 'down';
    }
}
app.use(`${API_PREFIX}/auth`, (_req, res) => {
    res.json({
        success: true,
        message: 'Auth routes will be implemented in Day 2',
        data: {
            availableEndpoints: [
                'POST /auth/login',
                'POST /auth/register',
                'GET /auth/profile',
                'POST /auth/refresh',
                'POST /auth/logout',
            ],
        },
    });
});
app.use(`${API_PREFIX}/buses`, (_req, res) => {
    res.json({
        success: true,
        message: 'Bus routes will be implemented in Day 2',
        data: {
            availableEndpoints: [
                'GET /buses',
                'POST /buses',
                'GET /buses/:id',
                'PUT /buses/:id',
                'DELETE /buses/:id',
                'POST /buses/:id/position',
            ],
        },
    });
});
app.use(`${API_PREFIX}/drivers`, (_req, res) => {
    res.json({
        success: true,
        message: 'Driver routes will be implemented in Day 2',
        data: {
            availableEndpoints: [
                'GET /drivers',
                'POST /drivers',
                'GET /drivers/:id',
                'PUT /drivers/:id',
                'DELETE /drivers/:id',
            ],
        },
    });
});
app.use(`${API_PREFIX}/routes`, (_req, res) => {
    res.json({
        success: true,
        message: 'Route routes will be implemented in Day 2',
        data: {
            availableEndpoints: [
                'GET /routes',
                'POST /routes',
                'GET /routes/:id',
                'PUT /routes/:id',
                'DELETE /routes/:id',
                'GET /routes/:id/stops',
            ],
        },
    });
});
app.use(`${API_PREFIX}/schedules`, (_req, res) => {
    res.json({
        success: true,
        message: 'Schedule routes will be implemented in Day 2',
        data: {
            availableEndpoints: [
                'GET /schedules',
                'POST /schedules',
                'GET /schedules/:id',
                'PUT /schedules/:id',
                'DELETE /schedules/:id',
            ],
        },
    });
});
app.use(`${API_PREFIX}/trips`, (_req, res) => {
    res.json({
        success: true,
        message: 'Trip routes will be implemented in Day 2',
        data: {
            availableEndpoints: [
                'GET /trips',
                'POST /trips/:id/start',
                'POST /trips/:id/end',
                'POST /trips/:id/students/:studentId/status',
            ],
        },
    });
});
app.use(`${API_PREFIX}/reports`, (_req, res) => {
    res.json({
        success: true,
        message: 'Report routes will be implemented in Day 2',
        data: {
            availableEndpoints: [
                'GET /reports/buses/stats',
                'GET /reports/trips/stats',
                'GET /reports/students/stats',
            ],
        },
    });
});
app.use(`${API_PREFIX}`, (req, res, next) => {
    notFoundHandler(req, res);
});
app.get('/', (_req, res) => {
    res.json({
        success: true,
        message: 'SSB 1.0 Backend API',
        data: {
            version: '1.0.0',
            environment: config.nodeEnv,
            apiPrefix: API_PREFIX,
            healthCheck: `${API_PREFIX}/health`,
            documentation: 'docs/openapi.yaml',
        },
    });
});
const server = createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: config.socket.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
});
io.use((_socket, next) => {
    next();
});
io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);
    socket.on(SOCKET_EVENTS.JOIN_ROOM, (roomName) => {
        socket.join(roomName);
        socket.emit(SOCKET_EVENTS.JOINED_ROOM, { room: roomName });
        console.log(`📱 Socket ${socket.id} joined room: ${roomName}`);
    });
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, (roomName) => {
        socket.leave(roomName);
        socket.emit(SOCKET_EVENTS.LEFT_ROOM, { room: roomName });
        console.log(`📱 Socket ${socket.id} left room: ${roomName}`);
    });
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
        console.log(`❌ Socket disconnected: ${socket.id}`);
    });
    socket.on(SOCKET_EVENTS.ERROR, (error) => {
        console.error(`🚨 Socket error: ${error}`);
    });
});
app.set('io', io);
app.use(errorHandler);
const PORT = config.port;
server.listen(PORT, () => {
    console.log(`🚀 SSB Backend Server running on port ${PORT}`);
    console.log(`📊 Environment: ${config.nodeEnv}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}${API_PREFIX}`);
    console.log(`❤️  Health Check: http://localhost:${PORT}${API_PREFIX}/health`);
    console.log(`📡 Socket.IO: http://localhost:${PORT}`);
    console.log(`📚 Documentation: docs/openapi.yaml`);
});
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
    });
});
export default app;
//# sourceMappingURL=server.js.map