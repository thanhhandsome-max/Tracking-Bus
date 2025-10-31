# MapView Migration: Leaflet → Mapbox GL JS + GraphHopper

## ✅ Đã hoàn thành

### 1. Gỡ bỏ Leaflet
- ❌ Xóa packages: `leaflet`, `leaflet-routing-machine`, `react-leaflet`
- ❌ Xóa thư mục: `src/components/map/` (các hooks Leaflet cũ)
- ❌ Xóa imports Leaflet CSS trong `globals.css`

### 2. Cài đặt Mapbox GL JS
- ✅ Package: `mapbox-gl` và `@types/mapbox-gl`
- ✅ Map engine: Mapbox GL JS (modern, GPU-accelerated)
- ✅ Style: `mapbox://styles/mapbox/streets-v12`

### 3. Tích hợp GraphHopper API
- ✅ API Key: `644e34bf-5fb2-4c91-b25c-ebb00d9bb557`
- ✅ Endpoint: `https://graphhopper.com/api/1/route`
- ✅ Vehicle: `car`
- ✅ Locale: `vi` (Vietnamese)

## 🎯 Tính năng mới

### MapView Component

**Props:**
```typescript
interface MapViewProps {
  stops: Stop[];              // Danh sách điểm dừng
  height?: string;            // Chiều cao map (default: '500px')
  showRoute?: boolean;        // Hiện đường đi (default: true)
  useRealRouting?: boolean;   // Dùng routing thực tế (default: true)
  busLocation?: BusLocation;  // Vị trí xe buýt (optional)
  showBus?: boolean;          // Hiện xe buýt (default: false)
  mapboxToken?: string;       // Mapbox token tùy chỉnh (optional)
  graphHopperKey?: string;    // GraphHopper API key (default: your key)
}
```

**Example:**
```tsx
<MapView 
  stops={[
    { name: 'Bến xe Miền Đông', lat: 10.8142, lng: 106.7066, type: 'pickup' },
    { name: 'Landmark 81', lat: 10.7943, lng: 106.7212, type: 'stop' },
    { name: 'Thảo Cầm Viên', lat: 10.7881, lng: 106.7053, type: 'dropoff' }
  ]}
  height="600px"
  useRealRouting={true}
  graphHopperKey="644e34bf-5fb2-4c91-b25c-ebb00d9bb557"
/>
```

### Features:

1. **Interactive Map**
   - Zoom, pan, rotate controls
   - Smooth animations
   - Touch support

2. **Custom Markers**
   - 🟢 Green: Pickup points
   - 🔴 Red: Dropoff points
   - 🔵 Blue: Regular stops
   - 🚌 Bus icon: Vehicle location

3. **Routing Modes**
   - **Real Routing (GraphHopper)**: Đường màu xanh dương đậm theo đường phố thực tế
   - **Straight Line**: Đường nét đứt màu xám nối thẳng các điểm

4. **Route Information**
   - Distance (km)
   - Estimated time (minutes)
   - Number of coordinate points
   - Console logging for debugging

5. **Popups**
   - Click markers để xem thông tin
   - Tên điểm dừng
   - Thời gian (nếu có)
   - Tốc độ xe buýt (nếu có)

## 🧪 Test Pages

### 1. `/routing-test-new` - GraphHopper Test Page
Test routing mới với Mapbox + GraphHopper
```
http://localhost:3001/routing-test-new
```

Features:
- Toggle Real Routing ON/OFF
- 3 test stops in Ho Chi Minh City
- Console logs in browser F12
- Network tab shows GraphHopper API calls

### 2. `/test-osrm` - OSRM API Test (old)
Trang test OSRM API cũ (không dùng nữa)

## 📊 Console Logs

Khi sử dụng Real Routing, bạn sẽ thấy trong console:

```
🚗 Fetching route from GraphHopper API...
🌐 GraphHopper URL: https://graphhopper.com/api/1/route?point=...
✅ GraphHopper Response: {paths: [...], info: {...}}
📏 Route details: {distance: "5.23 km", time: "12 minutes", points: 234}
✅ Route drawn successfully!
```

Nếu lỗi:
```
❌ Routing error: Error: HTTP 401: Unauthorized
```

## 🔧 Configuration

### Mapbox Token

Default: Public demo token (có giới hạn)

Để dùng token riêng:
1. Đăng ký tại: https://www.mapbox.com/
2. Lấy access token
3. Pass vào prop `mapboxToken`:

```tsx
<MapView 
  stops={stops}
  mapboxToken="pk.eyJ1IjoieW91ciIsImEiOiJYWFhYWFgifQ.XXXXX"
/>
```

### GraphHopper API Key

Default: `644e34bf-5fb2-4c91-b25c-ebb00d9bb557`

Để dùng key riêng:
1. Đăng ký tại: https://www.graphhopper.com/
2. Lấy API key
3. Pass vào prop `graphHopperKey`

## 🎨 Styling

CSS Module: `src/components/MapView.module.css`

Classes:
- `.map-container` - Container chính
- `.map-wrapper` - Map canvas
- `.map-legend` - Legend overlay
- `.marker` - Marker elements
- `.busMarker` - Bus marker với animation

Animation:
```css
@keyframes busPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}
```

## 🚀 Migration Guide

### Old (Leaflet):
```tsx
import MapView from '@/components/MapView';

<MapView 
  stops={stops}
  useRealRouting={true}
/>
```

### New (Mapbox + GraphHopper):
```tsx
import MapView from '@/components/MapView';

<MapView 
  stops={stops}
  useRealRouting={true}
  graphHopperKey="644e34bf-5fb2-4c91-b25c-ebb00d9bb557"
/>
```

**Props changes:**
- `busLocation` now accepts `{ lat, lng, speed?, timestamp? }`
- Added `showBus` prop
- Added `mapboxToken` prop
- Added `graphHopperKey` prop

## ⚠️ Breaking Changes

1. **Removed files:**
   - `src/components/map/` folder (all hooks)
   - Leaflet CSS imports

2. **Removed dependencies:**
   - `leaflet`
   - `leaflet-routing-machine`
   - `react-leaflet`
   - `@types/leaflet`
   - `@types/leaflet-routing-machine`

3. **Changed behavior:**
   - Map center: Now uses first stop's coordinates if available
   - Routing: GraphHopper API instead of OSRM
   - Markers: Mapbox markers instead of Leaflet divIcons

## 🐛 Troubleshooting

### Map không hiển thị
- Kiểm tra Mapbox token có hợp lệ không
- Xem console có lỗi không
- Kiểm tra `height` prop được set chưa

### Routing không hoạt động
- Kiểm tra GraphHopper API key
- Xem Network tab (F12) có request thành công không
- Kiểm tra coordinates có đúng format `{lat, lng}` không
- GraphHopper có thể bị rate limit

### Lỗi 401 Unauthorized
- GraphHopper API key hết hạn hoặc không hợp lệ
- Đăng ký key mới tại https://www.graphhopper.com/

### Markers không hiện
- Kiểm tra `stops` array có dữ liệu không
- Kiểm tra `lat`, `lng` có đúng không (lat: -90 to 90, lng: -180 to 180)

## 📝 Notes

- Mapbox GL JS requires WebGL support
- GraphHopper free tier có giới hạn: 500 requests/day
- Mapbox demo token có giới hạn: 50,000 requests/month
- Nên dùng API keys riêng cho production

## 🔗 Resources

- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/api/)
- [GraphHopper API Docs](https://docs.graphhopper.com/)
- [GeoJSON Spec](https://geojson.org/)
