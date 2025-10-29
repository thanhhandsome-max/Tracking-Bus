/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📡 TELEMETRY SERVICE - Xử lý dữ liệu GPS từ xe bus
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * - Nhận vị trí GPS từ tài xế (qua REST hoặc WebSocket)
 * - Validate dữ liệu GPS (lat/lng hợp lệ)
 * - Lưu vị trí vào cache (in-memory hoặc Redis)
 * - Tính toán geofence (xe gần điểm dừng?)
 * - Phát hiện delay (xe bị trễ?)
 * - Emit events realtime (approach_stop, delay_alert)
 *
 * 🔧 SỬ DỤNG CHO:
 * - M5: Trip Lifecycle - Tracking vị trí xe
 * - M6: Notifications - Cảnh báo cho phụ huynh
 *
 * @author Nguyễn Tuấn Tài
 * @date 2025-10-29
 */

import { haversine, inGeofence } from "../utils/geo.js";
import ChuyenDiModel from "../models/ChuyenDiModel.js";
import LichTrinhModel from "../models/LichTrinhModel.js";
import TuyenDuongModel from "../models/TuyenDuongModel.js";
import DiemDungModel from "../models/DiemDungModel.js";

/**
 * 🗺️ IN-MEMORY CACHE - Lưu vị trí xe bus
 *
 * Structure:
 * {
 *   "bus-5": {
 *     lat: 21.0285,
 *     lng: 105.8542,
 *     speed: 30,
 *     heading: 90,
 *     timestamp: "2025-10-29T12:30:00Z",
 *     tripId: 42
 *   }
 * }
 *
 * Tại sao dùng Map?
 * - Nhanh hơn Object: O(1) lookup
 * - Hỗ trợ key bất kỳ (không chỉ string)
 * - Có size property
 * - Có iterator
 */
const busPositions = new Map();

/**
 * 🗺️ CACHE LAST UPDATE TIME - Tránh spam
 *
 * Structure:
 * {
 *   "bus-5": 1730198765432  // Timestamp (ms)
 * }
 *
 * Dùng để:
 * - Rate limit: Chỉ cho cập nhật mỗi 2s
 * - Tránh driver spam GPS
 */
const lastUpdateTime = new Map();

/**
 * ⏱️ RATE LIMIT - Thời gian tối thiểu giữa 2 lần cập nhật
 * 2000ms = 2 giây
 */
const RATE_LIMIT_MS = 2000;

/**
 * 📍 GEOFENCE RADIUS - Bán kính phát hiện "gần điểm dừng"
 * 60 mét = Khoảng 7 giây với tốc độ 30km/h
 */
const GEOFENCE_RADIUS = 60; // meters

/**
 * ⏰ DELAY THRESHOLD - Ngưỡng coi là "trễ"
 * 5 phút = Cảnh báo nếu xe trễ hơn 5 phút so với ETA
 */
const DELAY_THRESHOLD_MIN = 5;

class TelemetryService {
  /**
   * 📥 CẬP NHẬT VỊ TRÍ XE BUS
   *
   * @param {number} tripId - ID chuyến đi
   * @param {Object} positionData - Dữ liệu GPS
   * @param {number} positionData.lat - Vĩ độ
   * @param {number} positionData.lng - Kinh độ
   * @param {number} [positionData.speed] - Tốc độ (km/h)
   * @param {number} [positionData.heading] - Hướng đi (0-360°)
   * @param {Object} io - Socket.IO instance
   *
   * @returns {Object} Result với vị trí đã lưu + events đã emit
   */
  static async updatePosition(tripId, positionData, io) {
    try {
      // ✅ Validate dữ liệu GPS
      const { lat, lng, speed, heading } = positionData;

      if (!lat || !lng) {
        throw new Error("Latitude và Longitude là bắt buộc");
      }

      // Validate lat/lng range
      if (lat < -90 || lat > 90) {
        throw new Error("Latitude phải nằm trong khoảng -90 đến 90");
      }

      if (lng < -180 || lng > 180) {
        throw new Error("Longitude phải nằm trong khoảng -180 đến 180");
      }

      // 🚌 Lấy thông tin chuyến đi và xe
      const trip = await ChuyenDiModel.getById(tripId);
      if (!trip) {
        throw new Error("Không tìm thấy chuyến đi");
      }

      if (trip.trangThai !== "dang_chay") {
        throw new Error("Chuyến đi không đang chạy");
      }

      const schedule = await LichTrinhModel.getById(trip.maLichTrinh);
      if (!schedule) {
        throw new Error("Không tìm thấy lịch trình");
      }

      const busId = schedule.maXe;

      // ⏱️ CHECK RATE LIMIT
      const now = Date.now();
      const lastUpdate = lastUpdateTime.get(`bus-${busId}`);

      if (lastUpdate && now - lastUpdate < RATE_LIMIT_MS) {
        const waitTime = Math.ceil((RATE_LIMIT_MS - (now - lastUpdate)) / 1000);
        throw new Error(
          `Vui lòng đợi ${waitTime}s trước khi gửi vị trí tiếp theo`
        );
      }

      // 💾 Lưu vị trí vào cache
      const position = {
        lat,
        lng,
        speed: speed || 0,
        heading: heading || 0,
        timestamp: new Date().toISOString(),
        tripId,
        busId,
      };

      busPositions.set(`bus-${busId}`, position);
      lastUpdateTime.set(`bus-${busId}`, now);

      // 📡 Emit bus_position_update
      io.to(`trip-${tripId}`).emit("bus_position_update", {
        busId,
        tripId,
        lat,
        lng,
        speed: speed || 0,
        heading: heading || 0,
        timestamp: position.timestamp,
      });

      const events = ["bus_position_update"];

      // 🎯 CHECK GEOFENCE (Xe gần điểm dừng?)
      const approachEvent = await this.checkGeofence(
        tripId,
        { lat, lng },
        io,
        schedule
      );
      if (approachEvent) {
        events.push("approach_stop");
      }

      // ⏰ CHECK DELAY (Xe bị trễ?)
      const delayEvent = await this.checkDelay(
        tripId,
        { lat, lng },
        io,
        schedule,
        trip
      );
      if (delayEvent) {
        events.push("delay_alert");
      }

      return {
        success: true,
        position,
        events,
      };
    } catch (error) {
      console.error("❌ TelemetryService.updatePosition error:", error);
      throw error;
    }
  }

  /**
   * 🎯 KIỂM TRA GEOFENCE - Xe có gần điểm dừng không?
   *
   * @param {number} tripId - ID chuyến đi
   * @param {Object} currentPos - Vị trí hiện tại {lat, lng}
   * @param {Object} io - Socket.IO instance
   * @param {Object} schedule - Thông tin lịch trình
   *
   * @returns {boolean} true nếu đã emit event
   */
  static async checkGeofence(tripId, currentPos, io, schedule) {
    try {
      // Lấy danh sách điểm dừng của tuyến
      const route = await TuyenDuongModel.getById(schedule.maTuyen);
      if (!route) return false;

      const stops = await DiemDungModel.getByRouteId(schedule.maTuyen);
      if (!stops || stops.length === 0) return false;

      // Tìm điểm dừng tiếp theo (điểm gần nhất chưa qua)
      for (const stop of stops) {
        if (!stop.viDo || !stop.kinhDo) continue;

        const distance = haversine(
          currentPos.lat,
          currentPos.lng,
          parseFloat(stop.viDo),
          parseFloat(stop.kinhDo)
        );

        // Nếu trong vòng 60m → Emit event
        if (distance <= GEOFENCE_RADIUS) {
          console.log(
            `📍 Xe gần điểm dừng ${stop.tenDiemDung} (${Math.round(distance)}m)`
          );

          io.to(`trip-${tripId}`).emit("approach_stop", {
            tripId,
            stopId: stop.maDiemDung,
            stopName: stop.tenDiemDung,
            distance_m: Math.round(distance),
            timestamp: new Date().toISOString(),
          });

          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("❌ checkGeofence error:", error);
      return false;
    }
  }

  /**
   * ⏰ KIỂM TRA DELAY - Xe có bị trễ không?
   *
   * Logic đơn giản:
   * - So sánh giờ hiện tại với giờ dự kiến kết thúc
   * - Nếu quá 5 phút → Emit delay_alert
   *
   * @param {number} tripId - ID chuyến đi
   * @param {Object} currentPos - Vị trí hiện tại
   * @param {Object} io - Socket.IO instance
   * @param {Object} schedule - Lịch trình
   * @param {Object} trip - Chuyến đi
   *
   * @returns {boolean} true nếu đã emit event
   */
  static async checkDelay(tripId, currentPos, io, schedule, trip) {
    try {
      // Lấy thời gian bắt đầu thực tế
      if (!trip.gioBatDauThucTe) return false;

      const now = new Date();
      const startTime = new Date(`${trip.ngayChay}T${trip.gioBatDauThucTe}:00`);
      const plannedEndTime = new Date(
        `${trip.ngayChay}T${schedule.gioKetThuc}:00`
      );

      // Tính thời gian đã chạy (phút)
      const elapsedMin = (now - startTime) / 1000 / 60;

      // Tính thời gian dự kiến (phút)
      const plannedDuration = (plannedEndTime - startTime) / 1000 / 60;

      // Tính delay (phút)
      const delayMin = elapsedMin - plannedDuration;

      // Nếu trễ > 5 phút → Emit event
      if (delayMin > DELAY_THRESHOLD_MIN) {
        console.log(`⏰ Xe trễ ${Math.round(delayMin)} phút`);

        io.to(`trip-${tripId}`).emit("delay_alert", {
          tripId,
          delay_min: Math.round(delayMin),
          timestamp: new Date().toISOString(),
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error("❌ checkDelay error:", error);
      return false;
    }
  }

  /**
   * 📍 LẤY VỊ TRÍ HIỆN TẠI CỦA XE
   *
   * @param {number} busId - ID xe bus
   * @returns {Object|null} Vị trí hoặc null
   */
  static getPosition(busId) {
    return busPositions.get(`bus-${busId}`) || null;
  }

  /**
   * 🗑️ XÓA VỊ TRÍ XE (khi chuyến đi kết thúc)
   *
   * @param {number} busId - ID xe bus
   */
  static clearPosition(busId) {
    busPositions.delete(`bus-${busId}`);
    lastUpdateTime.delete(`bus-${busId}`);
  }

  /**
   * 📊 THỐNG KÊ CACHE
   *
   * @returns {Object} Thống kê
   */
  static getStats() {
    return {
      totalBuses: busPositions.size,
      buses: Array.from(busPositions.keys()),
    };
  }
}

export default TelemetryService;
