import LichTrinhModel from "../models/LichTrinhModel.js";
import TuyenDuongModel from "../models/TuyenDuongModel.js";
import XeBuytModel from "../models/XeBuytModel.js";
import TaiXeModel from "../models/TaiXeModel.js";

const VALID_LOAI_CHUYEN = ["don_sang", "tra_chieu"];

class ScheduleService {
  static async list(options = {}) {
    const { page = 1, limit = 10 } = options;
    const data = await LichTrinhModel.getAll(options);
    const total = await LichTrinhModel.count(options);
    return {
      data,
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
    const { maTuyen, maXe, maTaiXe, loaiChuyen, gioKhoiHanh } = payload;
    if (!maTuyen || !maXe || !maTaiXe || !loaiChuyen || !gioKhoiHanh)
      throw new Error("MISSING_REQUIRED_FIELDS");
    if (!VALID_LOAI_CHUYEN.includes(loaiChuyen))
      throw new Error("INVALID_TRIP_TYPE");

    const route = await TuyenDuongModel.getById(maTuyen);
    if (!route) throw new Error("ROUTE_NOT_FOUND");
    const bus = await XeBuytModel.getById(maXe);
    if (!bus) throw new Error("BUS_NOT_FOUND");
    const driver = await TaiXeModel.getById(maTaiXe);
    if (!driver) throw new Error("DRIVER_NOT_FOUND");

    const conflict = await LichTrinhModel.checkConflict(
      maXe,
      maTaiXe,
      gioKhoiHanh,
      loaiChuyen
    );
    if (conflict) throw new Error("SCHEDULE_CONFLICT");

    const id = await LichTrinhModel.create({
      maTuyen,
      maXe,
      maTaiXe,
      loaiChuyen,
      gioKhoiHanh,
      dangApDung: true,
    });
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
    const conflict = await LichTrinhModel.checkConflict(
      checkMaXe,
      checkMaTaiXe,
      checkGio,
      checkLoai,
      id
    );
    if (conflict) throw new Error("SCHEDULE_CONFLICT");

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
