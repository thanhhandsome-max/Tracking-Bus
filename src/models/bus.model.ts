import mongoose, { Schema, Document } from 'mongoose';

export interface IBus extends Document {
  plateNumber: string;
  capacity: number;
  status: 'active' | 'maintenance';
  driverId?: Schema.Types.ObjectId;
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
  driverId: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.models.Bus || mongoose.model<IBus>('Bus', busSchema);
