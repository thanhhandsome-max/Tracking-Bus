import mongoose, { Schema, Document } from 'mongoose';

// Interface cho User Document
export interface IUser extends Document {
  email: string;
  password: string; // Password đã được hash bằng bcrypt
  role: 'admin' | 'parent' | 'driver';
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
    enum: ['admin', 'parent', 'driver'], 
    required: true 
  },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);
