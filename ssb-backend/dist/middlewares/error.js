import { ValidationError } from 'joi';
export class AppError extends Error {
    statusCode;
    code;
    errors;
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', errors) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.errors = errors || [];
        Error.captureStackTrace(this, this.constructor);
    }
}
export const ERROR_CODES = {
    AUTH_401: 'AUTH_401',
    AUTH_403: 'AUTH_403',
    AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
    AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
    VALIDATION_422: 'VALIDATION_422',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND_404: 'NOT_FOUND_404',
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    CONFLICT_409: 'CONFLICT_409',
    DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
    INTERNAL_500: 'INTERNAL_500',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
    BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
};
export const errorHandler = (error, req, res, _next) => {
    let statusCode = error.statusCode || 500;
    let code = error.code || ERROR_CODES.INTERNAL_500;
    let message = error.message || 'Internal Server Error';
    let errors;
    if (error instanceof ValidationError) {
        statusCode = 422;
        code = ERROR_CODES.VALIDATION_422;
        message = 'Validation Error';
        errors = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value,
        }));
    }
    if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        code = ERROR_CODES.AUTH_TOKEN_INVALID;
        message = 'Invalid token';
    }
    if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        code = ERROR_CODES.AUTH_TOKEN_EXPIRED;
        message = 'Token expired';
    }
    if (error.name === 'SequelizeValidationError') {
        statusCode = 422;
        code = ERROR_CODES.VALIDATION_422;
        message = 'Database validation error';
        errors = error.errors?.map((err) => ({
            field: err.path,
            message: err.message,
            value: err.value,
        }));
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
        statusCode = 409;
        code = ERROR_CODES.DUPLICATE_RESOURCE;
        message = 'Resource already exists';
    }
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        code = error.code;
        message = error.message;
        errors = error.errors;
    }
    if (process.env['NODE_ENV'] === 'development') {
        console.error('Error Details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            statusCode,
            code,
        });
    }
    const errorResponse = {
        success: false,
        code,
        message,
        errors: errors || [],
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
    };
    res.status(statusCode).json(errorResponse);
};
export const notFoundHandler = (req, res) => {
    const errorResponse = {
        success: false,
        code: ERROR_CODES.NOT_FOUND_404,
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
    };
    res.status(404).json(errorResponse);
};
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
export const successResponse = (res, data, meta, statusCode = 200) => {
    const response = {
        success: true,
        data,
    };
    if (meta) {
        response.meta = meta;
    }
    return res.status(statusCode).json(response);
};
export const errorResponse = (res, message, code, statusCode = 400, errors) => {
    const response = {
        success: false,
        code,
        message,
        errors: errors || [],
        timestamp: new Date().toISOString(),
        path: res.req.originalUrl,
    };
    return res.status(statusCode).json(response);
};
//# sourceMappingURL=error.js.map