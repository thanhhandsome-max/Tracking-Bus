import HocSinhModel from "../models/HocSinhModel.js";
import NguoiDungModel from "../models/NguoiDungModel.js";

class StudentService {
  static async list(options = {}) {
    const { page = 1, limit = 10 } = options;
    const data = await HocSinhModel.getAll(options);
    const total = await HocSinhModel.count(options);
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
    const s = await HocSinhModel.getById(id);
    if (!s) throw new Error("STUDENT_NOT_FOUND");
    return s;
  }

  static async create(payload) {
    const { hoTen, ngaySinh, lop, maPhuHuynh } = payload;
    if (!hoTen || !ngaySinh || !lop) throw new Error("MISSING_REQUIRED_FIELDS");

    const age = new Date().getFullYear() - new Date(ngaySinh).getFullYear();
    if (age < 6 || age > 18) throw new Error("INVALID_AGE");

    if (maPhuHuynh) {
      const parent = await NguoiDungModel.getById(maPhuHuynh);
      if (!parent || parent.vaiTro !== "phu_huynh")
        throw new Error("PARENT_NOT_FOUND");
    }

    const id = await HocSinhModel.create(payload);
    return await HocSinhModel.getById(id);
  }

  static async update(id, data) {
    const student = await HocSinhModel.getById(id);
    if (!student) throw new Error("STUDENT_NOT_FOUND");

    if (data.ngaySinh) {
      const age =
        new Date().getFullYear() - new Date(data.ngaySinh).getFullYear();
      if (age < 6 || age > 18) throw new Error("INVALID_AGE");
    }

    if (data.maPhuHuynh) {
      const parent = await NguoiDungModel.getById(data.maPhuHuynh);
      if (!parent || parent.vaiTro !== "phu_huynh")
        throw new Error("PARENT_NOT_FOUND");
    }

    await HocSinhModel.update(id, data);
    return await HocSinhModel.getById(id);
  }

  static async delete(id) {
    const s = await HocSinhModel.getById(id);
    if (!s) throw new Error("STUDENT_NOT_FOUND");
    await HocSinhModel.delete(id);
    return true;
  }

  static async assignParent(studentId, parentId) {
    const s = await HocSinhModel.getById(studentId);
    if (!s) throw new Error("STUDENT_NOT_FOUND");
    const p = await NguoiDungModel.getById(parentId);
    if (!p || p.vaiTro !== "phu_huynh") throw new Error("PARENT_NOT_FOUND");
    await HocSinhModel.update(studentId, { maPhuHuynh: parentId });
    return await HocSinhModel.getById(studentId);
  }
}

export default StudentService;
