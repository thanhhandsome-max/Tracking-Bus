import cors from 'cors';
import config from '../config/env.js';
function isOriginAllowed(origin, allowedOrigins) {
    if (!origin)
        return false;
    const origins = Array.isArray(allowedOrigins) ? allowedOrigins : [allowedOrigins];
    if (origins.includes(origin))
        return true;
    return origins.some(allowed => {
        if (typeof allowed === 'string') {
            const pattern = allowed.replace(/\*/g, '.*');
            const regex = new RegExp(`^${pattern}$`);
            return regex.test(origin);
        }
        return false;
    });
}
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }
        if (isOriginAllowed(origin, config.frontend.origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    optionsSuccessStatus: 200,
};
export const corsMiddleware = cors(corsOptions);
export const corsHandler = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        const origin = req.headers.origin;
        const allowedOrigins = Array.isArray(config.frontend.origin)
            ? config.frontend.origin
            : [config.frontend.origin];
        const matchingOrigin = allowedOrigins.find(allowed => {
            if (!origin)
                return false;
            if (typeof allowed === 'string') {
                const pattern = allowed.replace(/\*/g, '.*');
                const regex = new RegExp(`^${pattern}$`);
                return regex.test(origin) || allowed === origin;
            }
            return false;
        }) || origin;
        if (origin && isOriginAllowed(origin, config.frontend.origin)) {
            res.header('Access-Control-Allow-Origin', origin);
        }
        else if (matchingOrigin) {
            res.header('Access-Control-Allow-Origin', matchingOrigin);
        }
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