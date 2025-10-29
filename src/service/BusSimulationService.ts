// src/service/BusSimulationService.ts
/**
 * Service tính toán vị trí xe bus dựa trên:
 * - Route và stops
 * - Thời gian khởi hành
 * - Tốc độ trung bình
 * - Thời gian dừng tại mỗi trạm
 */

interface Stop {
  stopId: string;
  name: string;
  order: number;
  location: {
    coordinates: [number, number]; // [lng, lat]
  };
  estimatedArrivalTime: string; // HH:mm format
  dwellTime?: number; // Thời gian dừng (phút)
}

interface Route {
  routeId: string;
  name: string;
  stops: Stop[];
  averageSpeed: number; // km/h
}

interface BusPosition {
  latitude: number;
  longitude: number;
  currentSpeed: number;
  heading: number; // Hướng di chuyển (độ)
  nextStopId: string;
  nextStopName: string;
  distanceToNextStop: number; // km
  estimatedTimeToNextStop: number; // phút
  progress: number; // 0-100%
}

export class BusSimulationService {
  /**
   * Tính khoảng cách giữa 2 điểm (Haversine formula)
   */
  private static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Bán kính trái đất (km)
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Tính góc hướng giữa 2 điểm
   */
  private static calculateBearing(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const dLng = this.toRad(lng2 - lng1);
    const y = Math.sin(dLng) * Math.cos(this.toRad(lat2));
    const x =
      Math.cos(this.toRad(lat1)) * Math.sin(this.toRad(lat2)) -
      Math.sin(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.cos(dLng);
    const bearing = Math.atan2(y, x);
    return ((bearing * 180) / Math.PI + 360) % 360;
  }

  /**
   * Nội suy vị trí giữa 2 điểm
   */
  private static interpolatePosition(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
    fraction: number
  ): { lat: number; lng: number } {
    return {
      lat: lat1 + (lat2 - lat1) * fraction,
      lng: lng1 + (lng2 - lng1) * fraction,
    };
  }

  /**
   * Parse thời gian từ string "HH:mm" thành phút từ nửa đêm
   */
  private static parseTimeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Tính tổng thời gian di chuyển của route (phút)
   */
  private static calculateRouteDuration(route: Route): number {
    const stops = route.stops;
    if (stops.length < 2) return 0;

    const firstTime = this.parseTimeToMinutes(stops[0].estimatedArrivalTime);
    const lastTime = this.parseTimeToMinutes(
      stops[stops.length - 1].estimatedArrivalTime
    );

    return lastTime - firstTime;
  }

  /**
   * Tính vị trí hiện tại của xe bus dựa trên thời gian
   * 
   * @param route - Thông tin tuyến đường
   * @param departureTime - Thời gian khởi hành (HH:mm)
   * @param currentTime - Thời gian hiện tại (Date object)
   * @returns Vị trí hiện tại của xe bus
   */
  static calculateCurrentPosition(
    route: Route,
    departureTime: string,
    currentTime: Date = new Date()
  ): BusPosition | null {
    const stops = route.stops.sort((a, b) => a.order - b.order);
    if (stops.length < 2) return null;

    // Tính thời gian hiện tại (phút từ nửa đêm)
    const currentMinutes =
      currentTime.getHours() * 60 + currentTime.getMinutes();
    const departureMinutes = this.parseTimeToMinutes(departureTime);

    // Thời gian đã trôi qua kể từ khi khởi hành (phút)
    let elapsedMinutes = currentMinutes - departureMinutes;

    // Xử lý trường hợp qua ngày
    if (elapsedMinutes < 0) elapsedMinutes += 24 * 60;

    // Tìm segment hiện tại (đoạn đường giữa 2 trạm)
    let currentSegmentIndex = -1;
    let segmentStartTime = departureMinutes;

    for (let i = 0; i < stops.length - 1; i++) {
      const currentStop = stops[i];
      const nextStop = stops[i + 1];

      const currentStopTime = this.parseTimeToMinutes(
        currentStop.estimatedArrivalTime
      );
      const nextStopTime = this.parseTimeToMinutes(
        nextStop.estimatedArrivalTime
      );

      // Thêm thời gian dừng
      const dwellTime = currentStop.dwellTime || 2; // Mặc định 2 phút
      const segmentEndTime = nextStopTime;

      if (
        currentMinutes >= currentStopTime &&
        currentMinutes < segmentEndTime
      ) {
        currentSegmentIndex = i;
        segmentStartTime = currentStopTime + dwellTime;
        break;
      }
    }

    // Nếu chưa khởi hành hoặc đã hoàn thành route
    if (currentSegmentIndex === -1) {
      // Nếu chưa khởi hành, đặt tại trạm đầu tiên
      if (currentMinutes < this.parseTimeToMinutes(stops[0].estimatedArrivalTime)) {
        const firstStop = stops[0];
        return {
          latitude: firstStop.location.coordinates[1],
          longitude: firstStop.location.coordinates[0],
          currentSpeed: 0,
          heading: 0,
          nextStopId: firstStop.stopId,
          nextStopName: firstStop.name,
          distanceToNextStop: 0,
          estimatedTimeToNextStop: 0,
          progress: 0,
        };
      }

      // Nếu đã hoàn thành, đặt tại trạm cuối
      const lastStop = stops[stops.length - 1];
      return {
        latitude: lastStop.location.coordinates[1],
        longitude: lastStop.location.coordinates[0],
        currentSpeed: 0,
        heading: 0,
        nextStopId: lastStop.stopId,
        nextStopName: lastStop.name,
        distanceToNextStop: 0,
        estimatedTimeToNextStop: 0,
        progress: 100,
      };
    }

    // Tính vị trí trên segment hiện tại
    const currentStop = stops[currentSegmentIndex];
    const nextStop = stops[currentSegmentIndex + 1];

    const currentStopTime = this.parseTimeToMinutes(
      currentStop.estimatedArrivalTime
    );
    const nextStopTime = this.parseTimeToMinutes(
      nextStop.estimatedArrivalTime
    );
    const dwellTime = currentStop.dwellTime || 2;

    // Thời gian di chuyển thực tế (trừ thời gian dừng)
    const travelTime = nextStopTime - currentStopTime - dwellTime;
    const timeIntoSegment = currentMinutes - (currentStopTime + dwellTime);

    // Tính phần trăm hoàn thành segment
    const segmentFraction = Math.max(
      0,
      Math.min(1, timeIntoSegment / travelTime)
    );

    // Tính vị trí hiện tại
    const currentPos = this.interpolatePosition(
      currentStop.location.coordinates[1],
      currentStop.location.coordinates[0],
      nextStop.location.coordinates[1],
      nextStop.location.coordinates[0],
      segmentFraction
    );

    // Tính khoảng cách đến trạm tiếp theo
    const distanceToNext = this.calculateDistance(
      currentPos.lat,
      currentPos.lng,
      nextStop.location.coordinates[1],
      nextStop.location.coordinates[0]
    );

    // Tính hướng di chuyển
    const heading = this.calculateBearing(
      currentPos.lat,
      currentPos.lng,
      nextStop.location.coordinates[1],
      nextStop.location.coordinates[0]
    );

    // Tính tiến độ tổng thể
    const totalDistance = stops.reduce((sum, stop, idx) => {
      if (idx === stops.length - 1) return sum;
      return (
        sum +
        this.calculateDistance(
          stop.location.coordinates[1],
          stop.location.coordinates[0],
          stops[idx + 1].location.coordinates[1],
          stops[idx + 1].location.coordinates[0]
        )
      );
    }, 0);

    const completedDistance = stops.slice(0, currentSegmentIndex).reduce((sum, stop, idx) => {
      return (
        sum +
        this.calculateDistance(
          stop.location.coordinates[1],
          stop.location.coordinates[0],
          stops[idx + 1].location.coordinates[1],
          stops[idx + 1].location.coordinates[0]
        )
      );
    }, 0);

    const currentSegmentDistance = this.calculateDistance(
      currentStop.location.coordinates[1],
      currentStop.location.coordinates[0],
      nextStop.location.coordinates[1],
      nextStop.location.coordinates[0]
    );

    const progress = ((completedDistance + currentSegmentDistance * segmentFraction) / totalDistance) * 100;

    return {
      latitude: currentPos.lat,
      longitude: currentPos.lng,
      currentSpeed: route.averageSpeed,
      heading,
      nextStopId: nextStop.stopId,
      nextStopName: nextStop.name,
      distanceToNextStop: distanceToNext,
      estimatedTimeToNextStop: (distanceToNext / route.averageSpeed) * 60,
      progress,
    };
  }

  /**
   * Kiểm tra xem xe bus có nằm trong bán kính của một điểm không
   */
  static isWithinRadius(
    busLat: number,
    busLng: number,
    targetLat: number,
    targetLng: number,
    radiusKm: number
  ): boolean {
    const distance = this.calculateDistance(
      busLat,
      busLng,
      targetLat,
      targetLng
    );
    return distance <= radiusKm;
  }
}
