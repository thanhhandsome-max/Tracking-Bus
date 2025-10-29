# Multi-Trip Tracking System - Hệ thống theo dõi nhiều chuyến xe

## 📋 Tổng quan

Hệ thống **simulation-based tracking** cho phép:
- ✅ Hiển thị **nhiều xe bus cùng lúc** trên một bản đồ
- ✅ **Tự động tính toán vị trí** dựa trên thời gian thực (không cần GPS)
- ✅ **Gửi notification** khi xe bus gần đến trường (1km)
- ✅ Tính toán dựa trên:
  - Tuyến đường (route) và các trạm dừng
  - Thời gian khởi hành
  - Tốc độ trung bình
  - Thời gian dừng tại mỗi trạm

## 🎯 Tính năng chính

### 1. **Simulation-based Positioning**
Thay vì dùng GPS thật, hệ thống tính toán vị trí xe bus dựa trên:

```
Vị trí hiện tại = f(
  thời gian hiện tại,
  thời gian khởi hành,
  danh sách trạm dừng,
  thời gian dự kiến đến mỗi trạm,
  tốc độ trung bình
)
```

**Công thức:**
1. Tìm segment hiện tại (đoạn đường giữa 2 trạm)
2. Tính thời gian đã trôi qua trong segment
3. Tính % hoàn thành segment
4. Nội suy vị trí giữa 2 trạm

### 2. **Multi-Trip Display**
- Hiển thị 3+ xe bus cùng lúc
- Mỗi xe có màu sắc riêng
- Click vào xe để xem chi tiết
- Auto-update mỗi 10 giây

### 3. **Smart Notifications**
- Tự động kiểm tra khoảng cách đến trường
- Gửi notification khi xe cách trường < 1km
- Chỉ gửi 1 lần/ngày (tránh spam)
- Notification types:
  - `trip_started` - Xe đã khởi hành
  - `approaching_school` - Sắp đến trường
  - `trip_completed` - Đã đến nơi

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  - MultiTripMapView component                              │
│  - Auto-refresh mỗi 10 giây                                │
└─────────────┬──────────────────────────────────────────────┘
              │
              │ GET /api/trips/active
              ▼
┌────────────────────────────────────────────────────────────┐
│              API: /api/trips/active                         │
│  1. Query trips từ DB (status: in_progress)                │
│  2. Populate route & stops                                 │
│  3. Gọi BusSimulationService.calculateCurrentPosition()    │
│  4. Trả về vị trí tất cả xe bus                           │
└─────────────┬──────────────────────────────────────────────┘
              │
              │ calculateCurrentPosition()
              ▼
┌────────────────────────────────────────────────────────────┐
│         BusSimulationService (Core Logic)                   │
│  - Parse thời gian hiện tại                                │
│  - Tìm segment đang chạy                                   │
│  - Tính % hoàn thành segment                               │
│  - Nội suy vị trí (interpolation)                          │
│  - Tính khoảng cách, hướng, tiến độ                        │
└────────────────────────────────────────────────────────────┘
              │
              │ POST /api/notifications/check
              ▼
┌────────────────────────────────────────────────────────────┐
│         NotificationService                                 │
│  - Check khoảng cách đến trường                            │
│  - Nếu < 1km → Tạo notification                           │
│  - Lưu vào Notification collection                         │
└────────────────────────────────────────────────────────────┘
```

## 📁 Files Created

### Services
1. **`src/service/BusSimulationService.ts`**
   - `calculateCurrentPosition()` - Tính vị trí hiện tại
   - `calculateDistance()` - Khoảng cách Haversine
   - `calculateBearing()` - Góc hướng
   - `interpolatePosition()` - Nội suy vị trí
   - `isWithinRadius()` - Kiểm tra trong bán kính

2. **`src/service/NotificationService.ts`**
   - `checkAndNotify()` - Kiểm tra và gửi notification
   - `checkAllTripsAndNotify()` - Xử lý tất cả trips
   - `notifyDeparture()` - Thông báo khởi hành
   - `notifyArrival()` - Thông báo đã đến

### API Endpoints
3. **`src/app/api/trips/active/route.ts`**
   - GET: Lấy tất cả trips đang hoạt động với vị trí tính toán

4. **`src/app/api/notifications/check/route.ts`**
   - POST: Kiểm tra và gửi notifications

### Components
5. **`src/components/MultiTripMapView.tsx`**
   - Hiển thị nhiều xe bus trên bản đồ
   - Custom markers với màu sắc khác nhau
   - Popups với thông tin chi tiết

6. **`src/app/multi-trip-tracking/page.tsx`**
   - Page chính để tracking nhiều chuyến
   - Sidebar danh sách trips
   - Auto-refresh

### Scripts
7. **`scripts/create-sample-trips.ts`**
   - Tạo dữ liệu mẫu: stops, buses, routes, trips

## 🚀 Quick Start

### 1. Tạo dữ liệu mẫu

```bash
npm run create-sample-trips
```

Output:
```
✅ Sample data created successfully!
═══════════════════════════════════════
📍 Stops: 6
🚌 Buses: 3
🛣️  Routes: 3
🗓️  Trips: 3
═══════════════════════════════════════

📋 Trips Details:
  1. 51B-123.45 - Tuyến 1: Bến Thành - Lê Quý Đôn
  2. 51B-678.90 - Tuyến 2: Nhà Thờ - ĐH KHTN
  3. 51B-111.22 - Tuyến 3: Thảo Cầm Viên - Lê Quý Đôn
```

### 2. Chạy development server

```bash
npm run dev
```

### 3. Mở browser

```
http://localhost:3000/multi-trip-tracking
```

## 📊 Data Models

### Trip Schema

```typescript
{
  routeId: ObjectId,          // Ref to Route
  busId: ObjectId,            // Ref to Bus
  driverId: ObjectId,         // Ref to Driver
  studentIds: ObjectId[],     // Refs to Students
  tripDate: Date,             // Ngày chuyến đi
  direction: 'departure' | 'arrival',
  status: 'scheduled' | 'in_progress' | 'completed',
  actualStartTime: Date,      // Thời gian thực tế bắt đầu
  actualEndTime: Date,        // Thời gian thực tế kết thúc
}
```

### Route Schema

```typescript
{
  name: String,               // Tên tuyến
  department: String,         // Điểm đi
  arrival: String,            // Điểm đến
  time: String,               // Thời gian khởi hành (HH:mm)
  busId: ObjectId,            // Xe bus phụ trách
  stops: [{
    stopId: ObjectId,         // Ref to Stop
    order: Number,            // Thứ tự trạm
    estimatedArrivalTime: String, // HH:mm
  }]
}
```

### Stop Schema

```typescript
{
  name: String,               // Tên trạm
  address: String,            // Địa chỉ
  location: {
    type: 'Point',
    coordinates: [lng, lat]   // GeoJSON
  }
}
```

## 🔢 Calculation Examples

### Example 1: Tính vị trí hiện tại

**Input:**
- Route: 3 stops (A → B → C)
- Stop A: 06:30, Stop B: 06:40, Stop C: 06:50
- Current time: 06:35
- Average speed: 30 km/h

**Process:**
1. Xác định segment: A → B (06:30 - 06:40)
2. Thời gian vào segment: 5 phút (06:35 - 06:30)
3. Tổng thời gian segment: 10 phút (06:40 - 06:30)
4. Progress: 5/10 = 50%
5. Vị trí = A + (B - A) × 50%

**Output:**
```json
{
  "latitude": 10.775,
  "longitude": 106.698,
  "currentSpeed": 30,
  "heading": 45,
  "nextStopId": "stop_B",
  "nextStopName": "Nhà Thờ Đức Bà",
  "distanceToNextStop": 1.5,
  "estimatedTimeToNextStop": 3,
  "progress": 33.3
}
```

### Example 2: Notification trigger

**Conditions:**
- Xe bus ở: (10.770, 106.695)
- Trường ở: (10.771, 106.667)
- Khoảng cách: ~2.5 km
- Trigger radius: 1 km

**Result:** ❌ Chưa gửi notification (distance > 1km)

**5 phút sau:**
- Xe bus ở: (10.771, 106.668)
- Khoảng cách: ~0.8 km

**Result:** ✅ Gửi notification "Xe bus sắp đến trường"

## 📱 API Usage

### GET /api/trips/active

Lấy tất cả trips đang hoạt động với vị trí real-time.

**Request:**
```bash
curl http://localhost:3000/api/trips/active
```

**Query params:**
- `date` (optional): YYYY-MM-DD format, mặc định hôm nay
- `direction` (optional): 'departure' | 'arrival'

**Response:**
```json
{
  "success": true,
  "count": 3,
  "currentTime": "2024-10-28T06:35:00.000Z",
  "data": [
    {
      "tripId": "67...",
      "direction": "departure",
      "status": "in_progress",
      "route": {
        "name": "Tuyến 1: Bến Thành - Lê Quý Đôn",
        "department": "Bến Thành",
        "arrival": "Trường THPT Lê Quý Đôn"
      },
      "bus": {
        "plateNumber": "51B-123.45",
        "capacity": 40
      },
      "position": {
        "latitude": 10.775,
        "longitude": 106.698,
        "speed": 30,
        "heading": 45
      },
      "nextStop": {
        "name": "Nhà Thờ Đức Bà",
        "distance": 1.5,
        "estimatedTime": 3
      },
      "progress": 33.3,
      "departureTime": "06:30"
    }
  ]
}
```

### POST /api/notifications/check

Kiểm tra và gửi notifications cho tất cả trips.

**Request:**
```bash
curl -X POST http://localhost:3000/api/notifications/check \
  -H "Content-Type: application/json" \
  -d '{
    "trips": [...],
    "schoolLocation": {
      "name": "Trường THPT",
      "latitude": 10.771,
      "longitude": 106.667
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "notificationsSent": 2,
  "message": "Checked 3 trips, sent 2 notifications"
}
```

## ⚙️ Configuration

### Tốc độ trung bình

Hiện tại hardcode 30 km/h. Có thể thêm vào Route model:

```typescript
// src/models/route.model.ts
export interface IRoute extends Document {
  averageSpeed?: number; // km/h, mặc định 30
}
```

### Thời gian dừng tại trạm

Hiện tại mặc định 2 phút. Có thể thêm vào Stop:

```typescript
// src/models/route.model.ts
interface IRouteStopInfo {
  stopId: IStop['_id'];
  order: number;
  estimatedArrivalTime: string;
  dwellTime?: number; // Phút, mặc định 2
}
```

### Notification radius

Thay đổi trong NotificationService:

```typescript
const trigger: NotificationTrigger = {
  radiusKm: 2, // 2km thay vì 1km
};
```

### Auto-refresh interval

Thay đổi trong page:

```typescript
const interval = setInterval(() => {
  fetchTrips();
}, 5000); // 5 giây thay vì 10 giây
```

## 🎨 UI Features

### Sidebar
- Danh sách tất cả trips
- Click để select
- Progress bar cho mỗi trip
- Color coding

### Map
- Multiple bus markers với màu khác nhau
- Auto fit bounds
- Popups với thông tin
- Rotate icon theo hướng di chuyển

### Info Panel
- Chi tiết trip được chọn
- Real-time updates
- Tốc độ, tiến độ, trạm kế

## 🐛 Troubleshooting

### Xe bus không di chuyển

1. Kiểm tra thời gian khởi hành:
   ```bash
   # Trips phải có estimatedArrivalTime trong tương lai gần
   ```

2. Kiểm tra status:
   ```bash
   # Trip status phải là 'in_progress'
   db.trips.find({ status: 'in_progress' })
   ```

### Notification không gửi

1. Kiểm tra khoảng cách:
   ```javascript
   console.log('Distance:', distance, 'Radius:', radiusKm);
   ```

2. Kiểm tra đã gửi chưa:
   ```bash
   db.notifications.find({
     type: 'approaching_school',
     createdAt: { $gte: new Date().setHours(0,0,0,0) }
   })
   ```

### Map không hiển thị

1. Kiểm tra trips có data:
   ```bash
   curl http://localhost:3000/api/trips/active
   ```

2. Check console errors

## 🚀 Next Steps

### Phase 1: Tối ưu simulation
- [ ] Lưu trữ thực tế tốc độ trung bình
- [ ] Xử lý tắc đường (delay factor)
- [ ] Historical data để predict chính xác hơn

### Phase 2: Enhanced notifications
- [ ] Push notifications (FCM)
- [ ] SMS integration
- [ ] Email notifications
- [ ] Custom notification preferences

### Phase 3: Advanced features
- [ ] Route optimization
- [ ] Traffic data integration
- [ ] Weather impact
- [ ] Geofencing alerts
- [ ] Parent app mobile

### Phase 4: Analytics
- [ ] On-time performance
- [ ] Route efficiency
- [ ] Popular routes
- [ ] Student attendance correlation

## 📚 Related Documentation

- [Real-time Tracking](./REALTIME_TRACKING.md) - GPS-based tracking
- [MapView README](./MapView-README.md) - Map component
- [Mapbox Migration](./MAPBOX_MIGRATION.md) - Map library migration

## 💡 Tips

1. **Tạo trips mới mỗi ngày:**
   ```bash
   npm run create-sample-trips
   ```

2. **Test với thời gian khác nhau:**
   - Sửa `estimatedArrivalTime` trong script
   - Hoặc đổi thời gian hệ thống

3. **Monitor notifications:**
   ```javascript
   // In browser console
   setInterval(async () => {
     const res = await fetch('/api/parent/notifications');
     const data = await res.json();
     console.log('Notifications:', data);
   }, 5000);
   ```

Happy tracking! 🚌✨
