# MapView Component - Refactored Structure

## Cấu trúc mới

```
src/components/
├── MapView.tsx                 # Main component (ngắn gọn ~45 lines)
├── MapView.module.css          # CSS riêng cho map
└── map/                        # Thư mục con chứa logic
    ├── MapHelpers.ts           # Constants & helper functions
    ├── MapIcons.ts             # HTML templates cho markers
    ├── MapLegend.tsx           # Legend component
    ├── useMapInitialization.ts # Hook khởi tạo map
    ├── useMapMarkers.ts        # Hook quản lý markers
    ├── useMapRouting.ts        # Hook vẽ đường đi (FIX ROUTING)
    └── useMapBusMarker.ts      # Hook hiển thị xe buýt
```

## Cải tiến

### 1. **Tách CSS**
- File `MapView.module.css` chứa tất cả styles
- Sử dụng CSS Modules để tránh conflict
- Animation `busPulse` được định nghĩa trong CSS

### 2. **Chia nhỏ logic**
- Mỗi hook chịu trách nhiệm 1 việc cụ thể
- Dễ debug, dễ maintain
- Code reusable

### 3. **Fix Routing Issue**
- File `useMapRouting.ts` có logic xử lý routing thật
- Thêm error handling và fallback
- Thêm console.log để debug
- Sử dụng OSRM với profile 'driving'

### 4. **Type Safety**
- Export interface `Stop` từ MapView.tsx
- Các helper functions có proper types

## Sử dụng

```tsx
import MapView, { Stop } from '@/components/MapView';

const stops: Stop[] = [
  { name: 'Điểm A', lat: 10.762622, lng: 106.660172, type: 'pickup' },
  { name: 'Điểm B', lat: 10.768500, lng: 106.668500, type: 'stop' },
  { name: 'Điểm C', lat: 10.774800, lng: 106.676800, type: 'dropoff' }
];

<MapView
  stops={stops}
  busLocation={{ lat: 10.768500, lng: 106.668500 }}
  height="600px"
  showRoute={true}
  useRealRouting={true}  // Sử dụng OSRM
/>
```

## Debug Routing

### Test Page
Truy cập `/routing-test` để:
- Toggle giữa real routing và straight line
- Xem console logs real-time
- Test với 3 điểm thực tế ở TP.HCM

### Kiểm tra
1. Mở Developer Console (F12)
2. Xem tab Network → Filter "osrm"
3. Kiểm tra API calls đến router.project-osrm.org
4. Xem console logs:
   - "Creating routing with waypoints" → Bắt đầu routing
   - "Route found" → Thành công
   - "Routing error" → Có lỗi, fallback

### Common Issues

**Routing không hoạt động:**
- Kiểm tra internet connection
- OSRM service có thể bị giới hạn rate
- Tọa độ có hợp lệ không (phải là số thực)
- Distance quá xa (> 500km) có thể fail

**Giải pháp:**
- Code tự động fallback về straight line
- Check console để xem lỗi cụ thể
- Thử với tọa độ gần nhau hơn

## Performance

- Dynamic import Leaflet → tránh SSR errors
- Cleanup proper trong useEffect
- Debounce route updates
- Chỉ re-render khi cần thiết

## Future Improvements

- [ ] Cache routing results
- [ ] Support custom OSRM server
- [ ] Add route distance/duration display
- [ ] Animate bus along route
- [ ] Support multiple routing profiles (car, bike, walk)
