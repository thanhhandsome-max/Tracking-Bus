import LichTrinhModel from "../models/LichTrinhModel.js";
import TuyenDuongModel from "../models/TuyenDuongModel.js";
import XeBuytModel from "../models/XeBuytModel.js";
import TaiXeModel from "../models/TaiXeModel.js";
import ChuyenDiModel from "../models/ChuyenDiModel.js";
import ScheduleStudentStopModel from "../models/ScheduleStudentStopModel.js";

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
    
    // Load students from schedule_student_stops
    const students = await ScheduleStudentStopModel.getByScheduleId(id);
    
    // Load route stops
    const RouteService = (await import("./RouteService.js")).default;
    const routeStops = await RouteService.getStops(s.maTuyen);
    
    // Nhóm students theo điểm dừng và tính số lượng
    const stopsWithStudents = routeStops.map((stop) => {
      const stopStudents = students.filter(
        (student) => student.maDiem === stop.maDiem || student.thuTuDiem === stop.sequence
      );
      return {
        ...stop,
        studentCount: stopStudents.length,
        students: stopStudents.map((s) => ({
          maHocSinh: s.maHocSinh,
          hoTen: s.hoTen,
          lop: s.lop,
          anhDaiDien: s.anhDaiDien,
          diaChi: s.diaChi,
        })),
      };
    });
    
    return {
      ...s,
      students: students || [],
      stops: stopsWithStudents,
      totalStudents: students.length,
    };
  }

  static async create(payload) {
    const { maTuyen, maXe, maTaiXe, loaiChuyen, gioKhoiHanh, ngayChay, students } = payload;
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
    
    // 🔥 VALIDATION: Validate students[] nếu có
    let finalStudents = students;
    if (students && Array.isArray(students) && students.length > 0) {
      console.log(`[ScheduleService] Validating ${students.length} students for schedule ${id}...`);
      
      // Lấy route stops để validate
      const RouteService = (await import("./RouteService.js")).default;
      const routeStops = await RouteService.getStops(maTuyen);
      
      // Tạo map: sequence -> { maDiem, ... }
      const stopMap = new Map();
      routeStops.forEach(stop => {
        stopMap.set(stop.sequence, {
          maDiem: stop.maDiem || stop.stop_id,
          sequence: stop.sequence,
          tenDiem: stop.tenDiem || stop.name,
        });
      });
      
      // Validate từng student
      const HocSinhModel = (await import("../models/HocSinhModel.js")).default;
      const validationErrors = [];
      
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        
        // Validate required fields
        if (!student.maHocSinh || !student.thuTuDiem || !student.maDiem) {
          validationErrors.push(`Student ${i + 1}: Missing required fields (maHocSinh, thuTuDiem, maDiem)`);
          continue;
        }
        
        // Validate maHocSinh tồn tại
        const studentExists = await HocSinhModel.getById(student.maHocSinh);
        if (!studentExists) {
          validationErrors.push(`Student ${i + 1}: maHocSinh ${student.maHocSinh} not found`);
          continue;
        }
        
        // Validate thuTuDiem khớp với route_stops.sequence
        const stopInfo = stopMap.get(student.thuTuDiem);
        if (!stopInfo) {
          validationErrors.push(`Student ${i + 1}: thuTuDiem ${student.thuTuDiem} does not exist in route ${maTuyen}`);
          continue;
        }
        
        // Validate maDiem khớp với stop có sequence = thuTuDiem
        if (student.maDiem !== stopInfo.maDiem) {
          validationErrors.push(
            `Student ${i + 1}: maDiem ${student.maDiem} does not match stop with sequence ${student.thuTuDiem} (expected maDiem: ${stopInfo.maDiem})`
          );
          continue;
        }
      }
      
      if (validationErrors.length > 0) {
        console.error(`[ScheduleService] Validation failed for ${validationErrors.length} students:`, validationErrors);
        const error = new Error("INVALID_STUDENT_ASSIGNMENT");
        error.validationErrors = validationErrors;
        throw error;
      }
      
      console.log(`[ScheduleService] ✅ Validated ${students.length} students successfully`);
    }
    
    // 🔥 FIX: Nếu không có students được gửi lên, tự động gán học sinh từ route stops
    if ((!students || students.length === 0)) {
      try {
        console.log(`[ScheduleService] No students provided, auto-assigning students from route ${maTuyen}...`);
        
        // Lấy route stops
        const RouteService = (await import("./RouteService.js")).default;
        const routeStops = await RouteService.getStops(maTuyen);
        console.log(`[ScheduleService] Found ${routeStops.length} route stops for route ${maTuyen}`);
        
        if (routeStops.length > 0) {
          // Log thông tin stops
          console.log(`[ScheduleService] Route stops sample:`, routeStops.slice(0, 2).map(s => ({
            maDiem: s.maDiem,
            sequence: s.sequence,
            tenDiem: s.tenDiem,
            hasCoords: !!(s.viDo && s.kinhDo),
            viDo: s.viDo,
            kinhDo: s.kinhDo,
          })));
          
          // Lấy tất cả học sinh có tọa độ
          const HocSinhModel = (await import("../models/HocSinhModel.js")).default;
          let allStudents = await HocSinhModel.getAll();
          console.log(`[ScheduleService] Total students in DB: ${allStudents.length}`);
          
          allStudents = allStudents.filter(s => s.viDo && s.kinhDo && !isNaN(s.viDo) && !isNaN(s.kinhDo) && s.trangThai);
          console.log(`[ScheduleService] Students with valid coordinates: ${allStudents.length}`);
          
          if (allStudents.length === 0) {
            console.warn(`[ScheduleService] ⚠️ No students with valid coordinates found`);
          }
          
          // Tính khoảng cách và gán học sinh vào stop gần nhất
          const StopSuggestionService = (await import("./StopSuggestionService.js")).default;
          const autoAssignedStudents = [];
          
          for (const student of allStudents) {
            let nearestStop = null;
            let minDistance = Infinity;
            
            for (const stop of routeStops) {
              // Kiểm tra stop có tọa độ không
              if (!stop.viDo || !stop.kinhDo || isNaN(stop.viDo) || isNaN(stop.kinhDo)) {
                console.warn(`[ScheduleService] Stop ${stop.maDiem} (${stop.tenDiem}) has invalid coordinates`);
                continue;
              }
              
              const distance = StopSuggestionService.calculateDistance(
                student.viDo,
                student.kinhDo,
                stop.viDo,
                stop.kinhDo
              );
              
              if (distance < minDistance && distance <= 2.0) { // Chỉ gán nếu < 2km
                minDistance = distance;
                nearestStop = stop;
              }
            }
            
            if (nearestStop) {
              autoAssignedStudents.push({
                maHocSinh: student.maHocSinh,
                thuTuDiem: nearestStop.sequence,
                maDiem: nearestStop.maDiem,
              });
              console.log(`[ScheduleService] Assigned student ${student.maHocSinh} (${student.hoTen}) to stop ${nearestStop.maDiem} (sequence ${nearestStop.sequence}), distance: ${minDistance.toFixed(2)}km`);
            } else {
              console.log(`[ScheduleService] Student ${student.maHocSinh} (${student.hoTen}) - no stop within 2km`);
            }
          }
          
          if (autoAssignedStudents.length > 0) {
            finalStudents = autoAssignedStudents;
            console.log(`[ScheduleService] ✅ Auto-assigned ${autoAssignedStudents.length} students to schedule ${id}`);
          } else {
            console.warn(`[ScheduleService] ⚠️ No students found near route stops for schedule ${id}`);
            console.warn(`[ScheduleService] Debug info:`, {
              routeStopsCount: routeStops.length,
              studentsWithCoords: allStudents.length,
              routeStopsWithCoords: routeStops.filter(s => s.viDo && s.kinhDo).length,
            });
          }
        } else {
          console.warn(`[ScheduleService] ⚠️ Route ${maTuyen} has no stops`);
        }
      } catch (autoAssignError) {
        console.error(`[ScheduleService] ⚠️ Failed to auto-assign students:`, autoAssignError);
        console.error(`[ScheduleService] Error stack:`, autoAssignError.stack);
        // Continue - schedule đã được tạo thành công
      }
    }
    
    // Lưu students vào schedule_student_stops
    if (finalStudents && Array.isArray(finalStudents) && finalStudents.length > 0) {
      try {
        console.log(`[ScheduleService] Attempting to save ${finalStudents.length} students to schedule_student_stops for schedule ${id}`);
        console.log(`[ScheduleService] Sample student data:`, finalStudents.slice(0, 3));
        const affectedRows = await ScheduleStudentStopModel.bulkCreate(id, finalStudents);
        console.log(`[ScheduleService] ✅ Đã gán ${affectedRows} học sinh vào schedule ${id} (affectedRows: ${affectedRows})`);
        
        // Verify: Query lại để kiểm tra
        const verifyStudents = await ScheduleStudentStopModel.getByScheduleId(id);
        console.log(`[ScheduleService] Verification: Found ${verifyStudents.length} students in schedule_student_stops for schedule ${id}`);
      } catch (studentError) {
        console.error(`[ScheduleService] ⚠️ Lỗi khi gán học sinh vào schedule ${id}:`, studentError);
        console.error(`[ScheduleService] Error details:`, {
          message: studentError.message,
          stack: studentError.stack,
          studentsCount: finalStudents.length,
          sampleStudent: finalStudents[0],
        });
        // Không throw error - schedule đã được tạo thành công
      }
    } else {
      console.warn(`[ScheduleService] ⚠️ Schedule ${id} created without students`);
      console.warn(`[ScheduleService] finalStudents:`, finalStudents);
    }
    
    // Tự động tạo ChuyenDi từ LichTrinh nếu ngayChay là hôm nay hoặc tương lai
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Parse ngayChay (có thể là string "YYYY-MM-DD" hoặc Date object)
      let scheduleDate;
      if (typeof ngayChay === 'string') {
        scheduleDate = new Date(ngayChay);
      } else {
        scheduleDate = new Date(ngayChay);
      }
      scheduleDate.setHours(0, 0, 0, 0);
      
      // Chỉ tạo ChuyenDi nếu ngayChay >= hôm nay
      if (scheduleDate >= today) {
        // Kiểm tra xem đã có ChuyenDi cho lịch trình này chưa
        const existingTrip = await ChuyenDiModel.getByScheduleAndDate(id, ngayChay);
        if (!existingTrip) {
          const tripId = await ChuyenDiModel.create({
            maLichTrinh: id,
            ngayChay,
            trangThai: 'chua_khoi_hanh',
            ghiChu: null,
          });
          console.log(`✅ Tự động tạo ChuyenDi ${tripId} cho LichTrinh ${id}, ngayChay: ${ngayChay}`);
          
          // Copy students từ schedule_student_stops sang TrangThaiHocSinh
          try {
            const copiedCount = await ScheduleStudentStopModel.copyToTrip(id, tripId);
            if (copiedCount > 0) {
              console.log(`✅ Đã copy ${copiedCount} học sinh từ schedule ${id} sang trip ${tripId}`);
            }
          } catch (copyError) {
            console.error(`⚠️ Lỗi khi copy học sinh sang trip ${tripId}:`, copyError);
            // Không throw error - trip đã được tạo thành công
          }
        } else {
          console.log(`ℹ️ ChuyenDi đã tồn tại cho LichTrinh ${id}, ngayChay: ${ngayChay}`);
        }
      } else {
        console.log(`ℹ️ Không tạo ChuyenDi cho LichTrinh ${id} vì ngayChay (${ngayChay}) < hôm nay`);
      }
    } catch (tripError) {
      // Log lỗi chi tiết nhưng không throw - việc tạo schedule vẫn thành công
      console.error(`⚠️ Không thể tự động tạo ChuyenDi cho LichTrinh ${id}:`, tripError);
      console.error(`⚠️ Error details:`, {
        message: tripError.message,
        stack: tripError.stack,
        ngayChay: ngayChay,
        scheduleId: id
      });
    }
    
    return await LichTrinhModel.getById(id);
  }

  static async update(id, data) {
    const existing = await LichTrinhModel.getById(id);
    if (!existing) throw new Error("SCHEDULE_NOT_FOUND");

    if (data.loaiChuyen && !VALID_LOAI_CHUYEN.includes(data.loaiChuyen))
      throw new Error("INVALID_TRIP_TYPE");
    
    // Handle students update if provided
    if (data.students !== undefined) {
      // Delete existing mappings
      await ScheduleStudentStopModel.deleteBySchedule(id);
      
      // Create new mappings if students array is provided and not empty
      if (Array.isArray(data.students) && data.students.length > 0) {
        try {
          await ScheduleStudentStopModel.bulkCreate(id, data.students);
          console.log(`✅ Đã cập nhật ${data.students.length} học sinh cho schedule ${id}`);
        } catch (studentError) {
          console.error(`⚠️ Lỗi khi cập nhật học sinh cho schedule ${id}:`, studentError);
          // Không throw error - schedule update vẫn tiếp tục
        }
      }
      
      // Remove students from data to avoid passing it to LichTrinhModel.update
      delete data.students;
    }

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
