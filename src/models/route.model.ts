import mongoose, { Schema, Document, ObjectId } from 'mongoose';
import { IBus } from './bus.model';
import { IStop } from './stop.model';

interface IRouteStopInfo {
  stopId: IStop['_id'];
  order: number;
  estimatedArrivalTime: string; // Có thể dùng kiểu Date nếu cần tính toán phức tạp
}

export interface IRoute extends Document {
  _id: ObjectId;
  name: string;
  department: string;
  arrival: string;
  time: string;
  busId?: IBus['_id'];
  stops: IRouteStopInfo[];
}

const routeSchema: Schema<IRoute> = new Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  arrival: { type: String, required: true },
  time: { type: String, required: true },
  busId: { type: Schema.Types.ObjectId, ref: 'Bus' },
  stops: [
    {
      stopId: { type: Schema.Types.ObjectId, ref: 'Stop', required: true },
      order: { type: Number, required: true },
      estimatedArrivalTime: { type: String, required: true },
    }
  ],
}, { timestamps: true });

export default mongoose.model<IRoute>('Route', routeSchema);