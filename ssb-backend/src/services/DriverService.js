import TaiXeModel from "../models/TaiXeModel.js";
import NguoiDungModel from "../models/NguoiDungModel.js";
import bcrypt from "bcryptjs";

const VALID_STATUS = ["hoat_dong", "tam_nghi", "nghi_huu"];

class DriverService {
  /**
   * Lấy danh sách tài xế có phân trang và tìm kiếm
   */
  static async list(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = "maTaiXe",
      sortDir = "DESC",
    } = options;

    let query = `
      SELECT 
        tx.maTaiXe,
        nd.hoTen,
        nd.email,
        nd.soDienThoai,
        nd.anhDaiDien,
        tx.soBangLai,
        tx.ngayHetHanBangLai,
        tx.soNamKinhNghiem,
        tx.trangThai,
        tx.ngayTao,
        tx.ngayCapNhat
      FROM TaiXe tx
      INNER JOIN NguoiDung nd ON tx.maTaiXe = nd.maNguoiDung
      WHERE 1=1
    `;
    const params = [];

    // Tìm kiếm
    if (search) {
      query +=
        " AND (nd.hoTen LIKE ? OR nd.email LIKE ? OR tx.soBangLai LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Lọc theo trạng thái
    if (status) {
      query += " AND tx.trangThai = ?";
      params.push(status);
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
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM TaiXe tx
      INNER JOIN NguoiDung nd ON tx.maTaiXe = nd.maNguoiDung
      WHERE 1=1
    `;
    const countParams = [];

    if (search) {
      countQuery +=
        " AND (nd.hoTen LIKE ? OR nd.email LIKE ? OR tx.soBangLai LIKE ?)";
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      countQuery += " AND tx.trangThai = ?";
      countParams.push(status);
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
   * Lấy thông tin tài xế theo ID
   */
  static async getById(id) {
    return await TaiXeModel.getById(id);
  }

  /**
   * Tạo tài xế mới
   */
  static async create(data) {
    const {
      hoTen,
      email,
      matKhau,
      soDienThoai,
      anhDaiDien,
      soBangLai,
      ngayHetHanBangLai,
      soNamKinhNghiem,
      trangThai,
    } = data;

    // Validate required fields
    if (!hoTen || !email || !matKhau || !soBangLai) {
      throw new Error("MISSING_REQUIRED_FIELDS");
    }

    // Validate status
    if (trangThai && !VALID_STATUS.includes(trangThai)) {
      throw new Error("INVALID_STATUS");
    }

    // Kiểm tra email đã tồn tại
    const emailExists = await NguoiDungModel.emailExists(email);
    if (emailExists) {
      throw new Error("EMAIL_EXISTS");
    }

    // Kiểm tra SĐT đã tồn tại (nếu có)
    if (soDienThoai) {
      const phoneExists = await NguoiDungModel.phoneExists(soDienThoai);
      if (phoneExists) {
        throw new Error("PHONE_EXISTS");
      }
    }

    // Kiểm tra số bằng lái đã tồn tại
    const licenseExists = await TaiXeModel.getByLicense(soBangLai);
    if (licenseExists) {
      throw new Error("LICENSE_EXISTS");
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(matKhau, 10);

    // Tạo NguoiDung trước
    const userId = await NguoiDungModel.create({
      hoTen,
      email,
      matKhau: hashedPassword,
      soDienThoai,
      anhDaiDien,
      vaiTro: "tai_xe",
    });

    // Tạo TaiXe
    await TaiXeModel.create({
      maTaiXe: userId,
      soBangLai,
      ngayHetHanBangLai,
      soNamKinhNghiem: soNamKinhNghiem || 0,
      trangThai: trangThai || "hoat_dong",
    });

    return await TaiXeModel.getById(userId);
  }

  /**
   * Cập nhật tài xế
   */
  static async update(id, data) {
    const {
      hoTen,
      email,
      soDienThoai,
      anhDaiDien,
      soBangLai,
      ngayHetHanBangLai,
      soNamKinhNghiem,
      trangThai,
    } = data;

    // Kiểm tra tài xế có tồn tại không
    const existing = await TaiXeModel.getById(id);
    if (!existing) {
      return null;
    }

    // Validate status
    if (trangThai && !VALID_STATUS.includes(trangThai)) {
      throw new Error("INVALID_STATUS");
    }

    // Kiểm tra email trùng (nếu có thay đổi)
    if (email && email !== existing.email) {
      const emailExists = await NguoiDungModel.emailExists(email, id);
      if (emailExists) {
        throw new Error("EMAIL_EXISTS");
      }
    }

    // Kiểm tra SĐT trùng (nếu có thay đổi)
    if (soDienThoai && soDienThoai !== existing.soDienThoai) {
      const phoneExists = await NguoiDungModel.phoneExists(soDienThoai, id);
      if (phoneExists) {
        throw new Error("PHONE_EXISTS");
      }
    }

    // Kiểm tra số bằng lái trùng (nếu có thay đổi)
    if (soBangLai && soBangLai !== existing.soBangLai) {
      const licenseExists = await TaiXeModel.getByLicense(soBangLai);
      if (licenseExists && licenseExists.maTaiXe !== id) {
        throw new Error("LICENSE_EXISTS");
      }
    }

    // Cập nhật NguoiDung
    const userUpdateData = {};
    if (hoTen !== undefined) userUpdateData.hoTen = hoTen;
    if (email !== undefined) userUpdateData.email = email;
    if (soDienThoai !== undefined) userUpdateData.soDienThoai = soDienThoai;
    if (anhDaiDien !== undefined) userUpdateData.anhDaiDien = anhDaiDien;

    if (Object.keys(userUpdateData).length > 0) {
      await NguoiDungModel.update(id, userUpdateData);
    }

    // Cập nhật TaiXe
    const driverUpdateData = {};
    if (soBangLai !== undefined) driverUpdateData.soBangLai = soBangLai;
    if (ngayHetHanBangLai !== undefined)
      driverUpdateData.ngayHetHanBangLai = ngayHetHanBangLai;
    if (soNamKinhNghiem !== undefined)
      driverUpdateData.soNamKinhNghiem = soNamKinhNghiem;
    if (trangThai !== undefined) driverUpdateData.trangThai = trangThai;

    if (Object.keys(driverUpdateData).length > 0) {
      await TaiXeModel.update(id, driverUpdateData);
    }

    return await TaiXeModel.getById(id);
  }

  /**
   * Xóa tài xế
   */
  static async remove(id) {
    // Kiểm tra tài xế có tồn tại không
    const existing = await TaiXeModel.getById(id);
    if (!existing) {
      return false;
    }

    // Xóa TaiXe trước (vì có FK)
    await TaiXeModel.delete(id);

    // Xóa NguoiDung (soft delete)
    return await NguoiDungModel.delete(id);
  }

  /**
   * Lấy lịch trình của tài xế
   */
  static async getSchedules(id) {
    // Kiểm tra tài xế có tồn tại không
    const existing = await TaiXeModel.getById(id);
    if (!existing) {
      return null;
    }

    return await TaiXeModel.getSchedules(id);
  }

  /**
   * Thống kê tài xế
   */
  static async getStats() {
    return await TaiXeModel.getStats();
  }

  /**
   * Kiểm tra tài xế có khả dụng không
   */
  static async checkAvailability(maTaiXe, gioKhoiHanh, loaiChuyen) {
    return await TaiXeModel.isAvailable(maTaiXe, gioKhoiHanh, loaiChuyen);
  }
}

export default DriverService;
