import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import config from '../config/env';

// CORS configuration - strict origin checking
const corsOptions = {
  origin: config.frontend.origin, // Only allow FE_ORIGIN
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false, // Disable credentials for security
  optionsSuccessStatus: 200,
};

// CORS middleware
export const corsMiddleware = cors(corsOptions);

// Custom CORS handler for preflight requests
export const corsHandler = (req: Request, res: Response, next: NextFunction) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', config.frontend.origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'false');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    return res.status(200).end();
  }
  
  return next();
};

// Security headers middleware
export const securityHeaders = (_req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  next();
};

// Rate limiting headers
export const rateLimitHeaders = (_req: Request, res: Response, next: NextFunction) => {
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
