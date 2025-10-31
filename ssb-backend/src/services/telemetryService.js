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
import HocSinhModel from "../models/HocSinhModel.js";
import NguoiDungModel from "../models/NguoiDungModel.js";
import { syncBusLocation } from "./firebaseSync.service.js"; // 🔥 Day 5: Firebase sync
import { notifyApproachStop, notifyDelay } from "./firebaseNotify.service.js"; // 🔥 Day 5: Push Notifications

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
 * 🚨 DELAY ALERT CACHE - Lưu lần gửi cuối cùng cho mỗi trip
 *
 * Structure: Map<tripId, timestamp>
 * Ví dụ: Map { 22 => 1730198765432, 45 => 1730199123456 }
 *
 * Gửi lại sau mỗi 3 phút để nhắc nhở phụ huynh
 */
const delayAlertLastSent = new Map();

/**
 * ⏰ DELAY THRESHOLD - Ngưỡng coi là "trễ"
 * 5 phút = Cảnh báo nếu xe trễ hơn 5 phút so với ETA
 */
const DELAY_THRESHOLD_MIN = 5;

/**
 * 🔄 DELAY ALERT INTERVAL - Gửi lại delay alert sau mỗi X phút
 * 3 phút = 180,000 ms
 */
const DELAY_ALERT_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

/**
 * 📱 LẤY FCM TOKENS CỦA PHỤ HUYNH
 *
 * @param {number} tripId - ID chuyến đi
 * @returns {Promise<string[]>} Danh sách FCM tokens
 */
async function getParentTokensForTrip(tripId) {
  try {
    // 1. Lấy danh sách học sinh trên chuyến đi
    const students = await HocSinhModel.getByTripId(tripId);
    if (!students || students.length === 0) {
      return [];
    }

    // 2. Lấy danh sách mã phụ huynh
    const parentIds = students.map((s) => s.maPhuHuynh).filter((id) => id); // Loại bỏ null/undefined

    if (parentIds.length === 0) {
      return [];
    }

    // 3. Lấy FCM tokens của phụ huynh
    const tokens = [];
    for (const parentId of parentIds) {
      const parent = await NguoiDungModel.getById(parentId);
      if (parent && parent.fcmToken) {
        tokens.push(parent.fcmToken);
      }
    }

    return tokens;
  } catch (error) {
    console.error("❌ getParentTokensForTrip error:", error);
    return [];
  }
}

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

      // 🔥 DAY 5: Sync to Firebase Realtime Database
      // This allows FE to read position even when WebSocket is disconnected
      try {
        await syncBusLocation(busId, {
          tripId,
          lat,
          lng,
          speed: speed || 0,
          heading: heading || 0,
          timestamp: position.timestamp,
        });
      } catch (firebaseError) {
        // Don't fail the entire request if Firebase sync fails
        console.error(
          "⚠️  Firebase sync failed (non-fatal):",
          firebaseError.message
        );
      }

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
            `📍 Xe gần điểm dừng ${stop.tenDiem} (${Math.round(distance)}m)`
          );

          const eventData = {
            tripId,
            stopId: stop.maDiem,
            stopName: stop.tenDiem,
            distance_m: Math.round(distance),
            timestamp: new Date().toISOString(),
          };

          // Emit WebSocket event
          console.log(`📡 emit: approach_stop to trip-${tripId}`, eventData);
          io.to(`trip-${tripId}`).emit("approach_stop", eventData);

          // 🔥 Day 5: Send Push Notification to parents
          try {
            const parentTokens = await getParentTokensForTrip(tripId);
            if (parentTokens.length > 0) {
              await notifyApproachStop(parentTokens, eventData);
              console.log(
                `📲 Sent push notification to ${parentTokens.length} parent(s) for approach_stop`
              );
            } else {
              console.log("📲 No parent FCM tokens found for this trip");
            }
          } catch (notifyError) {
            console.warn(
              "⚠️  Failed to send push notification:",
              notifyError.message
            );
          }

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
      // Nếu chưa bắt đầu chuyến đi → không check delay
      if (!trip.gioBatDauThucTe) {
        console.log(`⏰ [DELAY CHECK] Trip ${tripId} - Chưa bắt đầu, skip`);
        return false;
      }

      const now = new Date();

      // Format ngày chạy về YYYY-MM-DD
      const tripDate = new Date(trip.ngayChay);
      const dateStr = tripDate.toISOString().split("T")[0]; // '2025-10-31'

      // Giờ dự kiến khởi hành (từ lịch trình)
      const plannedStartTime = new Date(`${dateStr}T${schedule.gioKhoiHanh}`);

      // Tính số phút trễ so với giờ dự kiến
      const delayMin = (now - plannedStartTime) / 1000 / 60;

      // 🔍 DEBUG LOG
      console.log(`⏰ [DELAY CHECK] Trip ${tripId}:`);
      console.log(`   - Ngày chạy (raw): ${trip.ngayChay}`);
      console.log(`   - Ngày chạy (formatted): ${dateStr}`);
      console.log(`   - Giờ khởi hành (lịch): ${schedule.gioKhoiHanh}`);
      console.log(`   - Giờ hiện tại: ${now.toISOString()}`);
      console.log(`   - Giờ dự kiến: ${plannedStartTime.toISOString()}`);
      console.log(`   - Delay: ${Math.round(delayMin)} phút`);

      // Nếu trễ > 5 phút → Emit event (gửi lại sau mỗi 3 phút)
      if (delayMin > DELAY_THRESHOLD_MIN) {
        // 🚨 Kiểm tra lần gửi cuối cùng
        const lastSent = delayAlertLastSent.get(tripId);
        const now = Date.now();

        // Nếu đã gửi trong vòng 3 phút → Skip
        if (lastSent && now - lastSent < DELAY_ALERT_INTERVAL_MS) {
          const waitTime = Math.ceil(
            (DELAY_ALERT_INTERVAL_MS - (now - lastSent)) / 1000 / 60
          );
          console.log(
            `⏰ [DELAY] Skip - Đã gửi rồi, gửi lại sau ${waitTime} phút`
          );
          return false;
        }

        console.log(`⏰ Xe trễ ${Math.round(delayMin)} phút`);

        const eventData = {
          tripId,
          delay_min: Math.round(delayMin),
          delay_minutes: Math.round(delayMin), // 🔥 Alias cho FE
          delayMinutes: Math.round(delayMin), // 🔥 Alias cho FE (camelCase)
          stopName: schedule?.tenTuyenDuong || "tuyến hiện tại", // 🔥 Thêm stopName cho FCM
          timestamp: new Date().toISOString(),
        };

        // Emit WebSocket event
        io.to(`trip-${tripId}`).emit("delay_alert", eventData);

        // 🔥 Cập nhật thời gian gửi cuối
        delayAlertLastSent.set(tripId, now);
        console.log(
          `🚨 Delay alert sent for trip ${tripId} (will send again after 3 minutes)`
        );

        // 🔥 Day 5: Send Push Notification to parents
        try {
          const parentTokens = await getParentTokensForTrip(tripId);
          if (parentTokens.length > 0) {
            await notifyDelay(parentTokens, eventData);
            console.log(
              `📲 Sent push notification to ${parentTokens.length} parent(s) for delay_alert`
            );
          } else {
            console.log("📲 No parent FCM tokens found for this trip");
          }
        } catch (notifyError) {
          console.warn(
            "⚠️  Failed to send push notification:",
            notifyError.message
          );
        }

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
   * @param {number} tripId - ID chuyến đi
   */
  static clearPosition(busId, tripId = null) {
    busPositions.delete(`bus-${busId}`);
    lastUpdateTime.delete(`bus-${busId}`);

    // Xóa delay alert cache khi trip kết thúc
    if (tripId) {
      delayAlertLastSent.delete(tripId);
      console.log(`🗑️ Cleared delay alert cache for trip ${tripId}`);
    }
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
