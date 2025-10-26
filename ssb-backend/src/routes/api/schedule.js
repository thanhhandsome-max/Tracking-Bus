// Import các module và đối tượng cần thiết.
import express from "express";
import {
  schedules, // Đối tượng Map() lưu trữ danh sách lịch trình.
  buses, // Đối tượng Map() lưu trữ danh sách xe bus.
  drivers, // Đối tượng Map() lưu trữ danh sách tài xế.
  toArray, // Hàm tiện ích để chuyển Map thành Array.
  generateId, // Hàm để tạo ID duy nhất.
} from "../../services/inMemoryStore.js";

// Tạo một router mới cho các endpoint liên quan đến lịch trình.
const router = express.Router();

// -------------------------------------------------
// Endpoint 1: Lấy danh sách lịch trình (có bộ lọc)
// Method: GET, URL: /
// -------------------------------------------------
router.get("/", (req, res) => {
  // Lấy các tham số lọc từ URL, ví dụ: /?date=2025-10-15&busId=bus01
  const { date, busId, driverId } = req.query;

  let list = toArray(schedules); // Bắt đầu với toàn bộ danh sách.

  // Áp dụng từng bộ lọc nếu có.
  if (date) list = list.filter((s) => s.date === date);
  if (busId) list = list.filter((s) => s.busId === busId);
  if (driverId) list = list.filter((s) => s.driverId === driverId);

  // Trả về danh sách đã lọc.
  res.json({ items: list, total: list.length });
});

// -------------------------------------------------
// Endpoint 2: Lấy chi tiết một lịch trình theo ID
// Method: GET, URL: /:id
// -------------------------------------------------
router.get("/:id", (req, res) => {
  const sched = schedules.get(req.params.id);
  if (!sched)
    return res.status(404).json({ message: "Không tìm thấy lịch trình" });
  res.json(sched);
});

// -------------------------------------------------
// Endpoint 3: Tạo một lịch trình mới
// Method: POST, URL: /
// -------------------------------------------------
router.post("/", (req, res) => {
  const { date, routeName, busId, driverId, startTime, endTime } = req.body;

  // Kiểm tra các trường bắt buộc.
  if (!date || !routeName)
    return res.status(400).json({ message: "date và routeName là bắt buộc" });

  // Kiểm tra xem busId và driverId có hợp lệ không (nếu được cung cấp).
  if (busId && !buses.get(busId))
    return res.status(400).json({ message: "busId không hợp lệ" });
  if (driverId && !drivers.get(driverId))
    return res.status(400).json({ message: "driverId không hợp lệ" });

  const id = generateId("sch"); // Tạo ID mới với tiền tố "sch".

  const sched = {
    id,
    date,
    routeName,
    busId: busId || null, // Nếu không có, gán là null.
    driverId: driverId || null, // Nếu không có, gán là null.
    startTime: startTime || "07:00", // Mặc định là 07:00.
    endTime: endTime || "09:00", // Mặc định là 09:00.
    status: "scheduled", // Trạng thái ban đầu.
  };

  schedules.set(id, sched); // Lưu vào "database".
  res.status(201).json(sched);
});

// -------------------------------------------------
// Endpoint 4: Cập nhật một lịch trình
// Method: PUT, URL: /:id
// -------------------------------------------------
router.put("/:id", (req, res) => {
  const sched = schedules.get(req.params.id);
  if (!sched)
    return res.status(404).json({ message: "Không tìm thấy lịch trình" });

  const { date, routeName, busId, driverId, startTime, endTime, status } =
    req.body;

  // Cập nhật từng trường nếu được cung cấp.
  if (date !== undefined) sched.date = date;
  if (routeName !== undefined) sched.routeName = routeName;
  if (busId !== undefined) {
    // Nếu busId được gửi lên, phải kiểm tra xem nó có hợp lệ không.
    if (busId && !buses.get(busId))
      return res.status(400).json({ message: "busId không hợp lệ" });
    sched.busId = busId;
  }
  if (driverId !== undefined) {
    // Tương tự, kiểm tra driverId.
    if (driverId && !drivers.get(driverId))
      return res.status(400).json({ message: "driverId không hợp lệ" });
    sched.driverId = driverId;
  }
  if (startTime !== undefined) sched.startTime = startTime;
  if (endTime !== undefined) sched.endTime = endTime;
  if (status !== undefined) sched.status = status;

  schedules.set(sched.id, sched); // Lưu lại thay đổi.
  res.json(sched);
});

// -------------------------------------------------
// Endpoint 5: Xóa một lịch trình
// Method: DELETE, URL: /:id
// -------------------------------------------------
router.delete("/:id", (req, res) => {
  if (!schedules.has(req.params.id))
    return res.status(404).json({ message: "Không tìm thấy lịch trình" });
  schedules.delete(req.params.id);
  res.status(204).send();
});

// -------------------------------------------------
// Endpoint 6: Phân công xe/tài xế (có kiểm tra xung đột)
// Method: POST, URL: /:id/assign
// -------------------------------------------------
router.post("/:id/assign", (req, res) => {
  const sched = schedules.get(req.params.id);
  if (!sched)
    return res.status(404).json({ message: "Không tìm thấy lịch trình" });

  const { busId, driverId } = req.body;
  // Kiểm tra tính hợp lệ của busId và driverId.
  if (busId && !buses.get(busId))
    return res.status(400).json({ message: "busId không hợp lệ" });
  if (driverId && !drivers.get(driverId))
    return res.status(400).json({ message: "driverId không hợp lệ" });

  // === LOGIC KIỂM TRA XUNG ĐỘT LỊCH TRÌNH ===
  // Hàm này kiểm tra xem hai khoảng thời gian có chồng chéo lên nhau không.
  const overlaps = (aStart, aEnd, bStart, bEnd) =>
    aStart < bEnd && bStart < aEnd;

  const sStart = sched.startTime || "00:00";
  const sEnd = sched.endTime || "23:59";

  // Lấy tất cả lịch trình khác trong cùng một ngày.
  const sameDateSchedules = toArray(schedules).filter(
    (s) => s.id !== sched.id && s.date === sched.date
  );

  // Kiểm tra xung đột cho xe bus.
  if (busId) {
    // Tìm xem có lịch trình nào khác trong cùng ngày, sử dụng cùng một xe bus, VÀ có thời gian chồng chéo không.
    const busConflicts = sameDateSchedules.filter(
      (s) => s.busId === busId && overlaps(sStart, sEnd, s.startTime, s.endTime)
    );
    // Nếu tìm thấy xung đột (mảng có phần tử), trả về lỗi 409 Conflict.
    if (busConflicts.length)
      return res
        .status(409)
        .json({
          message:
            "Xe bus đã được phân công trong một lịch trình khác bị trùng giờ.",
        });
    sched.busId = busId; // Nếu không xung đột, tiến hành phân công.
  }

  // Tương tự, kiểm tra xung đột cho tài xế.
  if (driverId) {
    const driverConflicts = sameDateSchedules.filter(
      (s) =>
        s.driverId === driverId &&
        overlaps(sStart, sEnd, s.startTime, s.endTime)
    );
    if (driverConflicts.length)
      return res
        .status(409)
        .json({
          message:
            "Tài xế đã được phân công trong một lịch trình khác bị trùng giờ.",
        });
    sched.driverId = driverId;
  }

  schedules.set(sched.id, sched);
  res.json(sched);
});

// -------------------------------------------------
// Endpoint 7: Cập nhật trạng thái chuyến đi và phát sự kiện real-time
// Method: POST, URL: /:id/trip-status
// -------------------------------------------------
router.post("/:id/trip-status", (req, res) => {
  const sched = schedules.get(req.params.id);
  if (!sched)
    return res.status(404).json({ message: "Không tìm thấy lịch trình" });

  const { status } = req.body;
  if (!status) return res.status(400).json({ message: "status là bắt buộc" });

  sched.status = status; // Cập nhật trạng thái.
  schedules.set(sched.id, sched);

  // Phát sự kiện Socket.IO
  const io = req.app.get("io");
  // Chỉ phát sự kiện nếu có client kết nối và chuyến đi đã được gán xe.
  if (io && sched.busId) {
    // Gửi sự kiện đến "phòng" riêng của xe bus đó.
    io.to(`bus-${sched.busId}`).emit("trip_status_change", {
      scheduleId: sched.id,
      busId: sched.busId,
      status,
      ts: new Date().toISOString(), // Gửi kèm timestamp.
    });
  }

  res.json(sched);
});

export default router;
