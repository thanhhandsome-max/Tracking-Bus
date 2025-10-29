// src/models/message.model.ts

import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface cho tin nhắn trong hệ thống
 * Hỗ trợ tin nhắn giữa phụ huynh và tài xế
 */
export interface IMessage extends Document {
  conversationId: string; // ID để nhóm các tin nhắn cùng một cuộc hội thoại
  senderId: Schema.Types.ObjectId;
  senderModel: 'Parent' | 'Driver'; // Người gửi là Parent hay Driver
  receiverId: Schema.Types.ObjectId;
  receiverModel: 'Parent' | 'Driver'; // Người nhận là Parent hay Driver
  content: string; // Nội dung tin nhắn
  attachments?: string[]; // URL các file đính kèm (nếu có)
  read: boolean; // Đã đọc chưa
  readAt?: Date; // Thời gian đọc
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema: Schema<IMessage> = new Schema({
  conversationId: { 
    type: String, 
    required: true,
    index: true // Index để truy vấn nhanh theo conversation
  },
  senderId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'senderModel'
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['Parent', 'Driver']
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'receiverModel'
  },
  receiverModel: {
    type: String,
    required: true,
    enum: ['Parent', 'Driver']
  },
  content: { 
    type: String, 
    required: true,
    trim: true
  },
  attachments: [{ 
    type: String 
  }],
  read: { 
    type: Boolean, 
    default: false 
  },
  readAt: { 
    type: Date 
  }
}, { 
  timestamps: true 
});

// Index để truy vấn tin nhắn theo người gửi/nhận
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });

// Virtual để lấy thông tin người gửi
messageSchema.virtual('sender', {
  refPath: 'senderModel',
  localField: 'senderId',
  foreignField: '_id',
  justOne: true
});

// Virtual để lấy thông tin người nhận
messageSchema.virtual('receiver', {
  refPath: 'receiverModel',
  localField: 'receiverId',
  foreignField: '_id',
  justOne: true
});

// Đảm bảo virtuals được include khi convert sang JSON
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);
