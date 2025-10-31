import mongoose, { Schema, Document } from 'mongoose';

// Interface cho User Document
export interface IUser extends Document {
  email: string;
  password: string; // Trong thực tế, bạn nên hash mật khẩu này
  role: 'admin';
}

const userSchema: Schema<IUser> = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    lowercase: true,
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['admin'], 
    default: 'admin' 
  },
}, { timestamps: true });

export default mongoose.model<IUser>('User', userSchema);