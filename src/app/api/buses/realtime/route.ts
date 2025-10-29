// src/app/api/buses/realtime/route.ts
import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BusLocation from '@/models/busLocation.model';
import Bus from '@/models/bus.model';

/**
 * GET /api/buses/realtime
 * Server-Sent Events (SSE) endpoint để stream vị trí xe bus real-time
 * Query params:
 *  - busId: ID của xe bus cần theo dõi (optional, nếu không có thì theo dõi tất cả)
 *  - interval: khoảng thời gian update (ms, mặc định: 3000)
 */
export async function GET(request: NextRequest) {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const busId = searchParams.get('busId');
  const interval = parseInt(searchParams.get('interval') || '3000', 10);

  // Tạo ReadableStream cho SSE
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Hàm gửi dữ liệu đến client
      const sendUpdate = async () => {
        try {
          let latestLocations: any[] = [];

          if (busId) {
            // Theo dõi một xe bus cụ thể
            const location = await BusLocation.findOne({ busId })
              .sort({ timestamp: -1 })
              .lean();

            if (location) {
              const bus: any = await Bus.findById(busId).lean();
              latestLocations = [
                {
                  busId: busId,
                  bus: {
                    plateNumber: bus?.plateNumber,
                    capacity: bus?.capacity,
                    status: bus?.status,
                  },
                  location: (location as any).location,
                  speed: (location as any).speed,
                  timestamp: (location as any).timestamp,
                },
              ];
            } else {
              latestLocations = [];
            }
          } else {
            // Theo dõi tất cả xe bus đang active
            const activeBuses = await Bus.find({ status: 'active' }).select('_id').lean();
            const busIds = activeBuses.map((bus: any) => bus._id.toString());

            if (busIds.length > 0) {
              const locations = await BusLocation.aggregate([
                {
                  $match: {
                    busId: { $in: busIds.map((id) => id) },
                  },
                },
                {
                  $sort: { timestamp: -1 },
                },
                {
                  $group: {
                    _id: '$busId',
                    latestLocation: { $first: '$$ROOT' },
                  },
                },
              ]);

              latestLocations = await Promise.all(
                locations.map(async (item: any) => {
                  const bus: any = await Bus.findById(item._id).lean();
                  return {
                    busId: item._id,
                    bus: {
                      plateNumber: bus?.plateNumber,
                      capacity: bus?.capacity,
                      status: bus?.status,
                    },
                    location: item.latestLocation.location,
                    speed: item.latestLocation.speed,
                    timestamp: item.latestLocation.timestamp,
                  };
                })
              );
            } else {
              latestLocations = [];
            }
          }

          // Gửi dữ liệu dưới dạng SSE
          const data = `data: ${JSON.stringify({
            timestamp: new Date().toISOString(),
            buses: latestLocations,
          })}\n\n`;

          controller.enqueue(encoder.encode(data));
        } catch (error) {
          console.error('Error fetching bus locations for SSE:', error);
          controller.error(error);
        }
      };

      // Gửi update đầu tiên ngay lập tức
      await sendUpdate();

      // Thiết lập interval để gửi updates định kỳ
      const intervalId = setInterval(sendUpdate, interval);

      // Cleanup khi connection đóng
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  // Trả về response với headers cho SSE
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
