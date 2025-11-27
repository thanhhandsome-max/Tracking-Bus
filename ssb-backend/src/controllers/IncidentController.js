import SuCoModel from "../models/SuCoModel.js";

class IncidentController {
  // GET /api/v1/incidents
  static async list(req, res) {
    try {
      const {
        mucDo,
        maChuyen,
        trangThai,
        tuNgay,
        denNgay,
        limit = 50,
        offset = 0,
      } = req.query;

      const data = await SuCoModel.getAll({
        mucDo,
        maChuyen,
        trangThai,
        tuNgay,
        denNgay,
        limit: Number(limit),
        offset: Number(offset),
      });

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("IncidentController.list error:", error);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  }

  // GET /api/v1/incidents/recent
  static async recent(req, res) {
    try {
      const { limit = 10 } = req.query;
      const data = await SuCoModel.getRecent(Number(limit));
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("IncidentController.recent error:", error);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  }

  // GET /api/v1/incidents/:id
  static async get(req, res) {
    try {
      const { id } = req.params;
      const incident = await SuCoModel.getById(id);
      if (!incident) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy sự cố" });
      }
      return res.status(200).json({ success: true, data: incident });
    } catch (error) {
      console.error("IncidentController.get error:", error);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  }

  // POST /api/v1/incidents
  static async create(req, res) {
    try {
      const { 
        maChuyen, 
        moTa, 
        mucDo = "nhe", 
        trangThai = "moi",
        loaiSuCo,
        viTri,
        hocSinhLienQuan // array of student IDs
      } = req.body;

      console.log('🔍 [IncidentController.create] Full request body:', JSON.stringify(req.body, null, 2));
      console.log('🔍 [IncidentController.create] hocSinhLienQuan value:', hocSinhLienQuan);
      console.log('🔍 [IncidentController.create] hocSinhLienQuan type:', typeof hocSinhLienQuan);
      console.log('🔍 [IncidentController.create] Is array?:', Array.isArray(hocSinhLienQuan));

      if (!maChuyen || !moTa) {
        return res.status(400).json({
          success: false,
          message: "Thiếu maChuyen hoặc moTa",
        });
      }

      const created = await SuCoModel.create({ 
        maChuyen, 
        moTa, 
        mucDo, 
        trangThai,
        loaiSuCo,
        viTri,
        hocSinhLienQuan 
      });

      console.log('✅ [IncidentController.create] Created incident:', created.maSuCo);

      // 🔥 Send notifications
      try {
        const ThongBaoModel = (await import("../models/ThongBaoModel.js")).default;
        const { default: pool } = await import("../config/db.js");
        const io = req.app.get("io");

        // Get trip info for notification content
        const ChuyenDiModel = (await import("../models/ChuyenDiModel.js")).default;
        const trip = await ChuyenDiModel.getById(maChuyen);

        const severityMap = {
          'nhe': 'nhẹ',
          'trung_binh': 'trung bình',
          'nghiem_trong': 'nghiêm trọng'
        };
        const severityText = severityMap[mucDo] || mucDo;
        const typeMap = { 'breakdown': 'Hỏng xe', 'accident': 'Tai nạn', 'delay': 'Trễ', 'student': 'Học sinh' };
        const typeText = typeMap[loaiSuCo] || loaiSuCo || 'Sự cố';

        console.log('🔔 [IncidentController.create] Preparing notifications...');

        // 1. Notify ALL admins
        const queryResult = await pool.query(
          `SELECT maNguoiDung FROM NguoiDung WHERE vaiTro = 'quan_tri'`
        );
        console.log('🔍 [IncidentController.create] Query result:', queryResult);
        
        const [admins] = queryResult;
        console.log('🔍 [IncidentController.create] Admins array:', admins);
        console.log('🔍 [IncidentController.create] Found admins:', admins?.length);
        
        if (admins && Array.isArray(admins) && admins.length > 0) {
          console.log('🔍 [IncidentController.create] Creating admin notifications...');
          console.log('🔍 [IncidentController.create] trip object:', trip);
          const adminNotifications = admins.map(admin => ({
            maNguoiNhan: admin.maNguoiDung,
            tieuDe: `🚨 Sự cố ${severityText}: ${typeText}`,
            noiDung: `Chuyến #${maChuyen} (${trip?.tenTuyen || 'N/A'}) - ${trip?.loaiChuyen === 'don_sang' ? 'Đón sáng' : 'Trả chiều'}: ${moTa}${viTri ? ` - Vị trí: ${viTri}` : ''}`,
            loaiThongBao: 'su_co'
          }));
          console.log('✅ [IncidentController.create] Created admin notifications array, count:', adminNotifications.length);

          // Save notifications to DB (use individual create calls)
          await Promise.all(adminNotifications.map(notif => 
            ThongBaoModel.create(notif)
          ));
          console.log(`✅ [IncidentController.create] Saved ${adminNotifications.length} admin notifications to DB`);
          
          // Emit real-time to admins
          if (io) {
            admins.forEach(admin => {
              io.to(`user-${admin.maNguoiDung}`).emit('notification', {
                type: 'su_co',
                title: `🚨 Sự cố ${severityText}`,
                message: `${typeText} - Chuyến #${maChuyen}`,
                severity: mucDo,
                maChuyen,
                maSuCo: created.maSuCo
              });
            });
            console.log(`✅ [IncidentController.create] Sent real-time to ${admins.length} admins`);
          }
        } else {
          console.warn('⚠️ [IncidentController.create] No admins found!');
        }

        // Emit incident update to driver for real-time list refresh
        if (io && trip?.maTaiXe) {
          io.to(`user-${trip.maTaiXe}`).emit('incident-created', {
            maSuCo: created.maSuCo,
            maChuyen,
            mucDo,
            loaiSuCo,
            trangThai: 'moi'
          });
          console.log(`✅ [IncidentController.create] Emitted incident-created to driver ${trip.maTaiXe}`);
        }

        // 2. Notify affected parents (if students specified)
        if (hocSinhLienQuan && Array.isArray(hocSinhLienQuan) && hocSinhLienQuan.length > 0) {
          console.log('🔍 [IncidentController.create] Getting affected students...');
          const affectedStudents = await SuCoModel.getAffectedStudents(created.maSuCo);
          console.log('🔍 [IncidentController.create] Affected students result:', affectedStudents);
          console.log('🔍 [IncidentController.create] Type:', typeof affectedStudents, 'IsArray:', Array.isArray(affectedStudents));
          
          if (!affectedStudents || !Array.isArray(affectedStudents) || affectedStudents.length === 0) {
            console.warn('⚠️ [IncidentController.create] No valid affected students data, skipping parent notifications');
            // Don't return early - continue to send success response
          } else {
            console.log('🔍 [IncidentController.create] Affected students count:', affectedStudents.length);
            const parentIds = [...new Set(affectedStudents.map(s => s.maPhuHuynh).filter(Boolean))];
            console.log('🔍 [IncidentController.create] Parent IDs:', parentIds);
          
            if (parentIds.length > 0) {
              const studentNames = affectedStudents.map(s => s.hoTen).join(', ');
              const parentNotifications = parentIds.map(maPhuHuynh => ({
                maNguoiNhan: maPhuHuynh,
                tieuDe: `⚠️ Sự cố liên quan đến con em`,
                noiDung: `${typeText} (mức độ ${severityText}) trên chuyến xe #${maChuyen} (${trip?.tenTuyen || 'N/A'}). Học sinh liên quan: ${studentNames}. Chi tiết: ${moTa}${viTri ? ` - Vị trí: ${viTri}` : ''}`,
                loaiThongBao: 'su_co'
              }));

              // Save notifications to DB (use individual create calls)
              await Promise.all(parentNotifications.map(notif => ThongBaoModel.create(notif)));
              console.log(`✅ [IncidentController.create] Saved ${parentNotifications.length} parent notifications to DB`);
              
              // Emit real-time to parents
              if (io) {
                parentIds.forEach(maPhuHuynh => {
                  io.to(`user-${maPhuHuynh}`).emit('notification', {
                    type: 'su_co',
                    title: '⚠️ Sự cố liên quan con em',
                    message: `${typeText} trên chuyến #${maChuyen}`,
                    severity: mucDo,
                    maChuyen,
                    maSuCo: created.maSuCo
                  });
                });
                console.log(`✅ [IncidentController.create] Sent real-time to ${parentIds.length} parents`);
              }
            } else {
              console.warn('⚠️ [IncidentController.create] No parent IDs found for affected students');
            }
          }
        } else {
          console.log('🔍 [IncidentController.create] No students specified, skipping parent notifications');
        }
      } catch (notifError) {
        console.error('⚠️ [IncidentController.create] Failed to send notifications:', notifError.message);
        // Don't fail the request, incident is already created
      }

      return res.status(201).json({
        success: true,
        data: created,
        message: "Báo cáo sự cố thành công. Admin và phụ huynh liên quan đã nhận thông báo.",
      });
    } catch (error) {
      console.error("❌ [IncidentController.create] Error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Lỗi server khi báo cáo sự cố",
        error: error.message 
      });
    }
  }

  // PUT /api/v1/incidents/:id
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { moTa, mucDo, trangThai } = req.body;

      console.log(`🔍 [IncidentController.update] Updating incident ${id}:`, { moTa, mucDo, trangThai });

      // Get old incident to check status change
      const oldIncident = await SuCoModel.getById(id);
      if (!oldIncident) {
        return res.status(404).json({ success: false, message: "Không tìm thấy sự cố" });
      }

      const ok = await SuCoModel.update(id, { moTa, mucDo, trangThai });
      if (!ok) {
        return res.status(404).json({ success: false, message: "Không có thay đổi" });
      }
      
      const refreshed = await SuCoModel.getById(id);

      // 🔥 Send notification ONLY when status changes to "da_xu_ly" (resolved)
      if (trangThai && trangThai === 'da_xu_ly' && trangThai !== oldIncident.trangThai) {
        try {
          const ThongBaoModel = (await import("../models/ThongBaoModel.js")).default;
          const { default: pool } = await import("../config/db.js");
          const io = req.app.get("io");

          console.log('🔔 [IncidentController.update] Preparing resolution notifications...');

          const severityMap = { 'nhe': 'nhẹ', 'trung_binh': 'trung bình', 'nghiem_trong': 'nghiêm trọng' };
          const severityText = severityMap[refreshed.mucDo] || refreshed.mucDo;

          // Notify ALL admins about resolution
          const queryResult = await pool.query(
            `SELECT maNguoiDung FROM NguoiDung WHERE vaiTro = 'quan_tri'`
          );
          console.log('🔍 [IncidentController.update] Query result:', queryResult);
          
          const [admins] = queryResult;
          console.log('🔍 [IncidentController.update] Admins array:', admins);
          console.log('🔍 [IncidentController.update] Admins count:', admins?.length);
          
          if (admins && Array.isArray(admins) && admins.length > 0) {
            const adminNotifications = admins.map(admin => ({
              maNguoiNhan: admin.maNguoiDung,
              tieuDe: `✅ Đã xử lý sự cố #${id}`,
              noiDung: `Sự cố mức độ ${severityText} trên chuyến #${refreshed.maChuyen} (${refreshed.tenTuyen || 'N/A'}) đã được xử lý xong. Chi tiết: ${refreshed.moTa}`,
              loaiThongBao: 'su_co'
            }));

            // Create each notification individually
            await Promise.all(adminNotifications.map(notif => ThongBaoModel.create(notif)));
            console.log(`✅ [IncidentController.update] Saved ${adminNotifications.length} admin resolution notifications`);
            
            if (io) {
              admins.forEach(admin => {
                io.to(`user-${admin.maNguoiDung}`).emit('notification', {
                  type: 'su_co',
                  title: '✅ Đã xử lý sự cố',
                  message: `Sự cố #${id} - Chuyến #${refreshed.maChuyen}`,
                  maSuCo: id,
                  trangThai: 'da_xu_ly'
                });
              });
              console.log(`✅ [IncidentController.update] Sent real-time to ${admins.length} admins`);
            }
          }

          // Notify affected parents about resolution
          const affectedStudents = await SuCoModel.getAffectedStudents(id);
          console.log('🔍 [IncidentController.update] Affected students result:', affectedStudents);
          
          if (!affectedStudents || !Array.isArray(affectedStudents)) {
            console.warn('⚠️ [IncidentController.update] affectedStudents is not an array, skipping parent notifications');
            return res.status(200).json({ success: true, data: refreshed, message: "Cập nhật sự cố thành công" });
          }
          
          const parentIds = [...new Set(affectedStudents.map(s => s.maPhuHuynh).filter(Boolean))];
          console.log('🔍 [IncidentController.update] Parent IDs:', parentIds);
          
          if (parentIds.length > 0) {
            const studentNames = affectedStudents.map(s => s.hoTen).join(', ');
            const parentNotifications = parentIds.map(maPhuHuynh => ({
              maNguoiNhan: maPhuHuynh,
              tieuDe: `✅ Sự cố đã xử lý xong`,
              noiDung: `Sự cố liên quan đến con em (${studentNames}) trên chuyến xe #${refreshed.maChuyen} (${refreshed.tenTuyen || 'N/A'}) đã được xử lý xong. Chi tiết: ${refreshed.moTa}`,
              loaiThongBao: 'su_co'
            }));

            // Create each notification individually
            await Promise.all(parentNotifications.map(notif => ThongBaoModel.create(notif)));
            console.log(`✅ [IncidentController.update] Saved ${parentNotifications.length} parent resolution notifications`);
            
            if (io) {
              parentIds.forEach(maPhuHuynh => {
                io.to(`user-${maPhuHuynh}`).emit('notification', {
                  type: 'su_co',
                  title: '✅ Sự cố đã xử lý',
                  message: `Sự cố chuyến #${refreshed.maChuyen} đã được giải quyết`,
                  maSuCo: id
                });
              });
              console.log(`✅ [IncidentController.update] Sent real-time to ${parentIds.length} parents`);
            }
          }
        } catch (notifError) {
          console.error('⚠️ [IncidentController.update] Failed to send notifications:', notifError.message);
        }
      }

      return res.status(200).json({ success: true, data: refreshed, message: "Cập nhật sự cố thành công" });
    } catch (error) {
      console.error("❌ [IncidentController.update] Error:", error);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  }

  // PATCH /api/v1/incidents/:id/level
  static async updateLevel(req, res) {
    try {
      const { id } = req.params;
      const { mucDo } = req.body;
      if (!mucDo) {
        return res.status(400).json({ success: false, message: "Thiếu mucDo" });
      }
      const ok = await SuCoModel.updateLevel(id, mucDo);
      if (!ok) {
        return res.status(404).json({ success: false, message: "Không tìm thấy sự cố" });
      }
      const refreshed = await SuCoModel.getById(id);
      return res.status(200).json({ success: true, data: refreshed, message: "Cập nhật mức độ thành công" });
    } catch (error) {
      console.error("IncidentController.updateLevel error:", error);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  }

  // DELETE /api/v1/incidents/:id
  static async remove(req, res) {
    try {
      const { id } = req.params;
      const ok = await SuCoModel.delete(id);
      if (!ok) {
        return res.status(404).json({ success: false, message: "Không tìm thấy sự cố" });
      }
      return res.status(200).json({ success: true, message: "Xóa sự cố thành công" });
    } catch (error) {
      console.error("IncidentController.remove error:", error);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  }
}

export default IncidentController;
