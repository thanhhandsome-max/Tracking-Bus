// Import các module cần thiết.
// express: Framework để xây dựng web server và API.
import express from "express";

// Import các đối tượng và hàm từ file "inMemoryStore".
// Đây là nơi bạn giả lập cơ sở dữ liệu, lưu trữ dữ liệu trong bộ nhớ RAM.
import {
  buses, // Một đối tượng Map() để lưu trữ danh sách xe bus.
  drivers, // Một đối tượng Map() để lưu trữ danh sách tài xế.
  generateId, // Hàm để tạo ID duy nhất cho đối tượng mới.
  toArray, // Hàm để chuyển đổi đối tượng Map() thành một mảng (Array).
} from "../../services/inMemoryStore.js";

// Tạo một đối tượng router mới.
// Router giúp nhóm các endpoint liên quan đến một tài nguyên (ở đây là "bus") vào cùng một file.
const router = express.Router();

// -------------------------------------------------
// Endpoint 1: Lấy danh sách xe bus (có tìm kiếm và lọc)
// Method: GET, URL: /
// -------------------------------------------------
router.get("/", (req, res) => {
  // Lấy các tham số truy vấn (query parameters) từ URL, ví dụ: /?q=abc&status=active
  const { q, status } = req.query;

  // Chuyển đổi Map 'buses' thành một mảng để dễ dàng lọc và tìm kiếm.
  let list = toArray(buses);

  // Nếu có tham số 'q' (query/search term)
  if (q) {
    const term = q.toLowerCase(); // Chuyển từ khóa tìm kiếm về chữ thường để tìm kiếm không phân biệt hoa/thường.
    // Lọc danh sách: chỉ giữ lại những xe bus có 'code' hoặc 'plate' chứa từ khóa tìm kiếm.
    list = list.filter(
      (b) =>
        (b.code || "").toLowerCase().includes(term) ||
        (b.plate || "").toLowerCase().includes(term)
    );
  }

  // Nếu có tham số 'status'
  if (status) {
    // Lọc danh sách: chỉ giữ lại những xe bus có trạng thái ('status') khớp với tham số.
    list = list.filter((b) => b.status === status);
  }

  // Trả về cho client một đối tượng JSON chứa danh sách đã lọc và tổng số lượng.
  res.json({ items: list, total: list.length });
});

// -------------------------------------------------
// Endpoint 2: Lấy thông tin chi tiết một xe bus theo ID
// Method: GET, URL: /:id (ví dụ: /123)
// -------------------------------------------------
router.get("/:id", (req, res) => {
  // Dùng Map.get() để lấy xe bus từ "database" với key là ID từ URL (req.params.id).
  const bus = buses.get(req.params.id);

  // Nếu không tìm thấy xe bus, trả về lỗi 404 Not Found.
  if (!bus) return res.status(404).json({ message: "Không tìm thấy xe bus" });

  // Nếu tìm thấy, trả về thông tin xe bus.
  res.json(bus);
});

// -------------------------------------------------
// Endpoint 3: Tạo một xe bus mới
// Method: POST, URL: /
// -------------------------------------------------
router.post("/", (req, res) => {
  // Lấy các trường dữ liệu từ body của request.
  const { code, plate, capacity, status } = req.body;

  // Kiểm tra dữ liệu bắt buộc: 'code' và 'plate' phải có.
  if (!code || !plate)
    return res.status(400).json({ message: "code và plate là bắt buộc" });

  // Tạo một ID mới cho xe bus.
  const id = generateId("bus");

  // Tạo một đối tượng xe bus mới với đầy đủ thông tin.
  const bus = {
    id,
    code,
    plate,
    capacity: Number(capacity) || 50, // Nếu capacity không có, mặc định là 50.
    status: status || "active", // Nếu status không có, mặc định là "active".
    driverId: null, // Khi mới tạo, chưa có tài xế.
    lastPosition: null, // Khi mới tạo, chưa có vị trí.
  };

  // Lưu xe bus mới vào "database" (Map) với key là ID.
  buses.set(id, bus);

  // Trả về thông tin xe bus vừa tạo với status code 201 Created.
  res.status(201).json(bus);
});

// -------------------------------------------------
// Endpoint 4: Cập nhật thông tin xe bus
// Method: PUT, URL: /:id
// -------------------------------------------------
router.put("/:id", (req, res) => {
  // Lấy xe bus hiện tại từ "database".
  const bus = buses.get(req.params.id);

  // Nếu không tìm thấy, trả về lỗi 404.
  if (!bus) return res.status(404).json({ message: "Không tìm thấy xe bus" });

  // Lấy dữ liệu cập nhật từ body.
  const { code, plate, capacity, status } = req.body;

  // Cập nhật từng trường một nếu trường đó được cung cấp trong request body.
  // 'undefined' có nghĩa là trường đó không được gửi lên.
  if (code !== undefined) bus.code = code;
  if (plate !== undefined) bus.plate = plate;
  if (capacity !== undefined) bus.capacity = Number(capacity);
  if (status !== undefined) bus.status = status;

  // Lưu lại thông tin xe bus đã cập nhật vào "database".
  buses.set(bus.id, bus);

  // Trả về thông tin xe bus sau khi cập nhật.
  res.json(bus);
});

// -------------------------------------------------
// Endpoint 5: Xóa một xe bus
// Method: DELETE, URL: /:id
// -------------------------------------------------
router.delete("/:id", (req, res) => {
  // Kiểm tra xem xe bus có tồn tại không trước khi xóa.
  if (!buses.has(req.params.id))
    return res.status(404).json({ message: "Không tìm thấy xe bus" });

  // Xóa xe bus khỏi "database".
  buses.delete(req.params.id);

  // Trả về status code 204 No Content, nghĩa là xóa thành công và không có nội dung gì để trả về.
  res.status(204).send();
});

// -------------------------------------------------
// Endpoint 6: Phân công tài xế cho xe bus (Logic nghiệp vụ)
// Method: POST, URL: /:id/assign-driver
// -------------------------------------------------
router.post("/:id/assign-driver", (req, res) => {
  // Tìm xe bus cần phân công.
  const bus = buses.get(req.params.id);
  if (!bus) return res.status(404).json({ message: "Không tìm thấy xe bus" });

  // Lấy ID của tài xế từ body.
  const { driverId } = req.body;
  if (!driverId)
    return res.status(400).json({ message: "driverId là bắt buộc" });

  // Tìm tài xế trong "database" tài xế.
  const driver = drivers.get(driverId);
  if (!driver)
    return res.status(404).json({ message: "Không tìm thấy tài xế" });

  // Gán tài xế cho xe bus.
  bus.driverId = driverId;
  buses.set(bus.id, bus); // Cập nhật lại thông tin xe bus.

  // Trả về thông tin xe bus sau khi đã gán tài xế.
  res.json(bus);
});

// -------------------------------------------------
// Endpoint 7: Cập nhật vị trí xe bus và phát sự kiện real-time
// Method: POST, URL: /:id/position
// -------------------------------------------------
router.post("/:id/position", (req, res) => {
  // Tìm xe bus cần cập nhật vị trí.
  const bus = buses.get(req.params.id);
  if (!bus) return res.status(404).json({ message: "Không tìm thấy xe bus" });

  // Lấy tọa độ (lat, lng) và timestamp (ts) từ body.
  const { lat, lng, ts } = req.body;
  if (lat === undefined || lng === undefined)
    return res.status(400).json({ message: "lat và lng là bắt buộc" });

  // Nếu không có timestamp, tự tạo timestamp hiện tại.
  const timestamp = ts || new Date().toISOString();
  const position = { lat: Number(lat), lng: Number(lng), ts: timestamp };

  // Cập nhật vị trí cuối cùng cho xe bus.
  bus.lastPosition = position;
  buses.set(bus.id, bus);

  // Phát sự kiện real-time qua Socket.IO
  // Lấy đối tượng 'io' đã được gắn vào 'app' ở file server chính.
  const io = req.app.get("io");

  // Nếu 'io' tồn tại (server đã khởi tạo Socket.IO)
  if (io) {
    // Gửi sự kiện 'bus_position_update' đến một "phòng" (room) cụ thể.
    // Ở đây, mỗi xe bus có một phòng riêng (ví dụ: 'bus-bus01') để chỉ những client
    // đang theo dõi xe bus này mới nhận được cập nhật.
    io.to(`bus-${bus.id}`).emit("bus_position_update", {
      busId: bus.id,
      position,
    });
  }

  // Trả về thông báo thành công cho client đã gọi API này.
  res.json({ success: true, busId: bus.id, position });
});

// Xuất router để có thể sử dụng trong file server chính.
module.exports = router;
/*Chắc chắn rồi. Đây là phần giải thích chi tiết và mã nguồn cụ thể để bạn kết hợp Socket.IO vào server Express và phát hai sự kiện real-time bus_position_update và trip_status_change.

## 1. Nguyên lý hoạt động
Để phát sự kiện real-time từ API, chúng ta cần làm 3 việc:

Thiết lập Server: Khởi tạo cả Express và Socket.IO trên cùng một server.

Truyền io vào API: Làm cho đối tượng io (quản lý Socket.IO) có thể truy cập được từ bên trong các file route (ví dụ: schedules.js).

Phát sự kiện (Emit): Tại các endpoint API cần cập nhật real-time (ví dụ: khi cập nhật vị trí hoặc trạng thái chuyến đi), chúng ta sẽ gọi io.emit() để gửi thông điệp đến các client đang lắng nghe.

## 2. Mã nguồn chi tiết
Dưới đây là cách triển khai cụ thể.

Bước 1: Cài đặt thư viện
Nếu chưa có, hãy chạy lệnh sau:

Bash

npm install express socket.io cors
Bước 2: Chỉnh sửa server.js (File chính)
File này sẽ khởi tạo cả Express và Socket.IO.

JavaScript

// --- server.js ---

const express = require('express');
const http = require('http');
const { Server } = require("socket.io"); // Import Server từ socket.io
const cors = require('cors');

const app = express();
// Tạo một server HTTP chuẩn từ app Express. Socket.IO sẽ gắn vào đây.
const server = http.createServer(app); 

// Khởi tạo Socket.IO và cho phép CORS để Frontend có thể kết nối
const io = new Server(server, {
    cors: {
        origin: "*", // Cho phép mọi nguồn kết nối
    }
});
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Kho dữ liệu giả lập (để code chạy được)
const mockData = {
    buses: new Map([['bus01', { id: 'bus01' }]]),
    schedules: new Map([['sched01', { id: 'sched01', busId: 'bus01' }]]),
};

// CẢI TIẾN QUAN TRỌNG: Gắn 'io' vào đối tượng 'app'
// Việc này giúp chúng ta có thể truy cập 'io' từ các file route khác thông qua req.app.get('io')
app.set('io', io);

// Truyền dữ liệu giả vào các request để các file route có thể sử dụng
app.use((req, res, next) => {
    req.mockData = mockData;
    next();
});

// Import và sử dụng các routes
const busRoutes = require('./routes/api/buses');
const scheduleRoutes = require('./routes/api/schedules');

app.use('/api/buses', busRoutes);
app.use('/api/schedules', scheduleRoutes);

// Xử lý các kết nối mới từ client đến Socket.IO
io.on('connection', (socket) => {
    console.log('✅ Một client đã kết nối qua Socket.IO:', socket.id);

    // Lắng nghe sự kiện khi client muốn tham gia "phòng" theo dõi một xe bus cụ thể
    socket.on('join-bus-room', (busId) => {
        socket.join(`bus-${busId}`); // Cho socket này vào một phòng riêng
        console.log(`Socket ${socket.id} đã tham gia phòng theo dõi bus-${busId}`);
    });

    socket.on('disconnect', () => {
        console.log('❌ Client đã ngắt kết nối:', socket.id);
    });
});

// Dùng 'server.listen' thay vì 'app.listen' để cả Express và Socket.IO cùng chạy
server.listen(port, () => {
    console.log(`🚀 Backend server (API & Socket.IO) đang chạy tại http://localhost:${port}`);
});
Bước 3: Phát sự kiện từ các file Route
Phát sự kiện bus_position_update từ routes/api/buses.js:

JavaScript

// --- routes/api/buses.js ---
const express = require('express');
const router = express.Router();

// ... (các endpoint GET, POST, PUT, DELETE khác) ...

// Endpoint: Cập nhật vị trí xe bus và phát sự kiện real-time
router.post("/:id/position", (req, res) => {
    const { buses } = req.mockData;
    const bus = buses.get(req.params.id);
    if (!bus) return res.status(404).json({ message: "Không tìm thấy xe bus" });

    const { lat, lng } = req.body;
    const position = { lat, lng, ts: new Date().toISOString() };
    bus.lastPosition = position; // Cập nhật vị trí trong "database"

    // Lấy đối tượng 'io' đã được gắn vào 'app'
    const io = req.app.get("io");

    // Phát sự kiện 'bus_position_update'
    console.log(`[Socket.IO] Phát sự kiện 'bus_position_update' cho phòng bus-${bus.id}`);
    // Gửi sự kiện đến "phòng" của xe bus này. Chỉ những client đã "join" vào phòng này mới nhận được.
    io.to(`bus-${bus.id}`).emit("bus_position_update", {
        busId: bus.id,
        position,
    });
    
    res.json({ success: true });
});

module.exports = router;
Phát sự kiện trip_status_change từ routes/api/schedules.js:

JavaScript

// --- routes/api/schedules.js ---
const express = require('express');
const router = express.Router();

// ... (các endpoint GET, POST, PUT, DELETE khác) ...

// Endpoint: Cập nhật trạng thái chuyến đi và phát sự kiện real-time
router.post("/:id/trip-status", (req, res) => {
    const { schedules } = req.mockData;
    const sched = schedules.get(req.params.id);
    if (!sched) return res.status(404).json({ message: "Không tìm thấy lịch trình" });

    const { status } = req.body;
    sched.status = status; // Cập nhật trạng thái trong "database"

    // Lấy đối tượng 'io'
    const io = req.app.get("io");

    // Phát sự kiện 'trip_status_change'
    // Kiểm tra xem chuyến đi đã được gán xe chưa
    if (sched.busId) {
        console.log(`[Socket.IO] Phát sự kiện 'trip_status_change' cho phòng bus-${sched.busId}`);
        // Gửi sự kiện đến phòng của xe bus đang thực hiện chuyến đi này
        io.to(`bus-${sched.busId}`).emit("trip_status_change", {
            scheduleId: sched.id,
            busId: sched.busId,
            status,
            ts: new Date().toISOString(),
        });
    }

    res.json(sched);
});

export default router;
## Tóm tắt luồng hoạt động
Frontend kết nối: Một client (trình duyệt) kết nối tới server Socket.IO và gửi sự kiện join-bus-room với busId mà nó muốn theo dõi. Server sẽ cho client đó vào một "phòng" riêng.

API được gọi: Một thiết bị khác (ví dụ: app của tài xế) gọi POST /api/buses/bus01/position để cập nhật vị trí.

Server phát sự kiện: Server xử lý API, sau đó dùng io.to('bus-bus01').emit(...) để gửi thông điệp bus_position_update chỉ đến những client trong phòng bus-bus01.

Frontend nhận cập nhật: Client ban đầu đang lắng nghe trong phòng đó sẽ nhận được sự kiện và cập nhật giao diện (ví dụ: di chuyển marker trên bản đồ).*/
