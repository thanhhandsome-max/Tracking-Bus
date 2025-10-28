import ChuyenDiModel from "../models/ChuyenDiModel.js";
import LichTrinhModel from "../models/LichTrinhModel.js";

class TripService {
  static async startTrip(tripId) {
    const trip = await ChuyenDiModel.getById(tripId);
    if (!trip) {
      throw new Error("Không tìm thấy chuyến đi");
    }

    if (trip.trangThai !== "chua_khoi_hanh") {
      throw new Error("Chỉ có thể bắt đầu chuyến đi chưa khởi hành");
    }

    const startTime = new Date().toISOString();
    console.log("🕐 [DEBUG] startTime:", startTime);

    const isUpdated = await ChuyenDiModel.update(tripId, {
      trangThai: "dang_chay",
      gioBatDauThucTe: startTime,
    });

    console.log("📤 [DEBUG] Update data:", {
      tripId,
      trangThai: "dang_chay",
      gioBatDauThucTe: startTime,
    });
    console.log("✅ [DEBUG] Update result:", isUpdated);

    if (!isUpdated) {
      throw new Error("Không thể bắt đầu chuyến đi");
    }

    const updatedTrip = await ChuyenDiModel.getById(tripId);

    console.log("[WS-Event] trip_started", {
      tripId: updatedTrip.maChuyen,
      startTs: new Date().toISOString(),
    });

    return updatedTrip;
  }
}

export default TripService;

// ============================================================
// 📚 TÀI LIỆU HƯỚNG DẪN - TRIP SERVICE
// ============================================================

/**
 * 🎯 MỤC ĐÍCH FILE NÀY
 *
 * File tripService.js chứa các hàm xử lý nghiệp vụ (business logic) cho chuyến đi.
 *
 * Công việc chính:
 * - Kiểm tra dữ liệu hợp lệ (validate)
 * - Gọi Model để query database
 * - Xử lý logic nghiệp vụ (ví dụ: chỉ start chuyến chưa khởi hành)
 * - Trả kết quả về cho Controller
 *
 * ═══════════════════════════════════════════════════════════
 *
 * 🏗️ KIẾN TRÚC HỆ THỐNG (LAYERED ARCHITECTURE)
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  ROUTE                                                  │
 * │  POST /api/trips/:id/start                             │
 * │  Nhiệm vụ: Bắt request từ client, gắn middleware       │
 * └────────────────────┬────────────────────────────────────┘
 *                      ↓
 * ┌─────────────────────────────────────────────────────────┐
 * │  CONTROLLER                                             │
 * │  TripController.startTrip(req, res)                    │
 * │  Nhiệm vụ: Lấy data từ req, gọi Service, trả response  │
 * └────────────────────┬────────────────────────────────────┘
 *                      ↓
 * ┌─────────────────────────────────────────────────────────┐
 * │  SERVICE ← BẠN ĐANG Ở ĐÂY!                             │
 * │  tripService.startTrip(tripId)                         │
 * │  Nhiệm vụ: Validate, gọi Model, xử lý logic nghiệp vụ  │
 * └────────────────────┬────────────────────────────────────┘
 *                      ↓
 * ┌─────────────────────────────────────────────────────────┐
 * │  MODEL                                                  │
 * │  ChuyenDiModel.getById(), ChuyenDiModel.update()       │
 * │  Nhiệm vụ: Thực thi SQL queries, tương tác với DB      │
 * └────────────────────┬────────────────────────────────────┘
 *                      ↓
 * ┌─────────────────────────────────────────────────────────┐
 * │  DATABASE                                               │
 * │  MySQL: SELECT, UPDATE, INSERT, DELETE                 │
 * └─────────────────────────────────────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════
 *
 * 💡 TẠI SAO CẦN SERVICE LAYER?
 *
 * Giống như bạn đi ăn nhà hàng:
 * - ROUTE = Cửa hàng (tiếp khách)
 * - CONTROLLER = Phục vụ (lấy order, mang đồ ra)
 * - SERVICE = Đầu bếp (nấu ăn, xử lý món) ← QUAN TRỌNG!
 * - MODEL = Kho nguyên liệu (lấy thịt, rau...)
 * - DATABASE = Tủ lạnh (lưu trữ thực phẩm)
 *
 * ❌ KHÔNG CÓ SERVICE (BAD):
 * Controller phải làm tất cả:
 * - Validate dữ liệu
 * - Query database
 * - Tính toán logic
 * - Trả response
 * → Code dài, khó đọc, khó test, khó tái sử dụng
 *
 * ✅ CÓ SERVICE (GOOD):
 * - Controller: Chỉ xử lý request/response
 * - Service: Chứa logic nghiệp vụ, có thể tái sử dụng
 * - Model: Chỉ query database
 * → Rõ ràng, dễ test, dễ maintain
 *
 * ═══════════════════════════════════════════════════════════
 */

/**
 * 📖 CHI TIẾT HÀM startTrip()
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  HÀM: startTrip(tripId)                                │
 * ├─────────────────────────────────────────────────────────┤
 * │  INPUT:  tripId (số) - ID của chuyến đi               │
 * │  OUTPUT: trip object - Chuyến đi sau khi cập nhật      │
 * │  LỖI:    Throw Error nếu không hợp lệ                  │
 * └─────────────────────────────────────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════
 *
 * 🔄 FLOW HOẠT ĐỘNG (7 BƯỚC)
 *
 * Bước 1: KIỂM TRA CHUYẾN ĐI TỒN TẠI
 * ────────────────────────────────────────────────────────
 * const trip = await ChuyenDiModel.getById(tripId);
 *
 * - Gọi Model để query: SELECT * FROM ChuyenDi WHERE maChuyen = ?
 * - Trả về: object trip (nếu tìm thấy) hoặc null (không tìm thấy)
 * - Nếu null → Throw "Không tìm thấy chuyến đi"
 *
 * Tại sao cần check?
 * - Tránh update record không tồn tại (lỗi DB)
 * - Trả lỗi rõ ràng cho client (404 Not Found)
 *
 *
 * Bước 2: KIỂM TRA TRẠNG THÁI HỢP LỆ
 * ────────────────────────────────────────────────────────
 * if (trip.trangThai !== "chua_khoi_hanh") { throw error }
 *
 * - Business rule: Chỉ start được chuyến "chua_khoi_hanh"
 * - Các trạng thái KHÔNG hợp lệ:
 *   + "dang_chay" → Đã start rồi (duplicate)
 *   + "da_hoan_thanh" → Đã kết thúc
 *   + "bi_huy" → Đã bị hủy
 *
 * Ví dụ:
 * - trip.trangThai = "chua_khoi_hanh" ✅ OK, tiếp tục
 * - trip.trangThai = "dang_chay" ❌ Throw error
 *
 *
 * Bước 3: TÍNH TOÁN THỜI GIAN BẮT ĐẦU
 * ────────────────────────────────────────────────────────
 * const startTime = new Date().toISOString();
 *
 * - new Date() → Thời gian server hiện tại
 * - toISOString() → "2025-10-27T01:30:45.123Z"
 * - slice(11, 19) → "01:30:45" (HH:MM:SS)
 *
 * Giải thích:
 * - DB lưu gioBatDauThucTe kiểu TIME (chỉ giờ, không có ngày)
 * - ISO format: YYYY-MM-DDTHH:MM:SS.sssZ
 * - Cắt index 11-19 để lấy giờ:phút:giây
 *
 *
 * Bước 4: CẬP NHẬT DATABASE
 * ────────────────────────────────────────────────────────
 * const isUpdated = await ChuyenDiModel.update(tripId, { ... });
 *
 * - Gọi Model.update() → Thực thi SQL:
 *   UPDATE ChuyenDi
 *   SET trangThai = 'dang_chay',
 *       gioBatDauThucTe = '08:30:00'
 *   WHERE maChuyen = 123
 *
 * - Model.update() trả về:
 *   + true: Cập nhật thành công (affectedRows > 0)
 *   + false: Không có dòng nào bị ảnh hưởng
 *
 * - Nếu false → Throw "Không thể bắt đầu chuyến đi"
 *
 *
 * Bước 5: LẤY DỮ LIỆU MỚI NHẤT
 * ────────────────────────────────────────────────────────
 * const updatedTrip = await ChuyenDiModel.getById(tripId);
 *
 * - Query lại DB để lấy trip sau khi update
 * - SQL: SELECT * FROM ChuyenDi WHERE maChuyen = 123
 *
 * Tại sao phải SELECT lại?
 * - MySQL UPDATE không trả về data đã update
 * - Cần data mới để:
 *   + Trả về cho client (response body)
 *   + Emit Socket.IO event (Day 3)
 *   + Hiển thị thông tin đầy đủ trên UI
 *
 * Note: PostgreSQL có UPDATE ... RETURNING * (không cần SELECT lại)
 *
 *
 * Bước 6: LOG EVENT (CHỜ SOCKET.IO DAY 3)
 * ────────────────────────────────────────────────────────
 * console.log("[WS-Event] trip_started", { ... });
 *
 * - Hiện tại: Chỉ console.log để debug
 * - Day 3: Sẽ emit Socket.IO event "trip_started"
 *
 * Event format sẽ như:
 * {
 *   event: "trip_started",
 *   tripId: 123,
 *   busId: 5,
 *   driverId: 10,
 *   startTs: "2025-10-27T08:30:00Z"
 * }
 *
 * Tại sao không emit ở đây?
 * - Service không có access vào Socket.IO instance
 * - Socket.IO instance ở Controller: req.app.get("io")
 * - Nguyên tắc: Service làm logic, Controller làm I/O (input/output)
 *
 *
 * Bước 7: TRẢ VỀ DỮ LIỆU
 * ────────────────────────────────────────────────────────
 * return updatedTrip;
 *
 * - Trả trip object về cho Controller
 * - Controller dùng data này để:
 *   + Tạo JSON response
 *   + Emit Socket.IO event (Day 3)
 *
 * Data structure:
 * {
 *   maChuyen: 123,
 *   maLichTrinh: 5,
 *   ngayChay: "2025-10-27",
 *   trangThai: "dang_chay",        ← Đã đổi từ "chua_khoi_hanh"
 *   gioBatDauThucTe: "08:30:00",   ← Đã set thời gian thực tế
 *   gioKetThucThucTe: null,
 *   ghiChu: null
 * }
 *
 * ═══════════════════════════════════════════════════════════
 */

/**
 * 🧪 VÍ DỤ SỬ DỤNG
 *
 * ─────────────────────────────────────────────────────────
 * CASE 1: START TRIP THÀNH CÔNG
 * ─────────────────────────────────────────────────────────
 *
 * // Trong Controller:
 * const tripId = req.params.id; // "123"
 * const trip = await tripService.startTrip(tripId);
 *
 * console.log(trip);
 * // {
 * //   maChuyen: 123,
 * //   trangThai: "dang_chay",
 * //   gioBatDauThucTe: "08:30:00",
 * //   ...
 * // }
 *
 * res.json({ success: true, trip });
 *
 * ─────────────────────────────────────────────────────────
 * CASE 2: TRIP KHÔNG TỒN TẠI (404)
 * ─────────────────────────────────────────────────────────
 *
 * try {
 *   await tripService.startTrip(999); // Trip không tồn tại
 * } catch (error) {
 *   console.log(error.message); // "Không tìm thấy chuyến đi"
 *   res.status(404).json({ error: error.message });
 * }
 *
 * ─────────────────────────────────────────────────────────
 * CASE 3: TRIP ĐÃ START RỒI (400)
 * ─────────────────────────────────────────────────────────
 *
 * try {
 *   await tripService.startTrip(123); // Trip đang có trangThai = "dang_chay"
 * } catch (error) {
 *   console.log(error.message); // "Chỉ có thể bắt đầu chuyến đi chưa khởi hành"
 *   res.status(400).json({ error: error.message });
 * }
 *
 * ═══════════════════════════════════════════════════════════
 */

/**
 * 📊 BẢNG LỖI CÓ THỂ XẢY RA
 *
 * ┌──────┬────────────────────────────────────┬─────────────────────┐
 * │ Code │ Message                            │ Nguyên nhân         │
 * ├──────┼────────────────────────────────────┼─────────────────────┤
 * │ 404  │ Không tìm thấy chuyến đi          │ tripId không tồn tại│
 * │ 400  │ Chỉ có thể bắt đầu chuyến đi...   │ Trạng thái sai      │
 * │ 500  │ Không thể bắt đầu chuyến đi       │ Lỗi update DB       │
 * └──────┴────────────────────────────────────┴─────────────────────┘
 *
 * Cách xử lý lỗi:
 * - Service throw Error
 * - Controller catch và trả HTTP status code phù hợp
 * - Client nhận error message rõ ràng
 *
 * ═══════════════════════════════════════════════════════════
 */

/**
 * 🔐 BẢO MẬT VÀ PHÂN QUYỀN
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  ĐIỂM QUAN TRỌNG: Service KHÔNG kiểm tra authentication│
 * └─────────────────────────────────────────────────────────┘
 *
 * Tại sao?
 * - Authentication (đăng nhập) đã làm ở AuthMiddleware
 * - Service chỉ validate business rules (quy tắc nghiệp vụ)
 * - Authorization (phân quyền) nên làm ở Controller/Middleware
 *
 * Ví dụ phân công:
 * - Middleware: Kiểm tra user đã đăng nhập? (authenticate)
 * - Controller: Kiểm tra user có quyền start trip này? (authorize)
 * - Service: Kiểm tra trip có thể start? (business logic)
 *
 * ═══════════════════════════════════════════════════════════
 */

/**
 * ⚡ HIỆU NĂNG (PERFORMANCE)
 *
 * Số lượng database queries:
 * 1. SELECT để check trip exists (getById)
 * 2. UPDATE để đổi trạng thái (update)
 * 3. SELECT để lấy data mới (getById)
 *
 * Tổng: 3 queries cho 1 lần startTrip
 *
 * ─────────────────────────────────────────────────────────
 * CÓ THỂ TỐI ƯU BẰNG CÁCH:
 * ─────────────────────────────────────────────────────────
 *
 * Option 1: Dùng PostgreSQL
 * - UPDATE ... RETURNING * → Trả data sau khi update
 * - Giảm từ 3 queries xuống 2 queries
 *
 * Option 2: Cache trong memory
 * - Lưu trip data vào Redis/memory cache
 * - Chỉ query DB khi cần thiết
 *
 * Option 3: Optimistic locking
 * - Không check trước, update luôn với WHERE điều kiện
 * - UPDATE ... WHERE maChuyen=? AND trangThai='chua_khoi_hanh'
 * - Nếu affectedRows=0 → Trip không hợp lệ
 *
 * Hiện tại: Chọn cách đơn giản, dễ hiểu (3 queries)
 *
 * ═══════════════════════════════════════════════════════════
 */

/**
 * 🔗 LIÊN KẾT VỚI CÁC PHẦN KHÁC
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  FILES LIÊN QUAN                                        │
 * ├─────────────────────────────────────────────────────────┤
 * │  • Controller: TripController.startTrip()              │
 * │    Gọi hàm này để start trip                           │
 * │                                                         │
 * │  • Model: ChuyenDiModel.getById(), .update()           │
 * │    Thực thi SQL queries                                │
 * │                                                         │
 * │  • Day 3: Socket.IO                                    │
 * │    Emit event "trip_started" sau khi gọi hàm này       │
 * │                                                         │
 * │  • Day 4: GPS Telemetry                                │
 * │    Sau start, driver gửi GPS liên tục                  │
 * └─────────────────────────────────────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════
 */

/**
 * 📝 TODO - HÀM SẼ BỔ SUNG TRONG TƯƠNG LAI
 *
 * ─────────────────────────────────────────────────────────
 * DAY 4 (29/10):
 * ─────────────────────────────────────────────────────────
 *
 * 1. endTrip(tripId)
 *    - Kết thúc chuyến đi
 *    - Đổi trạng thái: "dang_chay" → "da_hoan_thanh"
 *    - Lưu gioKetThucThucTe
 *
 * 2. receiveTelemetry(tripId, gpsData)
 *    - Nhận GPS data từ driver
 *    - Lưu vào bảng ViTriTheoDoiXe
 *    - Broadcast đến phụ huynh qua Socket.IO
 *
 * 3. checkGeofence(tripId, lat, lng)
 *    - Kiểm tra xe có gần điểm dừng không
 *    - Dùng haversineDistance() từ geo.js
 *    - Nếu < 500m → Gửi thông báo "Xe sắp đến"
 *
 * ─────────────────────────────────────────────────────────
 * DAY 5 (30/10):
 * ─────────────────────────────────────────────────────────
 *
 * 4. getAllTrips(filters, pagination)
 *    - Lấy danh sách trip (có filter theo date, status...)
 *    - Hỗ trợ phân trang (limit, offset)
 *
 * 5. createTrip(scheduleId, date)
 *    - Tạo trip mới từ schedule
 *    - Auto tạo trip cho ngày mai
 *
 * ─────────────────────────────────────────────────────────
 * VÍ DỤ HÀM endTrip():
 * ─────────────────────────────────────────────────────────
 *
 * static async endTrip(tripId) {
 *   const trip = await ChuyenDiModel.getById(tripId);
 *   if (!trip) throw new Error("Không tìm thấy chuyến đi");
 *
 *   if (trip.trangThai !== "dang_chay") {
 *     throw new Error("Chỉ có thể kết thúc chuyến đang chạy");
 *   }
 *
 *   const endTime = new Date().toISOString().slice(11, 19);
 *   await ChuyenDiModel.update(tripId, {
 *     trangThai: "da_hoan_thanh",
 *     gioKetThucThucTe: endTime
 *   });
 *
 *   return await ChuyenDiModel.getById(tripId);
 * }
 *
 * ═══════════════════════════════════════════════════════════
 */

/**
 * 🎓 BÀI HỌC QUAN TRỌNG
 *
 * 1️⃣ SINGLE RESPONSIBILITY PRINCIPLE
 *    - Mỗi hàm chỉ làm 1 việc rõ ràng
 *    - startTrip() chỉ lo start trip, không lo response/authentication
 *
 * 2️⃣ SEPARATION OF CONCERNS
 *    - Service lo logic nghiệp vụ
 *    - Controller lo HTTP request/response
 *    - Model lo database queries
 *
 * 3️⃣ TESTABILITY
 *    - Có thể test Service riêng mà không cần HTTP request
 *    - Mock ChuyenDiModel dễ dàng
 *
 * 4️⃣ REUSABILITY
 *    - Có thể gọi startTrip() từ:
 *      + REST API (Controller)
 *      + Cronjob (auto start trip vào 7:00 sáng)
 *      + WebSocket handler
 *      + Admin dashboard
 *
 * 5️⃣ ERROR HANDLING
 *    - Service throw Error rõ ràng
 *    - Controller catch và trả HTTP status code
 *    - Client nhận error message dễ hiểu
 *
 * ═══════════════════════════════════════════════════════════
 *
 * @author Nguyễn Tuấn Tài - M4/M5/M6
 * @date 2025-10-27 (Day 2 - Trip Lifecycle)
 * @lastUpdate 2025-10-28 (Refactor comments to end of file)
 */
