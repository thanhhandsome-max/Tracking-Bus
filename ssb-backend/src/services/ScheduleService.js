import LichTrinhModel from "../models/LichTrinhModel.js";
import TuyenDuongModel from "../models/TuyenDuongModel.js";
import XeBuytModel from "../models/XeBuytModel.js";
import TaiXeModel from "../models/TaiXeModel.js";
import ChuyenDiModel from "../models/ChuyenDiModel.js";

const VALID_LOAI_CHUYEN = ["don_sang", "tra_chieu"];

class ScheduleService {
  static async list(options = {}) {
    const { 
      page = 1, 
      limit = 10,
      maTuyen,
      maXe,
      maTaiXe,
      loaiChuyen,
      dangApDung,
    } = options;
    
    // Build filter conditions
    const filters = {};
    if (maTuyen) filters.maTuyen = maTuyen;
    if (maXe) filters.maXe = maXe;
    if (maTaiXe) filters.maTaiXe = maTaiXe;
    if (loaiChuyen) filters.loaiChuyen = loaiChuyen;
    if (dangApDung !== undefined) filters.dangApDung = dangApDung;
    
    const data = await LichTrinhModel.getAll(filters);
    const total = data.length; // TODO: Implement proper count with filters
    
    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedData = data.slice(offset, offset + limit);
    
    return {
      data: paginatedData,
      pagination: {
        page: +page,
        limit: +limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id) {
    const s = await LichTrinhModel.getById(id);
    if (!s || !s.dangApDung) throw new Error("SCHEDULE_NOT_FOUND");
    return s;
  }

  static async create(payload) {
    const { maTuyen, maXe, maTaiXe, loaiChuyen, gioKhoiHanh, ngayChay } = payload;
    if (!maTuyen || !maXe || !maTaiXe || !loaiChuyen || !gioKhoiHanh || !ngayChay)
      throw new Error("MISSING_REQUIRED_FIELDS");
    if (!VALID_LOAI_CHUYEN.includes(loaiChuyen))
      throw new Error("INVALID_TRIP_TYPE");

    const route = await TuyenDuongModel.getById(maTuyen);
    if (!route) throw new Error("ROUTE_NOT_FOUND");
    const bus = await XeBuytModel.getById(maXe);
    if (!bus) throw new Error("BUS_NOT_FOUND");
    const driver = await TaiXeModel.getById(maTaiXe);
    if (!driver) throw new Error("DRIVER_NOT_FOUND");

    const conflicts = await LichTrinhModel.checkConflict(
      maXe,
      maTaiXe,
      gioKhoiHanh,
      loaiChuyen,
      ngayChay
    );
    if (conflicts && conflicts.length > 0) {
      const error = new Error("SCHEDULE_CONFLICT");
      error.conflicts = conflicts; // Attach conflict details
      throw error;
    }

    const id = await LichTrinhModel.create({
      maTuyen,
      maXe,
      maTaiXe,
      loaiChuyen,
      gioKhoiHanh,
      ngayChay,
      dangApDung: true,
    });
    
    // Tự động tạo ChuyenDi từ LichTrinh nếu ngayChay là hôm nay hoặc tương lai
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const scheduleDate = new Date(ngayChay);
      scheduleDate.setHours(0, 0, 0, 0);
      
      // Chỉ tạo ChuyenDi nếu ngayChay >= hôm nay
      if (scheduleDate >= today) {
        // Kiểm tra xem đã có ChuyenDi cho lịch trình này chưa
        const existingTrip = await ChuyenDiModel.getByScheduleAndDate(id, ngayChay);
        if (!existingTrip) {
          await ChuyenDiModel.create({
            maLichTrinh: id,
            ngayChay,
            trangThai: 'chua_khoi_hanh',
            ghiChu: null,
          });
          console.log(`✅ Tự động tạo ChuyenDi cho LichTrinh ${id}, ngayChay: ${ngayChay}`);
        }
      }
    } catch (tripError) {
      // Log lỗi nhưng không throw - việc tạo schedule vẫn thành công
      console.error(`⚠️ Không thể tự động tạo ChuyenDi cho LichTrinh ${id}:`, tripError);
    }
    
    return await LichTrinhModel.getById(id);
  }

  static async update(id, data) {
    const existing = await LichTrinhModel.getById(id);
    if (!existing) throw new Error("SCHEDULE_NOT_FOUND");

    if (data.loaiChuyen && !VALID_LOAI_CHUYEN.includes(data.loaiChuyen))
      throw new Error("INVALID_TRIP_TYPE");

    if (data.maTuyen && data.maTuyen !== existing.maTuyen) {
      const r = await TuyenDuongModel.getById(data.maTuyen);
      if (!r) throw new Error("ROUTE_NOT_FOUND");
    }
    if (data.maXe && data.maXe !== existing.maXe) {
      const b = await XeBuytModel.getById(data.maXe);
      if (!b) throw new Error("BUS_NOT_FOUND");
    }
    if (data.maTaiXe && data.maTaiXe !== existing.maTaiXe) {
      const d = await TaiXeModel.getById(data.maTaiXe);
      if (!d) throw new Error("DRIVER_NOT_FOUND");
    }

    const checkMaXe = data.maXe || existing.maXe;
    const checkMaTaiXe = data.maTaiXe || existing.maTaiXe;
    const checkGio = data.gioKhoiHanh || existing.gioKhoiHanh;
    const checkLoai = data.loaiChuyen || existing.loaiChuyen;
    const checkNgay = data.ngayChay || existing.ngayChay;
    const conflicts = await LichTrinhModel.checkConflict(
      checkMaXe,
      checkMaTaiXe,
      checkGio,
      checkLoai,
      checkNgay,
      id
    );
    if (conflicts && conflicts.length > 0) {
      const error = new Error("SCHEDULE_CONFLICT");
      error.conflicts = conflicts; // Attach conflict details
      throw error;
    }

    await LichTrinhModel.update(id, data);
    return await LichTrinhModel.getById(id);
  }

  static async delete(id) {
    const ex = await LichTrinhModel.getById(id);
    if (!ex) throw new Error("SCHEDULE_NOT_FOUND");
    await LichTrinhModel.delete(id);
    return true;
  }

  static async getByRoute(maTuyen) {
    const r = await TuyenDuongModel.getById(maTuyen);
    if (!r) throw new Error("ROUTE_NOT_FOUND");
    return await LichTrinhModel.getByRoute(maTuyen);
  }

  static async getByBus(maXe) {
    const b = await XeBuytModel.getById(maXe);
    if (!b) throw new Error("BUS_NOT_FOUND");
    return await LichTrinhModel.getByBus(maXe);
  }

  static async getByDriver(maTaiXe) {
    const d = await TaiXeModel.getById(maTaiXe);
    if (!d) throw new Error("DRIVER_NOT_FOUND");
    return await LichTrinhModel.getByDriver(maTaiXe);
  }
}

export default ScheduleService;
