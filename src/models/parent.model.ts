import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';

export interface IParent extends Document {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth?: string;
  gender?: string;
  occupation?: string;
  passportNumber?: string;
  // Account relationship: Liên kết tới tài khoản đăng nhập bằng User
  userId: IUser['_id']; 
}

const parentSchema: Schema<IParent> = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  dateOfBirth: { type: String },
  gender: { type: String, enum: ['Nam', 'Nữ', 'Khác'], default: 'Nam' },
  occupation: { type: String },
  passportNumber: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
}, { timestamps: true });

export default mongoose.models.Parent || mongoose.models.Parent || mongoose.model<IParent>('Parent', parentSchema);
