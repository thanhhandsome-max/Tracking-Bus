import Joi from 'joi';
import { errorResponse, ERROR_CODES } from './error.js';
export const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
            allowUnknown: false,
        });
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value,
                type: detail.type,
            }));
            errorResponse(res, 'Validation Error', ERROR_CODES.VALIDATION_422, 422, errors);
            return;
        }
        req.body = value;
        next();
    };
};
export const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
            allowUnknown: false,
        });
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value,
                type: detail.type,
            }));
            errorResponse(res, 'Query Validation Error', ERROR_CODES.VALIDATION_422, 422, errors);
            return;
        }
        req.query = value;
        next();
    };
};
export const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true,
            allowUnknown: false,
        });
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value,
                type: detail.type,
            }));
            errorResponse(res, 'Params Validation Error', ERROR_CODES.VALIDATION_422, 422, errors);
            return;
        }
        req.params = value;
        next();
    };
};
export const commonSchemas = {
    pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        sort: Joi.string().valid('asc', 'desc').default('asc'),
        sortBy: Joi.string().default('id'),
    }),
    idParam: Joi.object({
        id: Joi.string().pattern(/^\d+$/).required(),
    }),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).min(10).max(15),
    date: Joi.date().iso(),
    time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90).required(),
        lng: Joi.number().min(-180).max(180).required(),
    }),
    fileUpload: Joi.object({
        fieldname: Joi.string().required(),
        originalname: Joi.string().required(),
        encoding: Joi.string().required(),
        mimetype: Joi.string().required(),
        size: Joi.number().max(5 * 1024 * 1024),
    }),
};
export const authSchemas = {
    login: Joi.object({
        email: commonSchemas.email,
        password: commonSchemas.password,
    }),
    register: Joi.object({
        hoTen: Joi.string().min(2).max(100).required(),
        email: commonSchemas.email,
        password: commonSchemas.password,
        soDienThoai: commonSchemas.phone,
        vaiTro: Joi.string().valid('quan_tri', 'tai_xe', 'phu_huynh').required(),
    }),
    changePassword: Joi.object({
        currentPassword: commonSchemas.password,
        newPassword: commonSchemas.password,
        confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
    }),
};
export const busSchemas = {
    create: Joi.object({
        bienSoXe: Joi.string().min(5).max(15).required(),
        dongXe: Joi.string().min(2).max(50).required(),
        sucChua: Joi.number().integer().min(1).max(100).required(),
        trangThai: Joi.string().valid('hoat_dong', 'bao_tri', 'ngung_hoat_dong').default('hoat_dong'),
    }),
    update: Joi.object({
        bienSoXe: Joi.string().min(5).max(15),
        dongXe: Joi.string().min(2).max(50),
        sucChua: Joi.number().integer().min(1).max(100),
        trangThai: Joi.string().valid('hoat_dong', 'bao_tri', 'ngung_hoat_dong'),
    }),
    position: Joi.object({
        lat: commonSchemas.coordinates.extract('lat'),
        lng: commonSchemas.coordinates.extract('lng'),
        speed: Joi.number().min(0).max(200),
        heading: Joi.number().min(0).max(360),
    }),
};
export const driverSchemas = {
    create: Joi.object({
        hoTen: Joi.string().min(2).max(100).required(),
        email: commonSchemas.email,
        soDienThoai: commonSchemas.phone,
        soBangLai: Joi.string().min(5).max(20).required(),
        ngayHetHanBangLai: commonSchemas.date,
        soNamKinhNghiem: Joi.number().integer().min(0).max(50),
        trangThai: Joi.string().valid('hoat_dong', 'tam_nghi', 'nghi_huu').default('hoat_dong'),
    }),
};
export const routeSchemas = {
    create: Joi.object({
        tenTuyen: Joi.string().min(2).max(255).required(),
        diemBatDau: Joi.string().min(2).max(255).required(),
        diemKetThuc: Joi.string().min(2).max(255).required(),
        thoiGianUocTinh: Joi.number().integer().min(1).max(480),
    }),
    stop: Joi.object({
        tenDiem: Joi.string().min(2).max(255).required(),
        kinhDo: commonSchemas.coordinates.extract('lat'),
        viDo: commonSchemas.coordinates.extract('lng'),
        thuTu: Joi.number().integer().min(1).required(),
    }),
};
export const scheduleSchemas = {
    create: Joi.object({
        maTuyen: Joi.number().integer().min(1).required(),
        maXe: Joi.number().integer().min(1).required(),
        maTaiXe: Joi.number().integer().min(1).required(),
        loaiChuyen: Joi.string().valid('don_sang', 'tra_chieu').required(),
        gioKhoiHanh: commonSchemas.time.required(),
        dangApDung: Joi.boolean().default(true),
    }),
};
export const tripSchemas = {
    start: Joi.object({
        gioBatDauThucTe: commonSchemas.date,
        ghiChu: Joi.string().max(500),
    }),
    end: Joi.object({
        gioKetThucThucTe: commonSchemas.date,
        ghiChu: Joi.string().max(500),
    }),
    studentStatus: Joi.object({
        trangThai: Joi.string().valid('cho_don', 'da_don', 'da_tra', 'vang').required(),
        thoiGianThucTe: commonSchemas.date,
        ghiChu: Joi.string().max(255),
    }),
};
//# sourceMappingURL=validate.js.map