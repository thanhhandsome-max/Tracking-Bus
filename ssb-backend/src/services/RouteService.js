import TuyenDuongModel from "../models/TuyenDuongModel.js";
import DiemDungModel from "../models/DiemDungModel.js";

class RouteService {
  /**
   * Lấy danh sách tuyến đường có phân trang
   */
  static async list(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "tenTuyen",
      sortDir = "ASC",
    } = options;

    let query = `
      SELECT * FROM TuyenDuong 
      WHERE trangThai = TRUE
    `;
    const params = [];

    // Tìm kiếm
    if (search) {
      query +=
        " AND (tenTuyen LIKE ? OR diemBatDau LIKE ? OR diemKetThuc LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Sắp xếp
    const validSortDir = sortDir.toUpperCase() === "ASC" ? "ASC" : "DESC";
    query += ` ORDER BY ${sortBy} ${validSortDir}`;

    // Phân trang
    const offset = (page - 1) * limit;
    query += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    // Execute query
    const pool = (await import("../config/db.js")).default;
    const [rows] = await pool.query(query, params);

    // Get total count
    let countQuery =
      "SELECT COUNT(*) as total FROM TuyenDuong WHERE trangThai = TRUE";
    const countParams = [];

    if (search) {
      countQuery +=
        " AND (tenTuyen LIKE ? OR diemBatDau LIKE ? OR diemKetThuc LIKE ?)";
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy thông tin tuyến đường theo ID (bao gồm điểm dừng)
   */
  static async getById(id) {
    return await TuyenDuongModel.getById(id);
  }

  /**
   * Tạo tuyến đường mới
   */
  static async create(data) {
    const { tenTuyen, diemBatDau, diemKetThuc, thoiGianUocTinh, diemDung } =
      data;

    // Validate required fields
    if (!tenTuyen || !diemBatDau || !diemKetThuc) {
      throw new Error("MISSING_REQUIRED_FIELDS");
    }

    // Validate thời gian ước tính
    if (thoiGianUocTinh && thoiGianUocTinh < 0) {
      throw new Error("INVALID_TIME");
    }

    // Tạo tuyến đường
    const routeId = await TuyenDuongModel.create({
      tenTuyen,
      diemBatDau,
      diemKetThuc,
      thoiGianUocTinh,
    });

    // Thêm điểm dừng (nếu có)
    if (diemDung && Array.isArray(diemDung) && diemDung.length > 0) {
      await DiemDungModel.createMultiple(routeId, diemDung);
    }

    return await TuyenDuongModel.getById(routeId);
  }

  /**
   * Cập nhật tuyến đường
   */
  static async update(id, data) {
    const { tenTuyen, diemBatDau, diemKetThuc, thoiGianUocTinh } = data;

    // Kiểm tra tuyến có tồn tại không
    const existing = await TuyenDuongModel.getById(id);
    if (!existing || !existing.trangThai) {
      return null;
    }

    // Validate thời gian ước tính
    if (thoiGianUocTinh !== undefined && thoiGianUocTinh < 0) {
      throw new Error("INVALID_TIME");
    }

    // Chuẩn bị dữ liệu update
    const updateData = {};
    if (tenTuyen !== undefined) updateData.tenTuyen = tenTuyen;
    if (diemBatDau !== undefined) updateData.diemBatDau = diemBatDau;
    if (diemKetThuc !== undefined) updateData.diemKetThuc = diemKetThuc;
    if (thoiGianUocTinh !== undefined)
      updateData.thoiGianUocTinh = thoiGianUocTinh;

    // Cập nhật
    const success = await TuyenDuongModel.update(id, updateData);
    if (!success) {
      return null;
    }

    return await TuyenDuongModel.getById(id);
  }

  /**
   * Xóa tuyến đường (soft delete)
   */
  static async remove(id) {
    // Kiểm tra tuyến có tồn tại không
    const existing = await TuyenDuongModel.getById(id);
    if (!existing || !existing.trangThai) {
      return false;
    }

    return await TuyenDuongModel.delete(id);
  }

  /**
   * Thống kê tuyến đường
   */
  static async getStats() {
    return await TuyenDuongModel.getStats();
  }

  /**
   * Lấy điểm dừng của tuyến
   */
  static async getStops(routeId) {
    // Kiểm tra tuyến tồn tại
    const route = await TuyenDuongModel.getById(routeId);
    if (!route || !route.trangThai) {
      return null;
    }

    return await DiemDungModel.getByRoute(routeId);
  }

  /**
   * Thêm điểm dừng vào tuyến
   */
  static async addStop(routeId, stopData) {
    const { tenDiem, kinhDo, viDo, thuTu } = stopData;

    // Kiểm tra tuyến tồn tại
    const route = await TuyenDuongModel.getById(routeId);
    if (!route || !route.trangThai) {
      throw new Error("ROUTE_NOT_FOUND");
    }

    // Validate required fields
    if (
      !tenDiem ||
      kinhDo === undefined ||
      viDo === undefined ||
      thuTu === undefined
    ) {
      throw new Error("MISSING_REQUIRED_FIELDS");
    }

    // Tạo điểm dừng
    const stopId = await DiemDungModel.create({
      maTuyen: routeId,
      tenDiem,
      kinhDo,
      viDo,
      thuTu,
    });

    return await DiemDungModel.getById(stopId);
  }

  /**
   * Cập nhật điểm dừng
   */
  static async updateStop(stopId, stopData) {
    const { tenDiem, kinhDo, viDo, thuTu } = stopData;

    // Kiểm tra điểm dừng tồn tại
    const existing = await DiemDungModel.getById(stopId);
    if (!existing) {
      return null;
    }

    // Chuẩn bị dữ liệu update
    const updateData = {};
    if (tenDiem !== undefined) updateData.tenDiem = tenDiem;
    if (kinhDo !== undefined) updateData.kinhDo = kinhDo;
    if (viDo !== undefined) updateData.viDo = viDo;
    if (thuTu !== undefined) updateData.thuTu = thuTu;

    // Cập nhật
    const success = await DiemDungModel.update(stopId, updateData);
    if (!success) {
      return null;
    }

    return await DiemDungModel.getById(stopId);
  }

  /**
   * Xóa điểm dừng
   */
  static async removeStop(stopId) {
    // Kiểm tra điểm dừng tồn tại
    const existing = await DiemDungModel.getById(stopId);
    if (!existing) {
      return false;
    }

    return await DiemDungModel.delete(stopId);
  }

  /**
   * Sắp xếp lại điểm dừng
   */
  static async reorderStops(routeId, stopIds) {
    // Kiểm tra tuyến tồn tại
    const route = await TuyenDuongModel.getById(routeId);
    if (!route || !route.trangThai) {
      throw new Error("ROUTE_NOT_FOUND");
    }

    if (!Array.isArray(stopIds) || stopIds.length === 0) {
      throw new Error("INVALID_STOP_IDS");
    }

    return await DiemDungModel.reorder(routeId, stopIds);
  }
}

export default RouteService;
