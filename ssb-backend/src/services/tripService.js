/**
 * 🚌 TRIP SERVICE - Lớp xử lý logic nghiệp vụ cho Trip
 *
 * 🎯 MỤC ĐÍCH FILE NÀY:
 * - Tách logic nghiệp vụ (business logic) ra khỏi Controller
 * - Xử lý tương tác với Database thông qua Model
 * - Validate dữ liệu trước khi cập nhật DB
 * - Tái sử dụng code (reusable logic)
 *
 * 🏗️ KIẾN TRÚC LAYERED:
 * Route → Controller → Service → Model → Database
 *   ↑         ↑          ↑        ↑        ↑
 *  URL   Request/     Business  Database  MySQL
 *       Response      Logic     Queries
 *
 * 📖 TẠI SAO CẦN SERVICE LAYER?
 *
 * ❌ KHÔNG CÓ SERVICE (BAD):
 * Controller làm tất cả:
 * - Validate dữ liệu
 * - Query database
 * - Tính toán logic
 * - Trả response
 * → Code dài, khó test, khó tái sử dụng
 *
 * ✅ CÓ SERVICE (GOOD):
 * Controller: Chỉ xử lý request/response
 * Service: Chứa logic nghiệp vụ, có thể tái sử dụng
 * Model: Chỉ query database
 * → Rõ ràng, dễ test, dễ maintain
 *
 * 🔧 VÍ DỤ SỬ DỤNG:
 * ```javascript
 * // Trong Controller:
 * const trip = await tripService.startTrip(tripId);
 * res.json({ success: true, trip });
 *
 * // Service xử lý tất cả logic:
 * // - Kiểm tra trip tồn tại
 * // - Kiểm tra trạng thái hợp lệ
 * // - Cập nhật database
 * // - Trả về trip mới
 * ```
 *
 * @author Nguyễn Tuấn Tài - M4/M5/M6
 * @date 2025-10-27 (Day 2 - Trip Lifecycle)
 */

import ChuyenDiModel from "../models/ChuyenDiModel.js";
import LichTrinhModel from "../models/LichTrinhModel.js";

class TripService {
  /**
   * 🚀 BẮT ĐẦU CHUYẾN ĐI
   *
   * 🎯 Mục đích:
   * - Cập nhật trạng thái chuyến đi từ "chua_khoi_hanh" → "dang_chay"
   * - Ghi lại thời gian bắt đầu thực tế
   * - Validate các điều kiện trước khi start
   *
   * 📖 GIẢI THÍCH LOGIC:
   * Hàm này nhận vào tripId và thực hiện các bước sau:
   *
   * Bước 1: KIỂM TRA CHUYẾN ĐI TỒN TẠI
   * - Gọi Model để query database
   * - Nếu không tìm thấy → Throw error (Controller sẽ catch)
   *
   * Bước 2: KIỂM TRA TRẠNG THÁI HỢP LỆ
   * - Chỉ cho phép start chuyến có trạng thái "chua_khoi_hanh"
   * - Nếu đang chạy rồi → Throw error
   * - Nếu đã hoàn thành → Throw error
   *
   * Bước 3: CẬP NHẬT DATABASE
   * - Đổi trangThai → "dang_chay"
   * - Lưu gioBatDauThucTe = NOW()
   * - Gọi Model.update()
   *
   * Bước 4: TRẢ VỀ DỮ LIỆU MỚI
   * - Query lại trip từ DB để lấy data mới nhất
   * - Trả về cho Controller
   *
   * 🔄 FLOW HOẠT ĐỘNG:
   * ```
   * Driver nhấn "Bắt đầu chuyến"
   *   ↓
   * POST /api/trips/123/start
   *   ↓
   * TripController.startTrip(req, res)
   *   ↓
   * tripService.startTrip(123) ← ĐÂY!
   *   ↓
   * Step 1: Check trip exists?
   *   ↓
   * Step 2: Check status = "chua_khoi_hanh"?
   *   ↓
   * Step 3: UPDATE ChuyenDi SET trangThai='dang_chay', gioBatDauThucTe=NOW()
   *   ↓
   * Step 4: SELECT * FROM ChuyenDi WHERE maChuyen=123
   *   ↓
   * Return trip object → Controller → Response
   * ```
   *
   * 🧪 VÍ DỤ SỬ DỤNG:
   * ```javascript
   * // Trong Controller:
   * try {
   *   const tripId = req.params.id; // "123"
   *   const trip = await tripService.startTrip(tripId);
   *
   *   console.log(trip);
   *   // {
   *   //   maChuyen: 123,
   *   //   trangThai: "dang_chay",
   *   //   gioBatDauThucTe: "08:30:00",
   *   //   ...
   *   // }
   *
   *   res.json({ success: true, trip });
   * } catch (error) {
   *   res.status(404).json({ error: error.message });
   * }
   * ```
   *
   * @param {number|string} tripId - ID của chuyến đi (maChuyen)
   *
   * @returns {Promise<Object>} Trip object sau khi cập nhật:
   * ```javascript
   * {
   *   maChuyen: 123,
   *   maLichTrinh: 5,
   *   ngayChay: "2025-10-27",
   *   trangThai: "dang_chay",           // ← Changed from "chua_khoi_hanh"
   *   gioBatDauThucTe: "08:30:00",      // ← NEW!
   *   gioKetThucThucTe: null,
   *   ghiChu: null,
   *   createdAt: "2025-10-26T10:00:00Z",
   *   updatedAt: "2025-10-27T01:30:00Z" // ← Updated
   * }
   * ```
   *
   * @throws {Error} Các lỗi có thể xảy ra:
   * - "Không tìm thấy chuyến đi" (404) - Trip không tồn tại
   * - "Chỉ có thể bắt đầu chuyến đi chưa khởi hành" (400) - Trạng thái sai
   * - "Không thể bắt đầu chuyến đi" (500) - Lỗi update DB
   *
   * 💡 TẠI SAO CẦN HÀM NÀY?
   * - Tách logic nghiệp vụ ra khỏi Controller
   * - Dễ test: Có thể test riêng service mà không cần HTTP request
   * - Tái sử dụng: Có thể gọi từ nhiều nơi (API, cronjob, WebSocket...)
   * - Single Responsibility: Mỗi hàm làm 1 việc rõ ràng
   *
   * 🔐 BẢO MẬT:
   * - Service không kiểm tra authentication (đã làm ở middleware)
   * - Service chỉ validate business rules
   * - Authorization (kiểm tra quyền) nên làm ở Controller hoặc Middleware
   *
   * ⚠️ LƯU Ý:
   * - Hàm này KHÔNG emit Socket.IO events (để Controller làm)
   * - Tại sao? Vì Socket.IO cần `req.app.get("io")` từ Controller
   * - Service chỉ lo logic nghiệp vụ, không lo giao tiếp realtime
   *
   * 📊 PERFORMANCE:
   * - 2 database queries:
   *   1. SELECT để check trip (ChuyenDiModel.getById)
   *   2. UPDATE để cập nhật (ChuyenDiModel.update)
   *   3. SELECT để lấy data mới (ChuyenDiModel.getById)
   * - Có thể optimize: Trả về data từ UPDATE thay vì SELECT lại
   *
   * 🔗 LIÊN KẾT VỚI CÁC PHẦN KHÁC:
   * - Controller: TripController.startTrip() gọi hàm này
   * - Model: ChuyenDiModel.getById(), ChuyenDiModel.update()
   * - Day 3: Socket.IO sẽ emit event "trip_started" sau khi gọi hàm này
   * - Day 4: Sau khi start, driver sẽ bắt đầu gửi GPS telemetry
   */
  static async startTrip(tripId) {
    /**
     * 🔍 BƯỚC 1: KIỂM TRA CHUYẾN ĐI CÓ TỒN TẠI KHÔNG?
     *
     * Giải thích:
     * - Gọi Model để query database: SELECT * FROM ChuyenDi WHERE maChuyen = ?
     * - Model.getById() trả về:
     *   + Object trip nếu tìm thấy
     *   + null nếu không tìm thấy
     *
     * Tại sao cần check?
     * - Tránh update một record không tồn tại (sẽ lỗi DB)
     * - Trả về lỗi rõ ràng cho client: "Không tìm thấy chuyến đi"
     */
    const trip = await ChuyenDiModel.getById(tripId);

    if (!trip) {
      // Throw error → Controller sẽ catch và trả 404
      throw new Error("Không tìm thấy chuyến đi");
    }

    /**
     * 🚦 BƯỚC 2: KIỂM TRA TRẠNG THÁI HỢP LỆ
     *
     * Giải thích:
     * - Business rule: Chỉ cho phép start chuyến có trạng thái "chua_khoi_hanh"
     * - Các trường hợp KHÔNG hợp lệ:
     *   + "dang_chay" → Chuyến đã start rồi
     *   + "da_hoan_thanh" → Chuyến đã kết thúc
     *   + "bi_huy" → Chuyến đã bị hủy
     *
     * Tại sao cần check?
     * - Tránh start 2 lần (duplicate)
     * - Đảm bảo logic nghiệp vụ đúng
     * - Trả về lỗi rõ ràng cho driver
     *
     * Ví dụ:
     * - trip.trangThai = "chua_khoi_hanh" → OK, tiếp tục
     * - trip.trangThai = "dang_chay" → Throw error
     */
    if (trip.trangThai !== "chua_khoi_hanh") {
      throw new Error("Chỉ có thể bắt đầu chuyến đi chưa khởi hành");
    }

    /**
     * ⏰ BƯỚC 3: TÍNH TOÁN THỜI GIAN BẮT ĐẦU
     *
     * Giải thích:
     * - new Date() → Lấy thời gian hiện tại của server
     * - toISOString() → Chuyển sang định dạng ISO: "2025-10-27T01:30:45.123Z"
     * - slice(11, 19) → Cắt lấy phần HH:MM:SS: "08:30:45"
     *
     * Ví dụ:
     * - new Date().toISOString() = "2025-10-27T01:30:45.123Z"
     * - slice(11, 19) = "01:30:45"
     *
     * Tại sao dùng slice(11, 19)?
     * - Database lưu gioBatDauThucTe kiểu TIME (HH:MM:SS)
     * - ISO string format: YYYY-MM-DDTHH:MM:SS.sssZ
     * - Index 11-19: "HH:MM:SS" (giờ, phút, giây)
     *
     * Note: Có thể cải thiện bằng cách dùng NOW() của MySQL
     */
    const startTime = new Date().toISOString();

    // DEBUG: Log giá trị startTime
    console.log("🕐 [DEBUG] startTime:", startTime);

    /**
     * 💾 BƯỚC 4: CẬP NHẬT DATABASE
     *
     * Giải thích:
     * - Gọi Model.update() để thực thi SQL UPDATE
     * - SQL query sẽ như sau:
     *   UPDATE ChuyenDi
     *   SET trangThai = 'dang_chay',
     *       gioBatDauThucTe = '08:30'
     *   WHERE maChuyen = 123
     *
     * Dữ liệu cập nhật:
     * - trangThai: "chua_khoi_hanh" → "dang_chay"
     * - gioBatDauThucTe: null → "08:30:00"
     *
     * Model.update() trả về:
     * - true nếu cập nhật thành công (affectedRows > 0)
     * - false nếu không có dòng nào bị ảnh hưởng
     *
     * Tại sao cần check isUpdated?
     * - Đảm bảo UPDATE thành công
     * - Nếu false → Có vấn đề với DB (lock, constraint...)
     */
    const isUpdated = await ChuyenDiModel.update(tripId, {
      trangThai: "dang_chay", // Trạng thái mới
      gioBatDauThucTe: startTime, // Thời gian bắt đầu thực tế
    });

    // DEBUG: Log data đã gửi
    console.log("📤 [DEBUG] Update data:", {
      tripId,
      trangThai: "dang_chay",
      gioBatDauThucTe: startTime,
    });
    console.log("✅ [DEBUG] Update result:", isUpdated);

    // Nếu update thất bại → Throw error
    if (!isUpdated) {
      throw new Error("Không thể bắt đầu chuyến đi");
    }

    /**
     * 🔄 BƯỚC 5: LẤY DỮ LIỆU MỚI NHẤT
     *
     * Giải thích:
     * - Query lại database để lấy trip đã cập nhật
     * - SQL: SELECT * FROM ChuyenDi WHERE maChuyen = 123
     *
     * Tại sao phải query lại?
     * - MySQL UPDATE không trả về data đã update
     * - Cần data mới để:
     *   + Trả về cho client (response)
     *   + Emit Socket.IO event (Day 3)
     *   + Hiển thị thông tin đầy đủ trên UI
     *
     * Có thể optimize?
     * - Có, dùng UPDATE ... RETURNING * (PostgreSQL)
     * - Hoặc cache data trong memory
     * - Nhưng với MySQL phải SELECT lại
     */
    const updatedTrip = await ChuyenDiModel.getById(tripId);

    /**
     * 📝 BƯỚC 6: LOG EVENT (CHỜ SOCKET.IO DAY 3)
     *
     * Giải thích:
     * - Hiện tại: Chỉ console.log để debug
     * - Day 3: Sẽ emit Socket.IO event "trip_started"
     *
     * Console.log để làm gì?
     * - Debug: Xem hàm có chạy đúng không
     * - Tracking: Ghi log khi nào trip start
     * - Chuẩn bị cho Socket.IO: Xem data cần emit
     *
     * Format event:
     * - Event name: "trip_started"
     * - Payload: { tripId, busId, driverId, startTs }
     *
     * Tại sao không emit ở đây?
     * - Service không có access vào `req.app.get("io")`
     * - Socket.IO instance chỉ có ở Controller
     * - Nguyên tắc: Service làm logic, Controller làm I/O
     */
    console.log("[WS-Event] trip_started", {
      tripId: updatedTrip.maChuyen,
      startTs: new Date().toISOString(),
    });

    /**
     * ✅ BƯỚC 7: TRẢ VỀ DỮ LIỆU
     *
     * Giải thích:
     * - Return trip object về cho Controller
     * - Controller sẽ dùng data này để:
     *   + Tạo JSON response
     *   + Emit Socket.IO event (Day 3)
     *
     * Data structure:
     * {
     *   maChuyen: 123,
     *   maLichTrinh: 5,
     *   ngayChay: "2025-10-27",
     *   trangThai: "dang_chay",     ← Đã đổi
     *   gioBatDauThucTe: "08:30",   ← Đã set
     *   gioKetThucThucTe: null,
     *   ghiChu: null
     * }
     */
    return updatedTrip;
  }

  /**
   * 📝 TODO - CÁC HÀM SERVICE SẼ BỔ SUNG:
   *
   * Day 4 (29/10):
   * - endTrip(tripId, endTime) → Kết thúc chuyến đi
   * - receiveTelemetry(tripId, gpsData) → Nhận GPS từ driver
   * - checkGeofence(tripId, lat, lng) → Kiểm tra xe gần điểm dừng
   *
   * Day 5 (30/10):
   * - getAllTrips(filters, pagination) → Lấy danh sách trip
   * - createTrip(scheduleId, date) → Tạo trip từ schedule
   *
   * Ví dụ hàm sẽ thêm:
   *
   * static async endTrip(tripId) {
   *   const trip = await ChuyenDiModel.getById(tripId);
   *   if (!trip) throw new Error("Không tìm thấy chuyến đi");
   *   if (trip.trangThai !== "dang_chay") {
   *     throw new Error("Chỉ có thể kết thúc chuyến đang chạy");
   *   }
   *
   *   const endTime = new Date().toISOString().slice(11, 16);
   *   await ChuyenDiModel.update(tripId, {
   *     trangThai: "da_hoan_thanh",
   *     gioKetThucThucTe: endTime
   *   });
   *
   *   return await ChuyenDiModel.getById(tripId);
   * }
   */
}

export default TripService;
