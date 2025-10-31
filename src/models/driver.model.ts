import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';
import { IBus } from './bus.model';

export interface IDriver extends Document {
  name: string;
  phone: string;
  licenseNumber: string;
  yearsOfExperience: number;
  // Account relationship: Liên kết tới tài khoản đăng nhập bằng User
  userId: IUser['_id'];
  // Bus relationship: Xe bus được phân cho tài xế
  busId?: IBus['_id'];
}

const driverSchema: Schema<IDriver> = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  yearsOfExperience: { type: Number, required: true, min: 0 },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  busId: { type: Schema.Types.ObjectId, ref: 'Bus' },
}, { timestamps: true });

export default mongoose.models.Driver || mongoose.model<IDriver>('Driver', driverSchema);
