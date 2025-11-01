class ReportsController {
  // GET /api/v1/reports/overview?from=YYYY-MM-DD&to=YYYY-MM-DD
  static async overview(req, res) {
    try {
      const { from, to } = req.query;

      const XeBuytModel = (await import("../models/XeBuytModel.js")).default;
      const ChuyenDiModel = (await import("../models/ChuyenDiModel.js")).default;

      const busStats = await XeBuytModel.getStats();
      const tripStats = from && to ? await ChuyenDiModel.getStats(from, to) : await ChuyenDiModel.getStats(new Date().toISOString().slice(0,10), new Date().toISOString().slice(0,10));

      const activeBuses = (busStats.busCounts || []).find(x => x.trangThai === 'hoat_dong')?.count || 0;
      const maintenanceBuses = (busStats.busCounts || []).find(x => x.trangThai === 'bao_tri')?.count || 0;

      return res.status(200).json({
        success: true,
        data: {
          buses: {
            total: busStats.totalBuses || 0,
            active: activeBuses,
            maintenance: maintenanceBuses,
          },
          trips: {
            total: tripStats.totalTrips || 0,
            completed: tripStats.completedTrips || 0,
            delayed: tripStats.delayedTrips || 0,
            cancelled: tripStats.cancelledTrips || 0,
            averageDurationMinutes: (tripStats.averageDurationInSeconds || 0) / 60,
          },
        },
      });
    } catch (error) {
      console.error("ReportsController.overview error:", error);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  }

  // GET /api/v1/reports/export?format=pdf|excel&type=overview|trips|buses|drivers|students|incidents&from=YYYY-MM-DD&to=YYYY-MM-DD
  static async export(req, res) {
    try {
      const { format = "excel", type = "overview", from, to } = req.query;

      // Xác định khoảng thời gian
      const dateFrom = from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const dateTo = to || new Date().toISOString().slice(0, 10);

      // Lấy dữ liệu dựa trên type
      let data = {};
      let fileName = `report_${type}_${dateFrom}_${dateTo}`;

      const XeBuytModel = (await import("../models/XeBuytModel.js")).default;
      const ChuyenDiModel = (await import("../models/ChuyenDiModel.js")).default;
      const TaiXeModel = (await import("../models/TaiXeModel.js")).default;
      const HocSinhModel = (await import("../models/HocSinhModel.js")).default;
      const SuCoModel = (await import("../models/SuCoModel.js")).default;

      switch (type) {
        case "overview":
          const busStats = await XeBuytModel.getStats();
          const tripStats = await ChuyenDiModel.getStats(dateFrom, dateTo);
          data = {
            period: { from: dateFrom, to: dateTo },
            buses: busStats,
            trips: tripStats,
          };
          break;

        case "trips":
          const trips = await ChuyenDiModel.getAll({ ngayChay: dateFrom });
          data = { trips };
          break;

        case "buses":
          const buses = await XeBuytModel.getAll();
          data = { buses };
          break;

        case "drivers":
          const drivers = await TaiXeModel.getAll();
          data = { drivers };
          break;

        case "students":
          const students = await HocSinhModel.getWithParentInfo();
          data = { students };
          break;

        case "incidents":
          const incidents = await SuCoModel.getAll({ tuNgay: dateFrom, denNgay: dateTo });
          data = { incidents };
          break;

        default:
          return res.status(400).json({ success: false, message: "Loại báo cáo không hợp lệ" });
      }

      // Xuất Excel (CSV format đơn giản)
      if (format === "excel" || format === "csv") {
        const csv = convertToCSV(data, type);
        fileName += ".csv";
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        return res.send(csv);
      }

      // Xuất PDF (JSON format - cần thư viện pdfkit nếu muốn PDF thực sự)
      if (format === "pdf") {
        // Tạm thời trả về JSON, có thể tích hợp pdfkit sau
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}.json"`);
        return res.json({ success: true, data, exportedAt: new Date().toISOString() });
      }

      return res.status(400).json({ success: false, message: "Định dạng xuất không hợp lệ" });
    } catch (error) {
      console.error("ReportsController.export error:", error);
      return res.status(500).json({ success: false, message: "Lỗi server khi xuất báo cáo" });
    }
  }
}

// Helper function để chuyển đổi data sang CSV
function convertToCSV(data, type) {
  let csv = "";
  const headers = [];
  const rows = [];

  switch (type) {
    case "trips":
      if (data.trips && data.trips.length > 0) {
        headers.push("Mã chuyến", "Ngày chạy", "Tuyến đường", "Biển số xe", "Tài xế", "Trạng thái", "Giờ khởi hành", "Giờ bắt đầu thực tế");
        data.trips.forEach((trip) => {
          rows.push([
            trip.maChuyen || "",
            trip.ngayChay || "",
            trip.tenTuyen || "",
            trip.bienSoXe || "",
            trip.tenTaiXe || "",
            trip.trangThai || "",
            trip.gioKhoiHanh || "",
            trip.gioBatDauThucTe || "",
          ]);
        });
      }
      break;

    case "buses":
      if (data.buses && data.buses.length > 0) {
        headers.push("Mã xe", "Biển số", "Dòng xe", "Sức chứa", "Trạng thái");
        data.buses.forEach((bus) => {
          rows.push([
            bus.maXe || "",
            bus.bienSoXe || "",
            bus.dongXe || "",
            bus.sucChua || "",
            bus.trangThai || "",
          ]);
        });
      }
      break;

    case "students":
      if (data.students && data.students.length > 0) {
        headers.push("Mã học sinh", "Họ tên", "Lớp", "Phụ huynh", "SĐT phụ huynh");
        data.students.forEach((student) => {
          rows.push([
            student.maHocSinh || "",
            student.hoTen || "",
            student.lop || "",
            student.tenPhuHuynh || "",
            student.sdtPhuHuynh || "",
          ]);
        });
      }
      break;

    default:
      // Overview - tóm tắt dữ liệu
      csv = "Báo cáo Tổng quan\n";
      csv += `Thời gian: ${data.period?.from || ""} đến ${data.period?.to || ""}\n\n`;
      csv += `Tổng số xe: ${data.buses?.totalBuses || 0}\n`;
      csv += `Xe hoạt động: ${data.buses?.active || 0}\n`;
      csv += `Tổng chuyến: ${data.trips?.totalTrips || 0}\n`;
      csv += `Chuyến hoàn thành: ${data.trips?.completedTrips || 0}\n`;
      csv += `Chuyến trễ: ${data.trips?.delayedTrips || 0}\n`;
      return csv;
  }

  // Tạo CSV từ headers và rows
  csv = headers.join(",") + "\n";
  rows.forEach((row) => {
    csv += row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",") + "\n";
  });

  // Thêm BOM cho UTF-8 để Excel hiển thị tiếng Việt đúng
  return "\ufeff" + csv;
}

export default ReportsController;
