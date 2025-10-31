import mongoose, { Schema, Document } from 'mongoose';
import { IBus } from './bus.model';

interface ILocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IBusLocation extends Document {
  busId: IBus['_id'];
  timestamp: Date;
  location: ILocation;
  speed: number;
}

const busLocationSchema: Schema<IBusLocation> = new Schema({
  busId: { type: Schema.Types.ObjectId, ref: 'Bus', required: true },
  timestamp: { type: Date, default: Date.now },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  speed: { type: Number, required: true, default: 0 }
});

// Tạo index để truy vấn lịch sử của một xe bus nhanh hơn
busLocationSchema.index({ busId: 1, timestamp: -1 });
busLocationSchema.index({ location: '2dsphere' });

export default mongoose.model<IBusLocation>('BusLocation', busLocationSchema);