# Socket.IO Events Documentation - SSB 1.0

## Overview
This document describes the Socket.IO events used in the Smart School Bus Tracking System for real-time communication between the backend and frontend.

## Authentication

### Handshake Authentication
All Socket.IO connections require JWT authentication via the handshake:

```javascript
const socket = io('http://localhost:4000', {
  auth: {
    token: 'your-jwt-token-here'
  }
});
```

**Required**: `handshake.auth.token` (JWT) is mandatory for all connections.

**Client Connection Example**:
```javascript
// Frontend connection with JWT
const socket = io(WS_URL, { 
  auth: { token: "<JWT>" } 
});
```

**Server Validation**:
- JWT token is validated on connection
- Invalid/expired tokens result in connection rejection
- User role is extracted from JWT for room access control

## Rooms

### Room Structure
- `bus-{busId}` - Bus-specific room for position updates and status changes
- `trip-{tripId}` - Trip-specific room for trip events and student status
- `user-{userId}` - User-specific room for personal notifications
- `driver-{driverId}` - Driver-specific room for driver notifications
- `parent-{parentId}` - Parent-specific room for child tracking
- `admin` - Admin room for system-wide notifications
- `notifications-{userId}` - User-specific notification room

### Room Access Control
- **Admin**: Can join any room
- **Driver**: Can join `bus-{busId}`, `trip-{tripId}`, `driver-{driverId}`, `user-{userId}`
- **Parent**: Can join `parent-{parentId}`, `user-{userId}`, `notifications-{userId}`

### RBAC Room Join Permissions
- **Admin**: All rooms (bus-*, trip-*, user-*, driver-*, parent-*, admin, notifications-*)
- **Driver**: 
  - `bus-{busId}` (only buses assigned to driver)
  - `trip-{tripId}` (only trips assigned to driver)
  - `driver-{driverId}` (own driver room)
  - `user-{userId}` (own user room)
- **Parent**: 
  - `parent-{parentId}` (own parent room)
  - `user-{userId}` (own user room)
  - `notifications-{userId}` (own notifications)
  - `trip-{tripId}` (trips involving their children)
  - `bus-{busId}` (buses carrying their children)

## Events

### Connection Events

#### `connection`
**Triggered**: When a client connects
**Payload**: None
**Response**: None

#### `disconnect`
**Triggered**: When a client disconnects
**Payload**: None
**Response**: None

#### `error`
**Triggered**: When an error occurs
**Payload**:
```javascript
{
  message: "Error description",
  code: "ERROR_CODE"
}
```

### Authentication Events

#### `authenticate`
**Triggered**: Client to server
**Payload**:
```javascript
{
  token: "jwt-token"
}
```

#### `authenticated`
**Triggered**: Server to client
**Payload**:
```javascript
{
  success: true,
  user: {
    id: 1,
    email: "user@example.com",
    role: "driver"
  }
}
```

#### `unauthorized`
**Triggered**: Server to client
**Payload**:
```javascript
{
  success: false,
  message: "Authentication failed"
}
```

### Room Events

#### `join-room`
**Triggered**: Client to server
**Payload**:
```javascript
{
  room: "bus-123"
}
```

#### `leave-room`
**Triggered**: Client to server
**Payload**:
```javascript
{
  room: "bus-123"
}
```

#### `joined-room`
**Triggered**: Server to client
**Payload**:
```javascript
{
  room: "bus-123",
  status: "joined"
}
```

#### `left-room`
**Triggered**: Server to client
**Payload**:
```javascript
{
  room: "bus-123",
  status: "left"
}
```

### Bus Events

#### `bus_position_update`
**Triggered**: Server to client
**Room**: `bus-{busId}`
**Frequency**: ≤ 1 time per 2-3 seconds per bus
**Payload**:
```javascript
{
  busId: 123,
  position: {
    lat: 10.762622,
    lng: 106.660172,
    speed: 45.5,
    heading: 180
  },
  timestamp: "2025-10-25T10:30:00Z",
  updatedBy: 1
}
```

#### `bus_status_change`
**Triggered**: Server to client
**Room**: `bus-{busId}`
**Payload**:
```javascript
{
  busId: 123,
  status: "hoat_dong", // hoat_dong, bao_tri, ngung_hoat_dong
  previousStatus: "bao_tri",
  timestamp: "2025-10-25T10:30:00Z",
  reason: "Maintenance completed"
}
```

#### `bus_assigned`
**Triggered**: Server to client
**Room**: `bus-{busId}`, `driver-{driverId}`
**Payload**:
```javascript
{
  busId: 123,
  driverId: 456,
  driverName: "Nguyễn Văn A",
  assignmentDate: "2025-10-25T10:30:00Z"
}
```

#### `bus_unassigned`
**Triggered**: Server to client
**Room**: `bus-{busId}`, `driver-{driverId}`
**Payload**:
```javascript
{
  busId: 123,
  driverId: 456,
  driverName: "Nguyễn Văn A",
  unassignmentDate: "2025-10-25T10:30:00Z",
  reason: "Driver change"
}
```

### Trip Events

#### `trip_started`
**Triggered**: Server to client
**Room**: `trip-{tripId}`, `bus-{busId}`, `driver-{driverId}`
**Payload**:
```javascript
{
  tripId: 789,
  busId: 123,
  driverId: 456,
  startTime: "2025-10-25T10:30:00Z",
  route: {
    id: 1,
    name: "Tuyến Quận 7 - Nhà Bè",
    stops: [
      { id: 1, name: "Ngã tư Nguyễn Văn Linh", lat: 10.762622, lng: 106.660172 },
      { id: 2, name: "Chung cư Sunrise City", lat: 10.7408, lng: 106.7075 }
    ]
  }
}
```

#### `trip_completed`
**Triggered**: Server to client
**Room**: `trip-{tripId}`, `bus-{busId}`, `driver-{driverId}`
**Payload**:
```javascript
{
  tripId: 789,
  busId: 123,
  driverId: 456,
  endTime: "2025-10-25T11:30:00Z",
  duration: 3600, // seconds
  totalStudents: 25,
  completedStudents: 24,
  absentStudents: 1
}
```

#### `trip_cancelled`
**Triggered**: Server to client
**Room**: `trip-{tripId}`, `bus-{busId}`, `driver-{driverId}`
**Payload**:
```javascript
{
  tripId: 789,
  busId: 123,
  driverId: 456,
  cancelTime: "2025-10-25T10:30:00Z",
  reason: "Vehicle breakdown",
  affectedStudents: 25
}
```

#### `trip_delayed`
**Triggered**: Server to client
**Room**: `trip-{tripId}`, `bus-{busId}`, `driver-{driverId}`
**Payload**:
```javascript
{
  tripId: 789,
  busId: 123,
  driverId: 456,
  delayMinutes: 15,
  reason: "Traffic jam",
  estimatedArrival: "2025-10-25T10:45:00Z"
}
```

#### `trip_status_change`
**Triggered**: Server to client
**Room**: `trip-{tripId}`, `bus-{busId}`
**Payload**:
```javascript
{
  tripId: 789,
  status: "dang_chay", // chua_khoi_hanh, dang_chay, hoan_thanh, huy
  previousStatus: "chua_khoi_hanh",
  timestamp: "2025-10-25T10:30:00Z"
}
```

### Student Events

#### `student_picked_up`
**Triggered**: Server to client
**Room**: `trip-{tripId}`, `parent-{parentId}`
**Payload**:
```javascript
{
  tripId: 789,
  studentId: 101,
  studentName: "Nguyễn Văn B",
  parentId: 201,
  pickupTime: "2025-10-25T10:35:00Z",
  stopName: "Ngã tư Nguyễn Văn Linh",
  busId: 123
}
```

#### `student_dropped_off`
**Triggered**: Server to client
**Room**: `trip-{tripId}`, `parent-{parentId}`
**Payload**:
```javascript
{
  tripId: 789,
  studentId: 101,
  studentName: "Nguyễn Văn B",
  parentId: 201,
  dropoffTime: "2025-10-25T11:25:00Z",
  stopName: "Trường Tiểu học ABC",
  busId: 123
}
```

#### `student_absent`
**Triggered**: Server to client
**Room**: `trip-{tripId}`, `parent-{parentId}`
**Payload**:
```javascript
{
  tripId: 789,
  studentId: 101,
  studentName: "Nguyễn Văn B",
  parentId: 201,
  absentTime: "2025-10-25T10:35:00Z",
  stopName: "Ngã tư Nguyễn Văn Linh",
  reason: "Not at pickup point"
}
```

#### `student_status_change`
**Triggered**: Server to client
**Room**: `trip-{tripId}`, `parent-{parentId}`
**Payload**:
```javascript
{
  tripId: 789,
  studentId: 101,
  studentName: "Nguyễn Văn B",
  parentId: 201,
  status: "da_don", // cho_don, da_don, da_tra, vang
  previousStatus: "cho_don",
  timestamp: "2025-10-25T10:35:00Z"
}
```

### Stop Events

#### `approaching_stop`
**Triggered**: Server to client
**Room**: `bus-{busId}`, `trip-{tripId}`
**Payload**:
```javascript
{
  busId: 123,
  tripId: 789,
  stopId: 1,
  stopName: "Ngã tư Nguyễn Văn Linh",
  distance: 100, // meters
  etaMinutes: 2,
  students: [
    { id: 101, name: "Nguyễn Văn B", parentId: 201 }
  ]
}
```

#### `arrived_at_stop`
**Triggered**: Server to client
**Room**: `bus-{busId}`, `trip-{tripId}`
**Payload**:
```javascript
{
  busId: 123,
  tripId: 789,
  stopId: 1,
  stopName: "Ngã tư Nguyễn Văn Linh",
  arrivalTime: "2025-10-25T10:35:00Z",
  students: [
    { id: 101, name: "Nguyễn Văn B", parentId: 201 }
  ]
}
```

#### `left_stop`
**Triggered**: Server to client
**Room**: `bus-{busId}`, `trip-{tripId}`
**Payload**:
```javascript
{
  busId: 123,
  tripId: 789,
  stopId: 1,
  stopName: "Ngã tư Nguyễn Văn Linh",
  departureTime: "2025-10-25T10:40:00Z",
  nextStop: {
    id: 2,
    name: "Chung cư Sunrise City",
    etaMinutes: 5
  }
}
```

### Alert Events

#### `delay_alert`
**Triggered**: Server to client
**Room**: `trip-{tripId}`, `bus-{busId}`, `parent-{parentId}`
**Payload**:
```javascript
{
  tripId: 789,
  busId: 123,
  delayMinutes: 15,
  reason: "Traffic jam",
  affectedStudents: 25,
  estimatedArrival: "2025-10-25T10:45:00Z",
  alertLevel: "medium" // low, medium, high
}
```

#### `emergency_alert`
**Triggered**: Server to client
**Room**: `bus-{busId}`, `trip-{tripId}`, `admin`
**Payload**:
```javascript
{
  busId: 123,
  tripId: 789,
  alertType: "accident", // accident, breakdown, medical, security
  severity: "high", // low, medium, high, critical
  location: {
    lat: 10.762622,
    lng: 106.660172,
    address: "Ngã tư Nguyễn Văn Linh"
  },
  description: "Vehicle breakdown on route",
  timestamp: "2025-10-25T10:30:00Z",
  affectedStudents: 25
}
```

#### `maintenance_alert`
**Triggered**: Server to client
**Room**: `bus-{busId}`, `admin`
**Payload**:
```javascript
{
  busId: 123,
  alertType: "scheduled_maintenance",
  maintenanceDate: "2025-10-26T08:00:00Z",
  duration: 4, // hours
  description: "Regular maintenance scheduled",
  affectedTrips: [789, 790]
}
```

#### `weather_alert`
**Triggered**: Server to client
**Room**: `admin`, `driver-{driverId}`
**Payload**:
```javascript
{
  alertType: "weather_warning",
  severity: "high",
  weatherCondition: "heavy_rain",
  affectedArea: "Quận 7",
  description: "Heavy rain expected, drive carefully",
  validUntil: "2025-10-25T18:00:00Z"
}
```

### Notification Events

#### `notification`
**Triggered**: Server to client
**Room**: `notifications-{userId}`, `user-{userId}`
**Payload**:
```javascript
{
  id: 1001,
  title: "Xe sắp tới điểm đón",
  message: "Xe 51A-12345 sắp tới Ngã tư Nguyễn Văn Linh trong 5 phút",
  type: "trip_update", // trip_update, delay_alert, emergency, system
  priority: "medium", // low, medium, high, urgent
  timestamp: "2025-10-25T10:30:00Z",
  data: {
    tripId: 789,
    busId: 123,
    stopId: 1
  }
}
```

#### `notification_read`
**Triggered**: Server to client
**Room**: `notifications-{userId}`
**Payload**:
```javascript
{
  notificationId: 1001,
  readTime: "2025-10-25T10:35:00Z"
}
```

#### `notification_deleted`
**Triggered**: Server to client
**Room**: `notifications-{userId}`
**Payload**:
```javascript
{
  notificationId: 1001,
  deletedTime: "2025-10-25T10:35:00Z"
}
```

### System Events

#### `system_maintenance`
**Triggered**: Server to client
**Room**: `admin`, `user-{userId}`
**Payload**:
```javascript
{
  maintenanceType: "scheduled",
  startTime: "2025-10-26T02:00:00Z",
  endTime: "2025-10-26T04:00:00Z",
  description: "Database maintenance",
  affectedServices: ["api", "socket", "database"]
}
```

#### `system_update`
**Triggered**: Server to client
**Room**: `admin`
**Payload**:
```javascript
{
  version: "1.1.0",
  updateType: "minor",
  releaseNotes: "Bug fixes and performance improvements",
  updateTime: "2025-10-25T10:30:00Z"
}
```

#### `system_error`
**Triggered**: Server to client
**Room**: `admin`
**Payload**:
```javascript
{
  errorType: "database_connection",
  severity: "high",
  message: "Database connection lost",
  timestamp: "2025-10-25T10:30:00Z",
  affectedServices: ["api", "socket"]
}
```

## Error Handling

### Connection Errors
- **Authentication failed**: Client receives `unauthorized` event
- **Room access denied**: Client receives `error` event with access denied message
- **Rate limit exceeded**: Client receives `error` event with rate limit message

### Event Errors
- **Invalid payload**: Server logs error and sends `error` event
- **Permission denied**: Server sends `error` event with permission message
- **Room not found**: Server sends `error` event with room not found message

## Best Practices

### Client Implementation
1. Always authenticate before joining rooms
2. Handle connection errors gracefully
3. Implement reconnection logic
4. Validate event payloads
5. Use appropriate room subscriptions based on user role

### Server Implementation
1. Validate JWT tokens on connection
2. Check room access permissions
3. Rate limit event emissions
4. Log all events for debugging
5. Handle disconnections gracefully

### Performance Considerations
1. Use room-based broadcasting instead of global events
2. Implement event throttling for high-frequency updates
3. Use compression for large payloads
4. Monitor connection counts and memory usage
5. Implement event queuing for offline clients

## Testing

### Unit Tests
- Test event handlers
- Test room management
- Test authentication
- Test error handling

### Integration Tests
- Test client-server communication
- Test room subscriptions
- Test event broadcasting
- Test reconnection logic

### Load Tests
- Test with multiple concurrent connections
- Test event broadcasting performance
- Test memory usage under load
- Test connection stability
