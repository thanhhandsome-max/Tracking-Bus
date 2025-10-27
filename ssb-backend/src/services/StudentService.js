import HocSinhModel from "../models/HocSinhModel.js";
import NguoiDungModel from "../models/NguoiDungModel.js";

class StudentService {
  /**
   * Lấy danh sách học sinh có phân trang và tìm kiếm
   */
  static async list(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      lop,
      maPhuHuynh,
      sortBy = "hoTen",
      sortDir = "ASC",
    } = options;

    let query = `
      SELECT 
        hs.*,
        nd.hoTen as tenPhuHuynh,
        nd.soDienThoai as sdtPhuHuynh,
        nd.email as emailPhuHuynh
      FROM HocSinh hs
      LEFT JOIN NguoiDung nd ON hs.maPhuHuynh = nd.maNguoiDung
      WHERE hs.trangThai = TRUE
    `;
    const params = [];

    // Tìm kiếm
    if (search) {
      query += " AND (hs.hoTen LIKE ? OR hs.lop LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Lọc theo lớp
    if (lop) {
      query += " AND hs.lop = ?";
      params.push(lop);
    }

    // Lọc theo phụ huynh
    if (maPhuHuynh) {
      query += " AND hs.maPhuHuynh = ?";
      params.push(maPhuHuynh);
    }

    // Sắp xếp
    const validSortDir = sortDir.toUpperCase() === "ASC" ? "ASC" : "DESC";
    query += ` ORDER BY hs.${sortBy} ${validSortDir}`;

    // Phân trang
    const offset = (page - 1) * limit;
    query += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    // Execute query
    const pool = (await import("../config/db.js")).default;
    const [rows] = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM HocSinh hs
      WHERE hs.trangThai = TRUE
    `;
    const countParams = [];

    if (search) {
      countQuery += " AND (hs.hoTen LIKE ? OR hs.lop LIKE ?)";
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    if (lop) {
      countQuery += " AND hs.lop = ?";
      countParams.push(lop);
    }

    if (maPhuHuynh) {
      countQuery += " AND hs.maPhuHuynh = ?";
      countParams.push(maPhuHuynh);
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
   * Lấy thông tin học sinh theo ID
   */
  static async getById(id) {
    const student = await HocSinhModel.getById(id);
    if (!student || !student.trangThai) {
      return null;
    }
    return student;
  }

  /**
   * Lấy học sinh theo lớp
   */
  static async getByClass(lop) {
    return await HocSinhModel.getByClass(lop);
  }

  /**
   * Lấy học sinh của phụ huynh
   */
  static async getByParent(maPhuHuynh) {
    return await HocSinhModel.getByParent(maPhuHuynh);
  }

  /**
   * Tạo học sinh mới
   */
  static async create(data) {
    const { hoTen, ngaySinh, lop, maPhuHuynh, diaChi, anhDaiDien } = data;

    // Validate required fields
    if (!hoTen || !lop) {
      throw new Error("MISSING_REQUIRED_FIELDS");
    }

    // Kiểm tra phụ huynh tồn tại (nếu có)
    if (maPhuHuynh) {
      const parent = await NguoiDungModel.getById(maPhuHuynh);
      if (!parent) {
        throw new Error("PARENT_NOT_FOUND");
      }

      // Kiểm tra phải là phụ huynh
      const parentFull = await NguoiDungModel.getByEmail(parent.email);
      if (parentFull.vaiTro !== "phu_huynh") {
        throw new Error("INVALID_PARENT_ROLE");
      }
    }

    // Tạo học sinh
    const studentId = await HocSinhModel.create({
      hoTen,
      ngaySinh,
      lop,
      maPhuHuynh,
      diaChi,
      anhDaiDien,
    });

    return await HocSinhModel.getById(studentId);
  }

  /**
   * Cập nhật học sinh
   */
  static async update(id, data) {
    const { hoTen, ngaySinh, lop, maPhuHuynh, diaChi, anhDaiDien } = data;

    // Kiểm tra học sinh có tồn tại không
    const existing = await HocSinhModel.getById(id);
    if (!existing || !existing.trangThai) {
      return null;
    }

    // Kiểm tra phụ huynh tồn tại (nếu có thay đổi)
    if (maPhuHuynh !== undefined && maPhuHuynh !== null) {
      const parent = await NguoiDungModel.getById(maPhuHuynh);
      if (!parent) {
        throw new Error("PARENT_NOT_FOUND");
      }

      // Kiểm tra phải là phụ huynh
      const parentFull = await NguoiDungModel.getByEmail(parent.email);
      if (parentFull.vaiTro !== "phu_huynh") {
        throw new Error("INVALID_PARENT_ROLE");
      }
    }

    // Chuẩn bị dữ liệu update
    const updateData = {};
    if (hoTen !== undefined) updateData.hoTen = hoTen;
    if (ngaySinh !== undefined) updateData.ngaySinh = ngaySinh;
    if (lop !== undefined) updateData.lop = lop;
    if (maPhuHuynh !== undefined) updateData.maPhuHuynh = maPhuHuynh;
    if (diaChi !== undefined) updateData.diaChi = diaChi;
    if (anhDaiDien !== undefined) updateData.anhDaiDien = anhDaiDien;

    // Cập nhật
    const success = await HocSinhModel.update(id, updateData);
    if (!success) {
      return null;
    }

    return await HocSinhModel.getById(id);
  }

  /**
   * Xóa học sinh (soft delete)
   */
  static async remove(id) {
    // Kiểm tra học sinh có tồn tại không
    const existing = await HocSinhModel.getById(id);
    if (!existing || !existing.trangThai) {
      return false;
    }

    return await HocSinhModel.delete(id);
  }

  /**
   * Gán phụ huynh cho học sinh
   */
  static async assignParent(maHocSinh, maPhuHuynh) {
    // Kiểm tra học sinh tồn tại
    const student = await HocSinhModel.getById(maHocSinh);
    if (!student || !student.trangThai) {
      return null;
    }

    // Kiểm tra phụ huynh tồn tại
    const parent = await NguoiDungModel.getById(maPhuHuynh);
    if (!parent) {
      throw new Error("PARENT_NOT_FOUND");
    }

    // Kiểm tra phải là phụ huynh
    const parentFull = await NguoiDungModel.getByEmail(parent.email);
    if (parentFull.vaiTro !== "phu_huynh") {
      throw new Error("INVALID_PARENT_ROLE");
    }

    // Gán phụ huynh
    await HocSinhModel.assignParent(maHocSinh, maPhuHuynh);

    return await HocSinhModel.getById(maHocSinh);
  }

  /**
   * Thống kê học sinh
   */
  static async getStats() {
    return await HocSinhModel.getStats();
  }
}

export default StudentService;
