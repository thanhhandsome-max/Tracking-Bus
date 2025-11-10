import TuyenDuongModel from "../models/TuyenDuongModel.js";
import DiemDungModel from "../models/DiemDungModel.js";
import RouteStopModel from "../models/RouteStopModel.js";

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
    const route = await TuyenDuongModel.getById(routeId);
    if (!route) throw new Error("ROUTE_NOT_FOUND");

    const stops = await RouteStopModel.getByRouteId(routeId);
    if (stops.length < 2) {
      throw new Error("INSUFFICIENT_STOPS");
    }

    // Origin = stop đầu tiên
    const origin = `${stops[0].viDo},${stops[0].kinhDo}`;
    // Destination = stop cuối cùng
    const destination = `${stops[stops.length - 1].viDo},${stops[stops.length - 1].kinhDo}`;
    // Waypoints = các stop ở giữa
    const waypoints = stops.slice(1, -1).map((stop) => ({
      location: `${stop.viDo},${stop.kinhDo}`,
    }));

    // Gọi Maps API
    const directionsResult = await mapsService.getDirections({
      origin,
      destination,
      waypoints: waypoints.length > 0 ? waypoints : undefined,
      mode: "driving",
    });

    if (!directionsResult.polyline) {
      throw new Error("MAPS_API_ERROR");
    }

    // Cập nhật polyline vào DB
    await TuyenDuongModel.update(routeId, {
      polyline: directionsResult.polyline,
    });

    return {
      polyline: directionsResult.polyline,
      updated: true,
      cached: directionsResult.cached || false,
    };
  }
}

export default RouteService;
