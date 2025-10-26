// Import các module và đối tượng cần thiết.
import express from "express";
import {
  drivers,      // Đối tượng Map() để lưu trữ danh sách tài xế.
  schedules,    // Đối tượng Map() để lưu trữ danh sách lịch trình.
  toArray,      // Hàm tiện ích để chuyển Map thành Array.
  generateId,   // Hàm để tạo ID duy nhất.
} from "../../services/inMemoryStore.js";

// Tạo một router mới cho các endpoint liên quan đến tài xế.
const router = express.Router();


// -------------------------------------------------
// Endpoint 1: Lấy danh sách tất cả tài xế
// Method: GET, URL: /
// -------------------------------------------------
router.get("/", (req, res) => {
  // Trả về danh sách tài xế (đã chuyển từ Map sang Array) và tổng số lượng.
  res.json({ items: toArray(drivers), total: drivers.size });
});


// -------------------------------------------------
// Endpoint 2: Lấy thông tin chi tiết một tài xế theo ID
// Method: GET, URL: /:id
// -------------------------------------------------
router.get("/:id", (req, res) => {
  // Tìm tài xế trong "database" bằng ID từ URL.
  const driver = drivers.get(req.params.id);
  
  // Nếu không tìm thấy, trả về lỗi 404 Not Found.
  if (!driver) return res.status(404).json({ message: "Không tìm thấy tài xế" });

  // Nếu tìm thấy, trả về thông tin tài xế.
  res.json(driver);
});


// -------------------------------------------------
// Endpoint 3: Tạo một tài xế mới
// Method: POST, URL: /
// -------------------------------------------------
router.post("/", (req, res) => {
  // Lấy dữ liệu từ body của request.
  const { name, phone, licenseNo, status } = req.body;

  // Kiểm tra trường bắt buộc: 'name' phải được cung cấp.
  if (!name) return res.status(400).json({ message: "Tên là bắt buộc" });

  // Tạo một ID mới cho tài xế.
  const id = generateId("drv"); // "drv" là tiền tố cho ID tài xế.

  // Tạo đối tượng tài xế mới.
  const driver = {
    id,
    name,
    phone: phone || "",               // Nếu không có 'phone', giá trị mặc định là chuỗi rỗng.
    licenseNo: licenseNo || "",       // Nếu không có 'licenseNo', giá trị mặc định là chuỗi rỗng.
    status: status || "active",       // Nếu không có 'status', mặc định là "active".
  };

  // Lưu tài xế mới vào "database".
  drivers.set(id, driver);

  // Trả về thông tin tài xế vừa tạo với status 201 Created.
  res.status(201).json(driver);
});


// -------------------------------------------------
// Endpoint 4: Cập nhật thông tin tài xế
// Method: PUT, URL: /:id
// -------------------------------------------------
router.put("/:id", (req, res) => {
  // Tìm tài xế cần cập nhật.
  const driver = drivers.get(req.params.id);
  if (!driver) return res.status(404).json({ message: "Không tìm thấy tài xế" });

  // Lấy dữ liệu cập nhật từ body.
  const { name, phone, licenseNo, status } = req.body;

  // Cập nhật từng trường nếu nó được cung cấp trong request.
  if (name !== undefined) driver.name = name;
  if (phone !== undefined) driver.phone = phone;
  if (licenseNo !== undefined) driver.licenseNo = licenseNo;
  if (status !== undefined) driver.status = status;
  
  // Lưu lại thông tin tài xế đã cập nhật.
  drivers.set(driver.id, driver);
  
  // Trả về thông tin tài xế sau khi cập nhật.
  res.json(driver);
});


// -------------------------------------------------
// Endpoint 5: Xóa một tài xế
// Method: DELETE, URL: /:id
// -------------------------------------------------
router.delete("/:id", (req, res) => {
  // Kiểm tra xem tài xế có tồn tại không.
  if (!drivers.has(req.params.id))
    return res.status(404).json({ message: "Không tìm thấy tài xế" });

  // Xóa tài xế khỏi "database".
  drivers.delete(req.params.id);

  // Trả về status 204 No Content để báo hiệu xóa thành công.
  res.status(204).send();
});


// -------------------------------------------------
// Endpoint 6: Lấy danh sách các chuyến đi được phân công cho một tài xế
// Method: GET, URL: /:id/assignments
// -------------------------------------------------
router.get("/:id/assignments", (req, res) => {
  // Tìm tài xế để lấy danh sách phân công.
  const driver = drivers.get(req.params.id);
  if (!driver) return res.status(404).json({ message: "Không tìm thấy tài xế" });

  // Lọc toàn bộ danh sách lịch trình (schedules).
  // Chỉ giữ lại những lịch trình có `driverId` khớp với ID của tài xế này.
  const items = toArray(schedules).filter((s) => s.driverId === driver.id);

  // Trả về danh sách các chuyến đi đã được phân công.
  res.json({ items, total: items.length });
});


// Xuất router để sử dụng trong file server chính.
export default router;