import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';

export interface IParent extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  passportNumber?: string;
  // Account relationship: Liên kết tới tài khoản đăng nhập bằng User
  userId: IUser['_id']; 
}

const parentSchema: Schema<IParent> = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  passportNumber: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
}, { timestamps: true });

export default mongoose.model<IParent>('Parent', parentSchema);