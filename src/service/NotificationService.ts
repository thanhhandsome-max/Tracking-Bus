// src/service/NotificationService.ts
/**
 * Service xử lý notification cho phụ huynh
 */

import Notification from '@/models/notification.model';
import { BusSimulationService } from './BusSimulationService';

interface NotificationTrigger {
  tripId: string;
  studentId: string;
  parentId: string;
  targetLocation: {
    name: string;
    latitude: number;
    longitude: number;
  };
  radiusKm: number; // Bán kính trigger (ví dụ: 1km)
}

interface BusPosition {
  latitude: number;
  longitude: number;
}

export class NotificationService {
  /**
   * Kiểm tra và tạo notification nếu xe bus trong bán kính
   */
  static async checkAndNotify(
    trigger: NotificationTrigger,
    busPosition: BusPosition
  ): Promise<boolean> {
    try {
      // Kiểm tra xe bus có trong bán kính không
      const isNearby = BusSimulationService.isWithinRadius(
        busPosition.latitude,
        busPosition.longitude,
        trigger.targetLocation.latitude,
        trigger.targetLocation.longitude,
        trigger.radiusKm
      );

      if (!isNearby) {
        return false;
      }

      // Kiểm tra xem đã gửi notification chưa (tránh spam)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingNotification: any = await Notification.findOne({
        userId: trigger.parentId,
        tripId: trigger.tripId,
        type: 'approaching_school',
        createdAt: { $gte: today },
      });

      if (existingNotification) {
        console.log(`Notification already sent for trip ${trigger.tripId}`);
        return false;
      }

      // Tính khoảng cách chính xác
      const distance = BusSimulationService['calculateDistance'](
        busPosition.latitude,
        busPosition.longitude,
        trigger.targetLocation.latitude,
        trigger.targetLocation.longitude
      );

      // Tạo notification mới
      await Notification.create({
        userId: trigger.parentId,
        tripId: trigger.tripId,
        type: 'approaching_school',
        title: '🚌 Xe bus sắp đến trường',
        message: `Xe bus đang cách ${trigger.targetLocation.name} khoảng ${distance.toFixed(1)} km. Con bạn sẽ sớm đến nơi!`,
        isRead: false,
        data: {
          tripId: trigger.tripId,
          studentId: trigger.studentId,
          distance: distance,
          location: trigger.targetLocation.name,
        },
      });

      console.log(`✅ Notification sent to parent ${trigger.parentId} for trip ${trigger.tripId}`);
      return true;
    } catch (error) {
      console.error('Error checking and notifying:', error);
      return false;
    }
  }

  /**
   * Kiểm tra tất cả các chuyến đi và gửi notification nếu cần
   */
  static async checkAllTripsAndNotify(
    trips: any[],
    schoolLocation: { name: string; latitude: number; longitude: number }
  ): Promise<number> {
    let notificationsSent = 0;

    for (const trip of trips) {
      // Chỉ gửi notification cho chuyến đi đến trường (departure)
      if (trip.direction !== 'departure') {
        continue;
      }

      // Lấy danh sách học sinh trong chuyến đi
      const students = trip.studentIds || [];

      for (const studentId of students) {
        // Giả sử mỗi học sinh có 1 phụ huynh (có thể query từ DB)
        // TODO: Query parent từ student model
        const parentId = `parent_${studentId}`; // Placeholder

        const trigger: NotificationTrigger = {
          tripId: trip.tripId,
          studentId: studentId.toString(),
          parentId: parentId,
          targetLocation: schoolLocation,
          radiusKm: 1, // 1km
        };

        const sent = await this.checkAndNotify(trigger, trip.position);
        if (sent) {
          notificationsSent++;
        }
      }
    }

    return notificationsSent;
  }

  /**
   * Gửi notification khi xe bus khởi hành
   */
  static async notifyDeparture(
    tripId: string,
    parentIds: string[],
    routeName: string,
    departureTime: string
  ): Promise<void> {
    try {
      const notifications = parentIds.map((parentId) => ({
        userId: parentId,
        tripId: tripId,
        type: 'trip_started',
        title: '🚌 Xe bus đã khởi hành',
        message: `Chuyến xe ${routeName} đã khởi hành lúc ${departureTime}. Bạn có thể theo dõi vị trí xe bus real-time.`,
        isRead: false,
        data: {
          tripId,
          routeName,
          departureTime,
        },
      }));

      await Notification.insertMany(notifications);
      console.log(`✅ Departure notifications sent for trip ${tripId}`);
    } catch (error) {
      console.error('Error notifying departure:', error);
    }
  }

  /**
   * Gửi notification khi xe bus đã đến trường
   */
  static async notifyArrival(
    tripId: string,
    parentIds: string[],
    routeName: string,
    location: string
  ): Promise<void> {
    try {
      const notifications = parentIds.map((parentId) => ({
        userId: parentId,
        tripId: tripId,
        type: 'trip_completed',
        title: '✅ Xe bus đã đến nơi',
        message: `Chuyến xe ${routeName} đã đến ${location}. Con bạn đã xuống xe an toàn.`,
        isRead: false,
        data: {
          tripId,
          routeName,
          location,
        },
      }));

      await Notification.insertMany(notifications);
      console.log(`✅ Arrival notifications sent for trip ${tripId}`);
    } catch (error) {
      console.error('Error notifying arrival:', error);
    }
  }
}
