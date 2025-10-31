// src/app/api/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/message.model';
import Parent from '@/models/parent.model';
import Driver from '@/models/driver.model';

/**
 * GET /api/messages
 * Lấy danh sách tin nhắn của user
 * 
 * Query params:
 *  - userId: ID của user (bắt buộc)
 *  - conversationId: ID của cuộc hội thoại (optional)
 *  - limit: số lượng tin nhắn (mặc định: 50)
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Tìm parent từ userId
    const parent: any = await Parent.findOne({ userId }).lean();
    
    if (!parent) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let messages;
    
    if (conversationId) {
      // Lấy tin nhắn của một cuộc hội thoại
      messages = await Message
        .find({ conversationId })
        .sort({ createdAt: 1 }) // Sắp xếp từ cũ đến mới
        .limit(limit)
        .populate('senderId', 'name')
        .populate('receiverId', 'name')
        .lean();
    } else {
      // Lấy tất cả tin nhắn liên quan đến user
      messages = await Message
        .find({
          $or: [
            { senderId: parent._id, senderModel: 'Parent' },
            { receiverId: parent._id, receiverModel: 'Parent' }
          ]
        })
        .sort({ createdAt: -1 }) // Sắp xếp từ mới đến cũ
        .limit(limit)
        .populate('senderId')
        .populate('receiverId')
        .lean();
    }

    // Nhóm tin nhắn theo conversation nếu không có conversationId
    let result;
    if (!conversationId) {
      const conversationMap = new Map();
      
      messages.forEach(msg => {
        if (!conversationMap.has(msg.conversationId)) {
          conversationMap.set(msg.conversationId, {
            conversationId: msg.conversationId,
            participants: {
              sender: msg.senderId,
              receiver: msg.receiverId
            },
            lastMessage: msg,
            unreadCount: 0,
            messages: []
          });
        }
        
        const conv = conversationMap.get(msg.conversationId);
        conv.messages.push(msg);
        
        // Đếm tin nhắn chưa đọc mà user nhận được
        if (!msg.read && msg.receiverId._id.toString() === parent._id.toString()) {
          conv.unreadCount++;
        }
        
        // Cập nhật tin nhắn cuối cùng (mới nhất)
        if (new Date(msg.createdAt) > new Date(conv.lastMessage.createdAt)) {
          conv.lastMessage = msg;
        }
      });
      
      result = Array.from(conversationMap.values()).map(conv => ({
        conversationId: conv.conversationId,
        otherUser: conv.lastMessage.senderId._id.toString() === parent._id.toString() 
          ? conv.lastMessage.receiverId 
          : conv.lastMessage.senderId,
        lastMessage: {
          content: conv.lastMessage.content,
          createdAt: conv.lastMessage.createdAt,
          read: conv.lastMessage.read
        },
        unreadCount: conv.unreadCount
      }));
    } else {
      result = messages.map((msg: any) => ({
        id: (msg._id as any).toString(),
        conversationId: msg.conversationId,
        sender: msg.senderId,
        receiver: msg.receiverId,
        content: msg.content,
        attachments: msg.attachments,
        read: msg.read,
        readAt: msg.readAt,
        createdAt: msg.createdAt
      }));
    }

    return NextResponse.json({
      success: true,
      count: result.length,
      data: result
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages
 * Gửi tin nhắn mới
 * 
 * Body:
 *  - userId: ID của user gửi
 *  - receiverId: ID của user nhận
 *  - content: nội dung tin nhắn
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { userId, receiverId, content } = body;

    if (!userId || !receiverId || !content) {
      return NextResponse.json(
        { error: 'userId, receiverId, and content are required' },
        { status: 400 }
      );
    }

    // Tìm parent gửi
    const senderParent: any = await Parent.findOne({ userId }).lean();
    if (!senderParent) {
      return NextResponse.json(
        { error: 'Sender not found' },
        { status: 404 }
      );
    }

    // Tìm receiver (có thể là driver)
    const receiverDriver: any = await Driver.findById(receiverId).lean();
    if (!receiverDriver) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      );
    }

    // Tạo conversationId (format: parentId_driverId)
    const conversationId = `${senderParent._id}_${receiverDriver._id}`;

    // Tạo tin nhắn mới
    const message = await Message.create({
      conversationId,
      senderId: senderParent._id,
      senderModel: 'Parent',
      receiverId: receiverDriver._id,
      receiverModel: 'Driver',
      content: content.trim(),
      read: false
    });

    return NextResponse.json({
      success: true,
      data: {
        id: message._id.toString(),
        conversationId: message.conversationId,
        content: message.content,
        createdAt: message.createdAt
      }
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/messages
 * Đánh dấu tin nhắn đã đọc
 * 
 * Body:
 *  - messageId: ID của tin nhắn
 */
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { messageId, conversationId } = body;

    let result;

    if (messageId) {
      // Đánh dấu một tin nhắn cụ thể
      result = await Message.findByIdAndUpdate(
        messageId,
        { 
          read: true,
          readAt: new Date()
        },
        { new: true }
      );
    } else if (conversationId) {
      // Đánh dấu tất cả tin nhắn trong conversation
      result = await Message.updateMany(
        { conversationId, read: false },
        { 
          read: true,
          readAt: new Date()
        }
      );
    } else {
      return NextResponse.json(
        { error: 'messageId or conversationId is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
