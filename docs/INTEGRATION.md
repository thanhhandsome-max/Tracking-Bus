# Integrated Bus Tracking System - Documentation

## Overview
Completed integration of all bus tracking features into a cohesive, user-friendly dashboard system with clean navigation and linked features.

## System Architecture

### Navigation Structure
```
Homepage (/)
├── Multi-Trip Tracking (/multi-trip-tracking)
├── Routes (/routes)
├── History (/history)
└── Notifications (/notifications)
```

All pages are connected through:
1. **Global Navigation Bar** - Appears on all pages with active state highlighting
2. **Quick Actions** - Dashboard cards linking to main features
3. **Context Links** - Direct links from trip cards, notifications, etc.

## Completed Features

### 1. Homepage Dashboard (`/`)
**File**: `src/app/page.tsx`
**Features**:
- Quick action cards (4 main sections)
- Active trips display (fetches from `/api/trips/active`)
- Student cards with "Theo dõi" buttons
- Recent notifications panel
- Responsive grid layout

**Links**:
- "Theo dõi xe bus" → `/multi-trip-tracking`
- "Tuyến đường" → `/routes`
- "Lịch sử" → `/history`
- "Thông báo" → `/notifications`
- Student tracking → `/multi-trip-tracking`

### 2. Multi-Trip Tracking (`/multi-trip-tracking`)
**Files**:
- `src/app/multi-trip-tracking/page.tsx`
- `src/app/multi-trip-tracking/page.module.css`
- `src/components/MultiTripMapView.tsx`

**Features**:
- Display multiple buses simultaneously on one map
- Sidebar with trip cards and progress bars
- Real-time position updates (10-second refresh)
- Click to select and focus on specific trip
- Color-coded bus markers (6 colors)
- Auto-notification checks
- Selected trip overlay with details

**Data Flow**:
1. Fetch active trips from `/api/trips/active`
2. Calculate positions using `BusSimulationService`
3. Display on `MultiTripMapView` component
4. Auto-refresh every 10 seconds
5. Check notifications via `/api/notifications/check`

### 3. Routes Page (`/routes`)
**File**: `src/app/routes/page.tsx`
**Features**:
- List of all bus routes
- Route details (bus number, driver, student count)
- Map view showing route stops
- Click to view route on map

**Existing Features**:
- Route list with mock data
- Map visualization of stops
- Route selection UI

**Note**: Already has good structure, just updated navigation links.

### 4. History Page (`/history`)
**Files**:
- `src/app/history/page.tsx` (NEW - replaced old calendar view)
- `src/app/history/page.module.css`

**Features**:
- Date and direction filters
- Stats cards (total trips, to school, to home, student count)
- Trip cards with details
- Link to view trip route in tracking page

**Changes Made**:
- Replaced old calendar view with list view
- Added filtering by date and direction
- Added stats summary
- Links to `/multi-trip-tracking?trip={tripId}`

**Mock Data**:
- 5 sample trips (mix of completed trips)
- Different routes, buses, dates
- Shows trip statistics

### 5. Notifications Page (`/notifications`)
**Files**:
- `src/app/notifications/page.tsx` (NEW)
- `src/app/notifications/page.module.css` (NEW)

**Features**:
- Notification list with read/unread status
- Filter by all/unread/read
- Mark as read (single or all)
- Notification types:
  - 🏫 Approaching school (1km radius)
  - 🚌 Trip started
  - ✅ Trip completed
- Link to view trip details
- Unread badge count

**Mock Data**:
- 4 sample notifications
- Different types and statuses
- Timestamps in Vietnamese format

## Global Components

### Header Component
**File**: `src/app/header/Header.tsx`
**Features**:
- App logo and name
- User profile section (clickable)
- User profile modal integration
- Sticky positioning

### Navigation Component
**File**: `src/components/Navigation.tsx`
**Updated Links**:
- Trang chủ → `/`
- Theo dõi xe → `/multi-trip-tracking`
- Tuyến đường → `/routes`
- Lịch sử → `/history`
- Thông báo → `/notifications`

**Features**:
- Auto-detects active page using `usePathname()`
- Active tab highlighting
- Sticky navigation bar

### Layout
**File**: `src/app/layout.tsx`
**Structure**:
```tsx
<html>
  <body>
    <Header />
    <Navigation />
    <main>{children}</main>
    <footer>...</footer>
  </body>
</html>
```

## Services & APIs

### BusSimulationService
**File**: `src/service/BusSimulationService.ts`
**Purpose**: Calculate bus positions without GPS

**Key Functions**:
- `calculateCurrentPosition(route, departureTime, currentTime)`
- `calculateDistance(lat1, lng1, lat2, lng2)` - Haversine
- `calculateBearing(lat1, lng1, lat2, lng2)`
- `interpolatePosition(start, end, progress)`

**Algorithm**:
1. Parse time strings to minutes
2. Find current segment between stops
3. Calculate time elapsed since departure
4. Interpolate position along segment
5. Return lat/lng, speed, heading, next stop, progress

### NotificationService
**File**: `src/service/NotificationService.ts`
**Purpose**: Auto-notify parents when bus is near school

**Key Functions**:
- `checkAndNotify(trigger, busPosition)`
- `checkAllTripsAndNotify(trips[], schoolLocation)`
- `notifyDeparture(tripId)`
- `notifyArrival(tripId)`

**Logic**:
- Check distance from school using Haversine formula
- Trigger notification when within 1km radius
- Spam prevention: max 1 notification/trip/day
- Different notification types for different events

### API Endpoints

#### GET `/api/trips/active`
**Purpose**: Get all active trips with calculated positions

**Query Params**:
- `date` (optional): Filter by date
- `direction` (optional): 'departure' or 'arrival'

**Response**:
```json
[
  {
    "tripId": "...",
    "bus": {...},
    "route": {...},
    "position": {
      "lat": 10.762622,
      "lng": 106.660172,
      "speed": 35,
      "heading": 120,
      "timestamp": "..."
    },
    "nextStop": {...},
    "progress": 0.45
  }
]
```

#### POST `/api/notifications/check`
**Purpose**: Check all trips and send notifications

**Body**:
```json
{
  "trips": [...],
  "schoolLocation": {
    "lat": 10.762622,
    "lng": 106.660172
  }
}
```

**Response**:
```json
{
  "notificationsSent": 3,
  "notifications": [...]
}
```

## Data Models

### Trip Model
```typescript
{
  _id: ObjectId
  route: ObjectId → Route
  bus: ObjectId → Bus
  direction: 'departure' | 'arrival'
  tripDate: Date
  departureTime: string
  status: 'scheduled' | 'in_progress' | 'completed'
}
```

### Route Model
```typescript
{
  _id: ObjectId
  name: string
  department: string
  arrival: string
  stops: ObjectId[] → Stop[]
  estimatedArrivalTimes: string[]
  averageSpeed: number
}
```

### Notification Model
```typescript
{
  _id: ObjectId
  type: 'approaching_school' | 'trip_started' | 'trip_completed'
  message: string
  tripId: ObjectId
  createdAt: Date
  read: boolean
}
```

## User Flow Examples

### Flow 1: Parent tracks all active buses
1. Open homepage (`/`)
2. See active trips in "Chuyến đi đang hoạt động"
3. Click "Theo dõi xe bus" → `/multi-trip-tracking`
4. View all buses on map with real-time positions
5. Click specific bus to see details

### Flow 2: Parent checks notification
1. See unread badge on "Thông báo"
2. Click → `/notifications`
3. View notification: "Xe bus đang đến gần trường (cách 1km)"
4. Click "Xem chi tiết" → `/multi-trip-tracking?trip={tripId}`
5. See bus position on map

### Flow 3: Parent reviews history
1. Click "Lịch sử" from navigation
2. Open `/history` page
3. Filter by date or direction
4. See stats and trip cards
5. Click "Xem lộ trình" → `/multi-trip-tracking?trip={tripId}`

## Styling System

### Color Palette
- Primary: `#667eea` → `#764ba2` (gradient)
- Success: `#48bb78`
- Warning: `#f6ad55`
- Error: `#f56565`
- Info: `#4299e1`

### Component Styles
- Cards: White background, rounded corners, shadow on hover
- Buttons: Gradient background, transform on hover
- Progress bars: Gradient fills
- Badges: Gradient backgrounds with rounded corners

## Mock Data Structure

### Sample Trips (for testing)
Run: `npm run create-sample-trips`

Creates:
- 6 stops in TP.HCM
- 3 buses with different plate numbers
- 3 routes with time schedules
- 3 active trips for today

## Clean Code Status

### Deleted Files (Test Pages)
✅ `src/app/map-demo/` - Old map test
✅ `src/app/routing-test/` - Old routing test
✅ `src/app/routing-test-new/` - Newer routing test
✅ `src/app/test-osrm/` - OSRM API test

### Replaced Files
✅ `src/app/page.tsx` - Old homepage → New integrated dashboard
✅ `src/app/history/page.tsx` - Old calendar view → New list view

### New Files Created
✅ `src/app/page.module.css` - Dashboard styles
✅ `src/app/history/page.tsx` - New history page
✅ `src/app/history/page.module.css` - History styles
✅ `src/app/notifications/page.tsx` - Notifications page
✅ `src/app/notifications/page.module.css` - Notification styles
✅ `docs/INTEGRATION.md` - This file

### Updated Files
✅ `src/components/Navigation.tsx` - Updated navigation links

## Next Steps (Future Enhancements)

### Priority 1: Connect to Real Data
- [ ] Replace mock data with actual database queries
- [ ] Implement API endpoints for CRUD operations
- [ ] Add authentication and authorization

### Priority 2: Real-time Features
- [ ] WebSocket integration for live position updates
- [ ] Push notifications to mobile devices
- [ ] Real-time notification delivery

### Priority 3: User Features
- [ ] User profile management
- [ ] Student management (add/edit/delete)
- [ ] Custom notification preferences
- [ ] Export trip history to PDF

### Priority 4: Admin Features
- [ ] Admin dashboard
- [ ] Driver management
- [ ] Route planning tools
- [ ] Analytics and reports

## Testing Checklist

### Manual Testing
- [ ] Navigation works on all pages
- [ ] Active page highlighting works
- [ ] Links between pages work correctly
- [ ] Filters work on history and notifications pages
- [ ] Mark as read works on notifications
- [ ] Trip cards show correct data
- [ ] Map displays correctly with multiple buses
- [ ] Responsive design works on mobile

### Integration Testing
- [ ] Homepage fetches active trips
- [ ] Multi-trip tracking calculates positions
- [ ] Notification checks trigger correctly
- [ ] History filters apply correctly

## Deployment Checklist

### Before Production
- [ ] Replace all mock data with real API calls
- [ ] Set up MongoDB connection
- [ ] Configure environment variables
- [ ] Add error boundaries
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add authentication
- [ ] Test on different browsers
- [ ] Test on mobile devices
- [ ] Optimize images and assets
- [ ] Enable caching
- [ ] Set up monitoring

### Environment Variables
```env
MONGODB_URI=mongodb://...
NEXT_PUBLIC_MAPBOX_TOKEN=...
NEXT_PUBLIC_API_BASE_URL=...
```

## Support & Maintenance

### Known Limitations
1. **Mock Data**: All pages currently use hardcoded mock data
2. **No Authentication**: Anyone can access all pages
3. **No Real-time**: Updates require page refresh
4. **No Persistence**: Notifications marked as read reset on refresh

### Future Considerations
- Add TypeScript strict mode
- Add ESLint configuration
- Add unit tests
- Add E2E tests
- Add CI/CD pipeline
- Add documentation for API endpoints
- Add Swagger/OpenAPI specs

## Conclusion

The system now has:
✅ Integrated navigation across all pages
✅ Clean code with unused files removed
✅ Cohesive user experience
✅ All features linked together
✅ Responsive design
✅ Mock data for testing

Ready for:
🔄 Backend integration
🔄 Real-time features
🔄 Production deployment
