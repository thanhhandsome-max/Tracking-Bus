import { Request, Response, NextFunction } from 'express';
interface ApiError extends Error {
    statusCode?: number;
    code?: string;
    errors?: any[];
}
export declare class AppError extends Error {
    statusCode: number;
    code: string;
    errors?: any[];
    constructor(message: string, statusCode?: number, code?: string, errors?: any[]);
}
export declare const ERROR_CODES: {
    readonly AUTH_401: "AUTH_401";
    readonly AUTH_403: "AUTH_403";
    readonly AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED";
    readonly AUTH_TOKEN_INVALID: "AUTH_TOKEN_INVALID";
    readonly VALIDATION_422: "VALIDATION_422";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly NOT_FOUND_404: "NOT_FOUND_404";
    readonly RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND";
    readonly CONFLICT_409: "CONFLICT_409";
    readonly DUPLICATE_RESOURCE: "DUPLICATE_RESOURCE";
    readonly INTERNAL_500: "INTERNAL_500";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR";
    readonly BUSINESS_LOGIC_ERROR: "BUSINESS_LOGIC_ERROR";
    readonly INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS";
    readonly RESOURCE_CONFLICT: "RESOURCE_CONFLICT";
};
export declare const errorHandler: (error: ApiError, req: Request, res: Response, _next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response) => void;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const successResponse: (res: Response, data: any, meta?: any, statusCode?: number) => Response<any, Record<string, any>>;
export declare const errorResponse: (res: Response, message: string, code: string, statusCode?: number, errors?: any[]) => Response<any, Record<string, any>>;
export {};
//# sourceMappingURL=error.d.ts.map