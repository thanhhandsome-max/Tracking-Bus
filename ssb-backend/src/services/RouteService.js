import TuyenDuongModel from "../models/TuyenDuongModel.js";
import DiemDungModel from "../models/DiemDungModel.js";
import RouteStopModel from "../models/RouteStopModel.js";
import pool from "../config/db.js";

class RouteService {
  static async list(options = {}) {
    const { page = 1, limit = 10 } = options;
    const data = await TuyenDuongModel.getAll(options);
    // TODO: Implement count method if needed
    const total = data.length;
    return {
      data,
      pagination: {
        page: +page,
        limit: +limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy route với stops (qua route_stops)
   */
  static async getById(id) {
    const route = await TuyenDuongModel.getById(id);
    if (!route) throw new Error("ROUTE_NOT_FOUND");
    
    // Lấy stops qua route_stops
    const stops = await RouteStopModel.getByRouteId(id);
    route.stops = stops;
    route.diemDung = stops; // Backward compatibility
    
    return route;
  }

  static async create(payload) {
    if (!payload.tenTuyen) throw new Error("MISSING_REQUIRED_FIELDS");
    const id = await TuyenDuongModel.create(payload);
    return await this.getById(id);
  }

  static async update(id, data) {
    const r = await TuyenDuongModel.getById(id);
    if (!r) throw new Error("ROUTE_NOT_FOUND");
    await TuyenDuongModel.update(id, data);
    return await this.getById(id);
  }

  static async delete(id) {
    const r = await TuyenDuongModel.getById(id);
    if (!r) throw new Error("ROUTE_NOT_FOUND");
    await TuyenDuongModel.delete(id);
    return true;
  }

  /**
   * Lấy stops của route (qua route_stops)
   */
  static async getStops(routeId) {
    const route = await TuyenDuongModel.getById(routeId);
    if (!route) throw new Error("ROUTE_NOT_FOUND");
    return await RouteStopModel.getByRouteId(routeId);
  }

  /**
   * Thêm stop vào route (tạo stop mới nếu cần, rồi thêm vào route_stops)
   */
  static async addStopToRoute(routeId, stopData) {
    const route = await TuyenDuongModel.getById(routeId);
    if (!route) throw new Error("ROUTE_NOT_FOUND");

    let stopId = stopData.stop_id;

    // Nếu không có stop_id, kiểm tra xem điểm dừng đã tồn tại chưa (theo unique constraint)
    if (!stopId) {
      if (!stopData.tenDiem || stopData.viDo === undefined || stopData.kinhDo === undefined) {
        throw new Error("MISSING_REQUIRED_FIELDS");
      }
      
      // Kiểm tra xem điểm dừng với cùng tên và tọa độ đã tồn tại chưa
      const existingStops = await DiemDungModel.getByCoordinates(
        stopData.viDo, 
        stopData.kinhDo, 
        0.0001 // tolerance: ~11m
      );
      
      // Tìm điểm dừng có cùng tên và tọa độ gần nhau
      const exactMatch = existingStops.find(
        (s) => s.tenDiem === stopData.tenDiem &&
               Math.abs(s.viDo - stopData.viDo) < 0.0001 &&
               Math.abs(s.kinhDo - stopData.kinhDo) < 0.0001
      );
      
      if (exactMatch) {
        // Sử dụng điểm dừng đã tồn tại
        stopId = exactMatch.maDiem;
        console.log(`✅ Sử dụng điểm dừng đã tồn tại: ${exactMatch.maDiem} - ${exactMatch.tenDiem}`);
      } else {
        // Tạo điểm dừng mới
        try {
          stopId = await DiemDungModel.create(stopData);
        } catch (createError) {
          // Nếu lỗi duplicate key, thử tìm lại
          if (createError.code === 'ER_DUP_ENTRY' || createError.message?.includes('Duplicate entry')) {
            const retryStops = await DiemDungModel.getByCoordinates(
              stopData.viDo, 
              stopData.kinhDo, 
              0.0001
            );
            const match = retryStops.find(
              (s) => s.tenDiem === stopData.tenDiem &&
                     Math.abs(s.viDo - stopData.viDo) < 0.0001 &&
                     Math.abs(s.kinhDo - stopData.kinhDo) < 0.0001
            );
            if (match) {
              stopId = match.maDiem;
              console.log(`✅ Tìm thấy điểm dừng sau khi retry: ${match.maDiem} - ${match.tenDiem}`);
            } else {
              throw createError;
            }
          } else {
            throw createError;
          }
        }
      }
    } else {
      // Kiểm tra stop có tồn tại không
      const stop = await DiemDungModel.getById(stopId);
      if (!stop) throw new Error("STOP_NOT_FOUND");
    }

    // Thêm vào route_stops
    const sequence = stopData.sequence || null;
    const dwellSeconds = stopData.dwell_seconds || 30;
    await RouteStopModel.addStop(routeId, stopId, sequence, dwellSeconds);

    // Backfill origin/dest nếu cần
    await this._updateRouteOriginDest(routeId);

    return await RouteStopModel.getByRouteId(routeId);
  }

  /**
   * Xóa stop khỏi route (chỉ xóa khỏi route_stops, không xóa stop gốc)
   */
  static async removeStopFromRoute(routeId, stopId) {
    const route = await TuyenDuongModel.getById(routeId);
    if (!route) throw new Error("ROUTE_NOT_FOUND");

    const removed = await RouteStopModel.removeStop(routeId, stopId);
    if (!removed) throw new Error("STOP_NOT_IN_ROUTE");

    // Backfill origin/dest nếu cần
    await this._updateRouteOriginDest(routeId);

    return true;
  }

  /**
   * Cập nhật stop trong route (sequence, dwell_seconds, hoặc stop info)
   */
  static async updateStopInRoute(routeId, stopId, updateData) {
    const route = await TuyenDuongModel.getById(routeId);
    if (!route) throw new Error("ROUTE_NOT_FOUND");

    // Kiểm tra stop có trong route không
    const routeStop = await RouteStopModel.getByRouteAndStop(routeId, stopId);
    if (!routeStop) throw new Error("STOP_NOT_IN_ROUTE");

    // Validate lat/lng nếu có update stop info
    if (updateData.viDo !== undefined || updateData.kinhDo !== undefined) {
      if (updateData.viDo !== undefined && (updateData.viDo < -90 || updateData.viDo > 90)) {
        throw new Error("INVALID_LATITUDE");
      }
      if (updateData.kinhDo !== undefined && (updateData.kinhDo < -180 || updateData.kinhDo > 180)) {
        throw new Error("INVALID_LONGITUDE");
      }
    }

    // Update stop info nếu có
    if (updateData.tenDiem || updateData.viDo !== undefined || updateData.kinhDo !== undefined || updateData.address !== undefined || updateData.scheduled_time !== undefined) {
      const stopUpdateData = {};
      if (updateData.tenDiem !== undefined) stopUpdateData.tenDiem = updateData.tenDiem;
      if (updateData.viDo !== undefined) stopUpdateData.viDo = updateData.viDo;
      if (updateData.kinhDo !== undefined) stopUpdateData.kinhDo = updateData.kinhDo;
      if (updateData.address !== undefined) stopUpdateData.address = updateData.address;
      if (updateData.scheduled_time !== undefined) stopUpdateData.scheduled_time = updateData.scheduled_time;

      await DiemDungModel.update(stopId, stopUpdateData);
    }

    // Update route_stops (sequence, dwell_seconds)
    const sequence = updateData.sequence !== undefined ? updateData.sequence : null;
    const dwellSeconds = updateData.dwell_seconds !== undefined ? updateData.dwell_seconds : null;

    // Nếu update sequence, kiểm tra conflict
    if (sequence !== null && sequence !== routeStop.sequence) {
      const [existing] = await pool.query(
        `SELECT * FROM route_stops WHERE route_id = ? AND sequence = ? AND stop_id != ?`,
        [routeId, sequence, stopId]
      );
      if (existing.length > 0) {
        throw new Error("SEQUENCE_ALREADY_EXISTS");
      }
    }

    await RouteStopModel.updateStop(routeId, stopId, sequence, dwellSeconds);

    // Backfill origin/dest nếu cần
    await this._updateRouteOriginDest(routeId);

    return await RouteStopModel.getByRouteId(routeId);
  }

  /**
   * Sắp xếp lại stops trong route
   */
  static async reorderStops(routeId, items) {
    const route = await TuyenDuongModel.getById(routeId);
    if (!route) throw new Error("ROUTE_NOT_FOUND");

    await RouteStopModel.reorderStops(routeId, items);

    // Backfill origin/dest nếu cần
    await this._updateRouteOriginDest(routeId);

    return await RouteStopModel.getByRouteId(routeId);
  }

  /**
   * Cập nhật origin/dest của route dựa trên stops (MIN sequence = origin, MAX sequence = dest)
   */
  static async _updateRouteOriginDest(routeId) {
    const stops = await RouteStopModel.getByRouteId(routeId);
    if (stops.length === 0) {
      // Nếu không còn stop, set origin/dest = null
      await TuyenDuongModel.update(routeId, {
        origin_lat: null,
        origin_lng: null,
        dest_lat: null,
        dest_lng: null,
      });
      return;
    }

    // Origin = stop có MIN(sequence)
    const originStop = stops[0]; // Đã ORDER BY sequence ASC
    // Dest = stop có MAX(sequence)
    const destStop = stops[stops.length - 1];

    await TuyenDuongModel.update(routeId, {
      origin_lat: originStop.viDo,
      origin_lng: originStop.kinhDo,
      dest_lat: destStop.viDo,
      dest_lng: destStop.kinhDo,
    });
  }

  /**
   * Rebuild polyline cho route (dùng Maps API)
   */
  static async rebuildPolyline(routeId, mapsService) {
    console.log(`[RouteService] Rebuilding polyline for route ${routeId}`);
    
    const route = await TuyenDuongModel.getById(routeId);
    if (!route) {
      console.error(`[RouteService] Route ${routeId} not found`);
      throw new Error("ROUTE_NOT_FOUND");
    }

    const stops = await RouteStopModel.getByRouteId(routeId);
    console.log(`[RouteService] Found ${stops.length} stops for route ${routeId}`);
    
    if (stops.length < 2) {
      console.error(`[RouteService] Route ${routeId} has insufficient stops: ${stops.length}`);
      throw new Error("INSUFFICIENT_STOPS");
    }

    // Sort stops by sequence to ensure correct order
    const sortedStops = stops.sort((a, b) => (a.thuTu || 0) - (b.thuTu || 0));

    // Validate stops have coordinates
    for (const stop of sortedStops) {
      if (!stop.viDo || !stop.kinhDo || isNaN(Number(stop.viDo)) || isNaN(Number(stop.kinhDo))) {
        console.error(`[RouteService] Stop ${stop.maDiem} has invalid coordinates:`, stop);
        throw new Error(`Stop ${stop.maDiem} has invalid coordinates`);
      }
    }

    // Origin = stop đầu tiên
    const origin = `${sortedStops[0].viDo},${sortedStops[0].kinhDo}`;
    // Destination = stop cuối cùng
    const destination = `${sortedStops[sortedStops.length - 1].viDo},${sortedStops[sortedStops.length - 1].kinhDo}`;
    // Waypoints = các stop ở giữa
    const waypoints = sortedStops.slice(1, -1).map((stop) => ({
      location: `${stop.viDo},${stop.kinhDo}`,
    }));

    console.log(`[RouteService] Calling Maps API:`, {
      origin,
      destination,
      waypointsCount: waypoints.length,
    });

    try {
      // Gọi Maps API
      const directionsResult = await mapsService.getDirections({
        origin,
        destination,
        waypoints: waypoints.length > 0 ? waypoints : undefined,
        mode: "driving",
      });

      if (!directionsResult || !directionsResult.polyline) {
        console.error(`[RouteService] No polyline in directions result for route ${routeId}`);
        throw new Error("MAPS_API_ERROR");
      }

      console.log(`[RouteService] Got polyline for route ${routeId}, length: ${directionsResult.polyline.length}`);

      // Cập nhật polyline vào DB
      await TuyenDuongModel.update(routeId, {
        polyline: directionsResult.polyline,
      });

      console.log(`[RouteService] Successfully updated polyline for route ${routeId}`);

      return {
        polyline: directionsResult.polyline,
        updated: true,
        cached: directionsResult.cached || false,
      };
    } catch (error) {
      console.error(`[RouteService] Error rebuilding polyline for route ${routeId}:`, {
        message: error.message,
        stack: error.stack,
      });
      // Re-throw with more context
      if (error.message.includes("Maps API") || error.message.includes("MAPS_API")) {
        throw error; // Let controller handle Maps API errors
      }
      throw error;
    }
  }
}

export default RouteService;
