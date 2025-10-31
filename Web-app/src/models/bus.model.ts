import mongoose, { Schema, Document } from 'mongoose';
import { IDriver } from './driver.model';

export interface IBus extends Document {
  plateNumber: string;
  capacity: number;
  status: 'active' | 'maintenance';
}

const busSchema: Schema<IBus> = new Schema({
  plateNumber: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true, min: 1 },
  status: { 
    type: String, 
    enum: ['active', 'maintenance'], 
    required: true, 
    default: 'active' 
  },
}, { timestamps: true });

export default mongoose.model<IBus>('Bus', busSchema);