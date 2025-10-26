import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
export declare const validate: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateQuery: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateParams: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const commonSchemas: {
    pagination: Joi.ObjectSchema<any>;
    idParam: Joi.ObjectSchema<any>;
    email: Joi.StringSchema<string>;
    password: Joi.StringSchema<string>;
    phone: Joi.StringSchema<string>;
    date: Joi.DateSchema<Date>;
    time: Joi.StringSchema<string>;
    coordinates: Joi.ObjectSchema<any>;
    fileUpload: Joi.ObjectSchema<any>;
};
export declare const authSchemas: {
    login: Joi.ObjectSchema<any>;
    register: Joi.ObjectSchema<any>;
    changePassword: Joi.ObjectSchema<any>;
};
export declare const busSchemas: {
    create: Joi.ObjectSchema<any>;
    update: Joi.ObjectSchema<any>;
    position: Joi.ObjectSchema<any>;
};
export declare const driverSchemas: {
    create: Joi.ObjectSchema<any>;
};
export declare const routeSchemas: {
    create: Joi.ObjectSchema<any>;
    stop: Joi.ObjectSchema<any>;
};
export declare const scheduleSchemas: {
    create: Joi.ObjectSchema<any>;
};
export declare const tripSchemas: {
    start: Joi.ObjectSchema<any>;
    end: Joi.ObjectSchema<any>;
    studentStatus: Joi.ObjectSchema<any>;
};
//# sourceMappingURL=validate.d.ts.map