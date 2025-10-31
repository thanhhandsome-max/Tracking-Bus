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
}

export default ReportsController;
