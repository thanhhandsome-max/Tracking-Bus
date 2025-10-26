/**
 * 🔐 WEBSOCKET AUTHENTICATION UTILITIES
 *
 * 🎯 MỤC ĐÍCH:
 * - Xác thực JWT token khi client kết nối Socket.IO
 * - Giải mã token để lấy thông tin user (id, role, email)
 * - Bảo vệ WebSocket connections khỏi truy cập trái phép
 *
 * 🔧 SỬ DỤNG CHO:
 * - M4: Realtime Tracking - Xác thực khi client connect Socket.IO
 * - Socket.IO middleware: io.use(authMiddleware)
 * - Kiểm tra quyền truy cập rooms (bus-*, trip-*, user-*)
 *
 * ⚠️ QUAN TRỌNG:
 * - File này là MOCK/SƯỜN tạm thời cho Ngày 1
 * - Ngày 3 sẽ tích hợp helper THẬT từ Q.Thắng (BE Auth team)
 * - Q.Thắng đang làm AuthMiddleware.js với JWT verify đầy đủ
 *
 * 📚 LIÊN KẾT:
 * - Phối hợp với: src/middlewares/AuthMiddleware.js (Q.Thắng)
 * - Sử dụng trong: src/ws/index.ts (Socket.IO server)
 * - Tham khảo: docs/ws_events.md (phần Authentication)
 *
 * @author Nguyễn Tuấn Tài - M4/M5/M6
 * @date 2025-10-26 (Ngày 1 - Mock version)
 * @todo Chờ helper hoàn chỉnh từ Q.Thắng (BE Auth) để tích hợp sau (Ngày 3)
 */

// TODO: Chờ helper hoàn chỉnh từ Q.Thắng (BE Auth) để tích hợp sau.

import jwt from "jsonwebtoken";

/**
 * 🔑 Hàm xác thực JWT token cho WebSocket connections
 *
 * 📖 GIẢI THÍCH:
 * - Khi client kết nối Socket.IO, phải gửi kèm JWT token
 * - Token này được tạo khi user đăng nhập (POST /api/v1/auth/login)
 * - Hàm này verify token → Lấy thông tin user (id, role, email)
 *
 * 🎯 CÁCH DÙNG:
 * ```javascript
 * // Trong Socket.IO middleware (src/ws/index.ts):
 * io.use(async (socket, next) => {
 *   try {
 *     const token = socket.handshake.auth.token;
 *     const user = await verifyWsJWT(token);
 *
 *     socket.user = user; // Gắn user vào socket
 *     next(); // Cho phép kết nối
 *   } catch (error) {
 *     next(new Error('Authentication failed')); // Từ chối
 *   }
 * });
 * ```
 *
 * 🔢 THAM SỐ:
 * @param {string} token - JWT token từ client (VD: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
 *
 * @returns {Promise<Object>} Thông tin user đã giải mã:
 * ```javascript
 * {
 *   maNguoiDung: 123,       // User ID
 *   email: "driver@ssb.vn", // Email
 *   vaiTro: "tai_xe",       // Role: quan_tri | tai_xe | phu_huynh
 *   iat: 1234567890,        // Issued at (timestamp)
 *   exp: 1234567890         // Expiration time
 * }
 * ```
 *
 * @throws {Error} Lỗi xác thực:
 * - "Missing token" - Không có token
 * - "JsonWebTokenError" - Token không hợp lệ
 * - "TokenExpiredError" - Token đã hết hạn
 *
 * 🔐 BẢO MẬT:
 * - JWT_SECRET phải được lưu trong .env (KHÔNG được commit lên GitHub)
 * - Token có thời hạn (exp), hết hạn phải đăng nhập lại
 * - Không bao giờ log token ra console (tránh lộ thông tin)
 *
 * ⚠️ LƯU Ý - MOCK VERSION (Ngày 1):
 * - Đây chỉ là version đơn giản để test flow
 * - Ngày 3 sẽ thay bằng helper từ Q.Thắng với:
 *   + Refresh token logic
 *   + Blacklist check (token bị thu hồi)
 *   + Rate limiting
 *   + Logging đầy đủ
 *
 * 💻 VÍ DỤ TEST:
 * ```javascript
 * // Test 1: Token hợp lệ
 * const validToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
 * const user = await verifyWsJWT(validToken);
 * console.log('User:', user.email, 'Role:', user.vaiTro);
 *
 * // Test 2: Không có token
 * try {
 *   await verifyWsJWT(null);
 * } catch (error) {
 *   console.log('Error:', error.message); // "Missing token"
 * }
 *
 * // Test 3: Token sai
 * try {
 *   await verifyWsJWT('invalid-token-xxx');
 * } catch (error) {
 *   console.log('Error:', error.name); // "JsonWebTokenError"
 * }
 * ```
 *
 * 🔗 LIÊN KẾT VỚI CÁC FILE KHÁC:
 * - AuthMiddleware.js: Dùng chung JWT_SECRET và logic verify
 * - Socket.IO server: Gọi hàm này trong io.use() middleware
 * - ws_events.md: Mô tả flow authentication trong docs
 */
export async function verifyWsJWT(token) {
  // ❌ Kiểm tra token có tồn tại không
  if (!token) {
    throw new Error("Missing token");
  }

  // ✅ Verify và giải mã token
  // jwt.verify() sẽ:
  // 1. Kiểm tra chữ ký (signature) có đúng với JWT_SECRET không
  // 2. Kiểm tra token có hết hạn (exp) chưa
  // 3. Trả về payload (dữ liệu user) nếu hợp lệ
  // 4. Throw error nếu không hợp lệ
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 📝 Log để debug (CHỈ ở development, production phải tắt)
    // ⚠️ Comment lại để tránh spam log khi chạy performance test
    // if (process.env.NODE_ENV === "development") {
    //   console.log(
    //     "✅ WS Auth: User verified -",
    //     decoded.email,
    //     `(${decoded.vaiTro})`
    //   );
    // }

    return decoded;
  } catch (error) {
    // 🚨 Xử lý các loại lỗi JWT
    if (error.name === "TokenExpiredError") {
      throw new Error("Token expired - Please login again");
    } else if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token - Authentication failed");
    } else {
      throw error;
    }
  }
}

/**
 * 📝 NOTES CHO NGÀY 3 (Tích hợp Q.Thắng):
 *
 * 🔄 CẦN THAY ĐỔI:
 * 1. Import helper từ Q.Thắng:
 *    ```javascript
 *    import { verifyJWT } from '../middlewares/AuthMiddleware.js';
 *    ```
 *
 * 2. Sử dụng helper thay vì jwt.verify trực tiếp:
 *    ```javascript
 *    export async function verifyWsJWT(token) {
 *      return await verifyJWT(token); // Gọi helper Q.Thắng
 *    }
 *    ```
 *
 * 3. Thêm logic check blacklist (nếu Q.Thắng có):
 *    - Token đã logout
 *    - Token bị admin thu hồi
 *
 * 4. Thống nhất error codes với REST API:
 *    - 401 Unauthorized
 *    - 403 Forbidden
 *
 * 🤝 PHỐI HỢP VỚI Q.THẮNG:
 * - Hỏi về cấu trúc payload JWT (có gì ngoài id, email, role?)
 * - Có cần refresh token cho WebSocket không?
 * - Secret key giống REST API hay khác?
 * - Có cơ chế revoke token không?
 *
 * 📅 TIMELINE:
 * - Ngày 1 (26/10): Mock version này (✅ Done)
 * - Ngày 3 (28/10): Tích hợp helper Q.Thắng
 * - Ngày 4 (29/10): Test end-to-end với FE
 * - Ngày 5-6: Fix bugs nếu có
 */

/**
 * 🧪 HELPER FUNCTION ĐỂ TEST (Tạm thời cho Ngày 1)
 *
 * Tạo một token giả để test (CHỈ dùng cho development!)
 * ⚠️ XÓA FUNCTION NÀY khi deploy production!
 */
export function createMockToken(
  userId = 1,
  role = "tai_xe",
  email = "test@ssb.vn"
) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Mock tokens are not allowed in production!");
  }

  const payload = {
    maNguoiDung: userId,
    email: email,
    vaiTro: role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "24h", // Token hết hạn sau 24 giờ
  });
}

/**
 * 📚 TÀI LIỆU THAM KHẢO:
 * - JWT: https://jwt.io/
 * - jsonwebtoken library: https://github.com/auth0/node-jsonwebtoken
 * - Socket.IO authentication: https://socket.io/docs/v4/middlewares/
 * - Best practices: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
 */
