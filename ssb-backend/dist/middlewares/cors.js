import cors from 'cors';
import config from '../config/env.js';
const corsOptions = {
    origin: config.frontend.origin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    optionsSuccessStatus: 200,
};
export const corsMiddleware = cors(corsOptions);
export const corsHandler = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', config.frontend.origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Access-Control-Allow-Credentials', 'false');
        res.header('Access-Control-Max-Age', '86400');
        return res.status(200).end();
    }
    return next();
};
export const securityHeaders = (_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.removeHeader('X-Powered-By');
    next();
};
export const rateLimitHeaders = (_req, res, next) => {
    const remaining = res.get('X-RateLimit-Remaining');
    const reset = res.get('X-RateLimit-Reset');
    if (remaining !== undefined) {
        res.setHeader('X-RateLimit-Remaining', remaining);
    }
    if (reset !== undefined) {
        res.setHeader('X-RateLimit-Reset', reset);
    }
    next();
};
//# sourceMappingURL=cors.js.map