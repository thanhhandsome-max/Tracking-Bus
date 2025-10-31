// src/models/trip.model.ts

import mongoose, { Schema, Document } from 'mongoose';
import type { IRoute } from './route.model';
import type { IBus } from './bus.model';
import type { IDriver } from './driver.model';
import type { IStudent } from './student.model';
import type { IStop } from './stop.model';

/**
 * Interface cho chi tiết của một điểm dừng trong một chuyến đi cụ thể.
 * Ghi lại thời gian thực tế so với thời gian dự kiến.
 */
interface ITripStopDetails {
  stopId: Schema.Types.ObjectId;
  order: number;
  estimatedArrivalTime: string; // Thời gian dự kiến, sao chép từ Route
  actualArrivalTime?: Date;     // Thời gian thực tế xe đến
  actualDepartureTime?: Date;   // Thời gian thực tế xe rời đi
  studentsPickedUp: Schema.Types.ObjectId[]; // Danh sách HS đã đón tại trạm
  studentsDroppedOff: Schema.Types.ObjectId[]; // Danh sách HS đã trả tại trạm
}

/**
 * Interface cho một chuyến đi cụ thể.
 * Đây là một instance của một Route vào một ngày nhất định.
 */
export interface ITrip extends Document {
  routeId: Schema.Types.ObjectId;
  busId: Schema.Types.ObjectId;
  driverId: Schema.Types.ObjectId;
  studentIds: Schema.Types.ObjectId[];
  tripDate: Date; // Ngày diễn ra chuyến đi
  direction: 'departure' | 'arrival'; // 'departure' = đi đến trường, 'arrival' = đi về nhà
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  
  actualStartTime?: Date; // Thời gian thực tế bắt đầu chuyến
  actualEndTime?: Date;   // Thời gian thực tế kết thúc chuyến
  
  // Chi tiết các điểm dừng trong chuyến đi này
  stopDetails: ITripStopDetails[]; 
}

const tripSchema: Schema<ITrip> = new Schema({
  routeId: { type: Schema.Types.ObjectId, ref: 'Route', required: true },
  busId: { type: Schema.Types.ObjectId, ref: 'Bus', required: true },
  driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true },
  studentIds: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  tripDate: { type: Date, required: true },
  direction: {
    type: String,
    enum: ['departure', 'arrival'],
    required: true,
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled',
    required: true,
  },
  actualStartTime: { type: Date },
  actualEndTime: { type: Date },
  
  stopDetails: [{
    stopId: { type: Schema.Types.ObjectId, ref: 'Stop', required: true },
    order: { type: Number, required: true },
    estimatedArrivalTime: { type: String, required: true },
    actualArrivalTime: { type: Date },
    actualDepartureTime: { type: Date },
    studentsPickedUp: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
    studentsDroppedOff: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  }],
}, { timestamps: true });

// Tạo index để tăng tốc độ truy vấn các chuyến đi theo ngày và trạng thái
tripSchema.index({ tripDate: 1, status: 1 });
tripSchema.index({ busId: 1, tripDate: -1 });

export default mongoose.models.Trip || mongoose.model<ITrip>('Trip', tripSchema);
