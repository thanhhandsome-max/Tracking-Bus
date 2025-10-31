import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  message: string;
  type: 'arrival' | 'departure' | 'alert';
  read: boolean;
  recipientId: mongoose.Types.ObjectId;
  recipientModel: 'Parent' | 'Driver';
}

const notificationSchema: Schema<INotification> = new Schema({
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['arrival', 'departure', 'alert'],
    required: true,
  },
  read: { type: Boolean, default: false },
  recipientId: {
    type: Schema.Types.ObjectId,
    required: true,
    // refPath trỏ đến một field khác để xác định model cần ref
    refPath: 'recipientModel' 
  },
  recipientModel: {
    type: String,
    required: true,
    enum: ['Parent', 'Driver']
  }
}, { timestamps: true });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);
