import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';

export interface IDriver extends Document {
  name: string;
  phone: string;
  licenseNumber: string;
  yearsOfExperience: number;
  // Account relationship: Liên kết tới tài khoản đăng nhập bằng User
  userId: IUser['_id'];
}

const driverSchema: Schema<IDriver> = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  yearsOfExperience: { type: Number, required: true, min: 0 },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
}, { timestamps: true });

export default mongoose.model<IDriver>('Driver', driverSchema);