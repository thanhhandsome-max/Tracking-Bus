import mongoose, { Schema, Document } from 'mongoose';
import { IBus } from './bus.model';
import { IStop } from './stop.model';

interface IRouteStopInfo {
  stopId: IStop['_id'];
  order: number;
  estimatedArrivalTime: string; // Có thể dùng kiểu Date nếu cần tính toán phức tạp
}

export interface IRoute extends Document {
  name: string;
  department: string;
  arrival: string;
  time: string;
  distance?: number; // in km
  estimatedDuration?: string; // e.g. "45 min" or "1h 30m"
  status?: 'active' | 'inactive' | 'maintenance';
  busId?: IBus['_id'];
  stops: IRouteStopInfo[];
}

const routeSchema: Schema<IRoute> = new Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  arrival: { type: String, required: true },
  time: { type: String, required: true },
  distance: { type: Number, min: 0 },
  estimatedDuration: { type: String },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'maintenance'], 
    default: 'active' 
  },
  busId: { type: Schema.Types.ObjectId, ref: 'Bus' },
  stops: [
    {
      stopId: { type: Schema.Types.ObjectId, ref: 'Stop', required: true },
      order: { type: Number, required: true },
      estimatedArrivalTime: { type: String, required: false },
    }
  ],
}, { timestamps: true });

export default mongoose.models.Route || mongoose.model<IRoute>('Route', routeSchema);
