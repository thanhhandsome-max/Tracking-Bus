# Real-time Bus Tracking Feature

## 📋 Tổng quan

Hệ thống theo dõi xe bus real-time sử dụng:
- **Server-Sent Events (SSE)** để stream vị trí xe bus
- **MongoDB với GeoJSON** để lưu trữ dữ liệu vị trí
- **MapLibre GL JS** để hiển thị bản đồ
- **React hooks** để quản lý kết nối real-time

## 🏗️ Kiến trúc

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│  GPS Device │────────>│  API Server  │────────>│   MongoDB    │
│  (xe bus)   │  POST   │  /api/buses  │  Save   │  (BusLocation)
└─────────────┘         └──────────────┘         └──────────────┘
                               │
                               │ SSE Stream
                               ▼
                        ┌──────────────┐
                        │  React App   │
                        │  (Frontend)  │
                        └──────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  MapLibre    │
                        │  (Map View)  │
                        └──────────────┘
```

## 📁 Files Created

### API Routes

1. **`/api/buses/[busId]/location`** - GET/POST vị trí xe bus
   - GET: Lấy vị trí hiện tại
   - POST: Cập nhật vị trí mới (từ GPS device)

2. **`/api/buses/[busId]/location/history`** - GET lịch sử vị trí
   - Query params: `from`, `to`, `limit`
   - Trả về danh sách vị trí trong khoảng thời gian

3. **`/api/buses/active`** - GET tất cả xe bus đang hoạt động
   - Trả về vị trí mới nhất của tất cả xe active
   - Optional: filter theo `tripId`

4. **`/api/buses/realtime`** - SSE endpoint
   - Stream vị trí xe bus real-time
   - Query params: `busId`, `interval`

### React Components & Hooks

5. **`src/hooks/useRealtimeBusTracking.ts`** - Custom hook
   - Kết nối SSE
   - Auto-reconnect với exponential backoff
   - Quản lý state: buses, isConnected, error

6. **`src/app/bus-tracking/page.tsx`** - Demo page
   - Hiển thị danh sách xe bus
   - Bản đồ real-time
   - UI cho tracking

### Utility Scripts

7. **`scripts/create-sample-bus.ts`** - Tạo xe bus mẫu
8. **`scripts/simulate-bus.ts`** - Giả lập chuyển động xe bus

## 🚀 Usage

### 1. Tạo xe bus mẫu

```bash
npm run create-sample-bus
```

Output:
```
✅ Sample bus created successfully!

Bus Details:
  ID: 673a1b2c3d4e5f6g7h8i9j0k
  Plate Number: 51B-12345
  Capacity: 40
  Status: active

To simulate this bus, run:
  npm run simulate-bus 673a1b2c3d4e5f6g7h8i9j0k
```

### 2. Giả lập chuyển động xe bus

```bash
npm run simulate-bus <busId> [intervalMs]
```

Example:
```bash
npm run simulate-bus 673a1b2c3d4e5f6g7h8i9j0k 2000
```

Script sẽ:
- Di chuyển xe bus qua 5 điểm ở TP.HCM
- Cập nhật vị trí mỗi 2 giây (configurable)
- Tính tốc độ tự động
- Lưu vào database

### 3. Xem tracking trên web

Mở trình duyệt: `http://localhost:3000/bus-tracking`

## 📡 API Examples

### GET Latest Location

```bash
curl http://localhost:3000/api/buses/673a1b2c3d4e5f6g7h8i9j0k/location
```

Response:
```json
{
  "success": true,
  "data": {
    "busId": "673a1b2c3d4e5f6g7h8i9j0k",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "location": {
      "type": "Point",
      "coordinates": [106.660172, 10.762622]
    },
    "speed": 35.5
  }
}
```

### POST Update Location (từ GPS device)

```bash
curl -X POST http://localhost:3000/api/buses/673a1b2c3d4e5f6g7h8i9j0k/location \
  -H "Content-Type: application/json" \
  -d '{
    "longitude": 106.660172,
    "latitude": 10.762622,
    "speed": 35.5
  }'
```

### GET Location History

```bash
curl "http://localhost:3000/api/buses/673a1b2c3d4e5f6g7h8i9j0k/location/history?from=2024-01-15T00:00:00Z&to=2024-01-15T23:59:59Z&limit=100"
```

### GET All Active Buses

```bash
curl http://localhost:3000/api/buses/active
```

### SSE Real-time Stream

```javascript
const eventSource = new EventSource('/api/buses/realtime?busId=673a1b2c3d4e5f6g7h8i9j0k&interval=3000');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Buses:', data.buses);
};
```

## 🎣 useRealtimeBusTracking Hook

### Basic Usage

```tsx
import { useRealtimeBusTracking } from '@/hooks/useRealtimeBusTracking';

function MyComponent() {
  const { buses, isConnected, error } = useRealtimeBusTracking();

  return (
    <div>
      {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      {buses.map(bus => (
        <div key={bus.busId}>
          {bus.bus.plateNumber}: {bus.location.coordinates}
        </div>
      ))}
    </div>
  );
}
```

### Track Specific Bus

```tsx
const { buses } = useRealtimeBusTracking({
  busId: '673a1b2c3d4e5f6g7h8i9j0k',
  interval: 2000, // Update mỗi 2 giây
});
```

### Manual Control

```tsx
const { connect, disconnect, reconnect } = useRealtimeBusTracking({
  autoConnect: false, // Không tự động kết nối
});

// Kết nối thủ công
useEffect(() => {
  connect();
  return () => disconnect();
}, []);
```

## 🗄️ Database Schema

### Bus Model

```typescript
interface IBus {
  plateNumber: string;    // Biển số xe
  capacity: number;       // Sức chứa
  status: 'active' | 'maintenance';
}
```

### BusLocation Model

```typescript
interface IBusLocation {
  busId: ObjectId;        // Ref to Bus
  timestamp: Date;        // Thời gian
  location: {             // GeoJSON Point
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  speed: number;          // Tốc độ (km/h)
}

// Indexes:
// 1. { busId: 1, timestamp: -1 } - Tìm vị trí mới nhất
// 2. { location: '2dsphere' } - Geospatial queries
```

## 🔍 Geospatial Queries

### Tìm xe bus trong bán kính

```javascript
const nearbyBuses = await BusLocation.find({
  location: {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: [106.660172, 10.762622], // [lng, lat]
      },
      $maxDistance: 5000, // 5km
    },
  },
});
```

### Tìm xe bus trong vùng

```javascript
const busesInArea = await BusLocation.find({
  location: {
    $geoWithin: {
      $geometry: {
        type: 'Polygon',
        coordinates: [[
          [106.65, 10.75],
          [106.70, 10.75],
          [106.70, 10.80],
          [106.65, 10.80],
          [106.65, 10.75],
        ]],
      },
    },
  },
});
```

## 🎨 UI Features

### Bus Tracking Page

- ✅ Sidebar với danh sách xe bus
- ✅ Real-time connection status indicator
- ✅ Click vào bus để highlight trên bản đồ
- ✅ Hiển thị tốc độ và timestamp
- ✅ Auto-reconnect khi mất kết nối
- ✅ Responsive design

### Map View

- ✅ Hiển thị bus marker với animation
- ✅ Popup với thông tin chi tiết
- ✅ Real-time update vị trí
- ✅ Auto-center on selected bus
- ✅ Speed indicator

## ⚙️ Configuration

### SSE Update Interval

Default: 3000ms (3 giây)

```typescript
const { buses } = useRealtimeBusTracking({
  interval: 1000, // Update mỗi giây
});
```

### Reconnect Settings

```typescript
// In useRealtimeBusTracking.ts
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // Base delay (ms)
// Exponential backoff: 2s, 4s, 8s, 16s, 32s
```

## 🐛 Troubleshooting

### SSE không kết nối

1. Kiểm tra MongoDB đang chạy:
   ```bash
   mongod
   ```

2. Kiểm tra API endpoint:
   ```bash
   curl http://localhost:3000/api/buses/active
   ```

3. Check browser console for errors

### Không có bus nào hiển thị

1. Tạo bus mẫu:
   ```bash
   npm run create-sample-bus
   ```

2. Chạy simulation:
   ```bash
   npm run simulate-bus <busId>
   ```

### Map không hiển thị

1. Check MapLibre CSS được import trong `globals.css`
2. Verify height được set cho MapView container
3. Check browser console for MapLibre errors

## 📊 Performance Optimization

### Database Indexes

```javascript
// busLocation.model.ts
schema.index({ busId: 1, timestamp: -1 }); // Query latest location
schema.index({ location: '2dsphere' });     // Geospatial queries
```

### SSE Optimization

- Sử dụng aggregation pipeline để tối ưu query
- Limit số lượng buses được stream
- Tùy chỉnh interval dựa trên nhu cầu

### Frontend Optimization

- useMemo để prevent re-renders
- Debounce map updates
- Lazy load components

## 🔐 Security Considerations

### Authentication (TODO)

```typescript
// Thêm middleware để verify request
export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization');
  if (!isValidToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ...
}
```

### Rate Limiting (TODO)

```typescript
// Giới hạn số lượng requests từ một IP
import rateLimit from 'express-rate-limit';
```

## 📈 Future Enhancements

- [ ] WebSocket support (thay thế SSE)
- [ ] Notification khi bus gần đến
- [ ] Predict arrival time bằng ML
- [ ] Historical playback (xem lại lịch trình)
- [ ] Multi-trip tracking
- [ ] Driver app integration
- [ ] Parent notification system
- [ ] Route optimization
- [ ] Geofencing alerts

## 🔗 Related Documentation

- [MapView README](./MapView-README.md)
- [Mapbox Migration](./MAPBOX_MIGRATION.md)
- [MongoDB GeoJSON](https://www.mongodb.com/docs/manual/reference/geojson/)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
