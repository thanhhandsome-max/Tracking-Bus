# AUDIT BÁO CÁO 02: BACKEND REVIEW
**Smart School Bus Tracking System (SSB 1.0)**  
**Ngày kiểm tra:** 2025-10-23  
**Phạm vi:** Backend API (Node.js/Express/Socket.IO)

---

## EXECUTIVE SUMMARY

### Tổng quan
Backend SSB 1.0 sử dụng **Node.js + Express + TypeScript** với Socket.IO cho realtime. Có 9 routes chính phục vụ M0-M8 theo kiến trúc.

### Kết luận
✅ **AUTH & FOUNDATION - READY**  
⚠️ **CRUD M1-M3 - PARTIALLY READY**  
❌ **REALTIME & TRIP LIFECYCLE - INCOMPLETE**  
❌ **STATS/REPORTING - FOUNDATION ONLY**

**Completion Rate: ~65%** (13/20 mục MM4 hoàn thành)

---

## 1. PROJECT STRUCTURE

### 1.1 Cấu trúc backend
```
ssb-backend/
├── src/
│   ├── app.js                    # Legacy entry point
│   ├── server.ts                 # Main entry point (TypeScript)
│   ├── config/                   # Environment, DB config
│   ├── constants/                # Error codes, routes, events
│   ├── controllers/              # Business logic
│   ├── middlewares/              # Auth, validation, CORS
│   ├── models/                   # DB access layer
│   ├── routes/api/               # REST endpoints
│   ├── services/                 # Business services
│   ├── utils/                    # Helpers (geo, JWT)
│   └── ws/                       # Socket.IO setup
├── dist/                         # Compiled JavaScript
├── package.json
├── tsconfig.json
└── .env.example
```

✅ **Cấu trúc rõ ràng, tuân theo MVC pattern.**

---

## 2. MODULE COVERAGE vs MM4

### 2.1 M0 - Identity & Access ✅ READY
| Endpoint | Method | Auth | Status | File |
|----------|--------|------|--------|------|
| `/auth/login` | POST | ❌ | ✅ | routes/api/auth.js:11 |
| `/auth/register` | POST | ❌ | ✅ | routes/api/auth.js:8 |
| `/auth/profile` | GET | ✅ | ✅ | routes/api/auth.js:17 |
| `/auth/refresh` | POST | ❌ | ✅ | routes/api/auth.js:46 |
| `/auth/logout` | POST | ✅ | ✅ | routes/api/auth.js:14 |
| `/auth/change-password` | PUT | ✅ | ✅ | routes/api/auth.js:27 |

**Implementation:**
- ✅ JWT với bcrypt hash password
- ✅ Middleware `AuthMiddleware.authenticate`, `authorize(roles)`
- ✅ WS handshake JWT (utils/wsAuth.js)
- ⚠️ Response format: Mixed envelope `{success, data}` hoặc `{success, code, message}`

**Defect:**
- 🔴 **BE-DEF-001**: Response không nhất quán với OpenAPI spec (thiếu `meta` field)

### 2.2 M1 - User & Asset Management ⚠️ PARTIAL
| Endpoint | Method | Auth | Status | File |
|----------|--------|------|--------|------|
| `/buses` | GET | ✅ Admin | ✅ | routes/api/bus.js:10 |
| `/buses` | POST | ✅ Admin | ✅ | routes/api/bus.js:36 |
| `/buses/:id` | GET | ✅ | ✅ | routes/api/bus.js:29 |
| `/buses/:id` | PUT | ✅ Admin | ✅ | routes/api/bus.js:50 |
| `/buses/:id` | DELETE | ✅ Admin | ✅ | routes/api/bus.js:68 |
| `/buses/:id/position` | POST | ✅ Driver | ✅ | routes/api/bus.js:118 |
| `/buses/stats` | GET | ✅ Admin | ✅ | routes/api/bus.js:21 |
| `/drivers` | GET | ✅ | ✅ | routes/api/driver.js:13 |
| `/students` | GET | ✅ | ✅ | routes/api/student.js:13 |

**Implementation:**
- ✅ CRUD đầy đủ cho Buses
- ✅ Pagination, search, sort (trong Service layer)
- ✅ Validation middleware
- ❌ **Thiếu:** CRUD Update/Delete cho Drivers, Students

**Defect:**
- 🟡 **BE-DEF-002**: Drivers/Students chỉ có GET, thiếu POST/PUT/DELETE endpoints

### 2.3 M2 - Route & Stop Management ⚠️ PARTIAL
| Endpoint | Method | Auth | Status | File |
|----------|--------|------|--------|------|
| `/routes` | GET | ✅ | ✅ | routes/api/route.js:13 |
| `/routes/:id/stops` | GET | ✅ | ✅ | - |
| `/routes/:id/stops` | POST | ✅ | ⚠️ | - |
| `/routes/:id/stops` | PUT | ✅ | ⚠️ | - |

**Implementation:**
- ✅ List routes với stops
- ⚠️ Partial implementation cho CRUD stops
- ❌ **Thiếu:** Reorder stops endpoint

### 2.4 M3 - Scheduler & Assignment ✅ READY
| Endpoint | Method | Auth | Status | File |
|----------|--------|------|--------|------|
| `/schedules` | GET | ✅ | ✅ | routes/api/schedule.js:13 |
| `/schedules` | POST | ✅ Admin | ✅ | routes/api/schedule.js:36 |
| `/schedules/:id` | GET | ✅ | ✅ | - |
| `/schedules/:id` | PUT | ✅ Admin | ✅ | - |
| `/schedules/:id` | DELETE | ✅ Admin | ✅ | - |

**Implementation:**
- ✅ CRUD đầy đủ
- ✅ Conflict detection (409) cho trùng lịch
- ✅ Validation: Bus/Driver time overlap

**Quality:** ⭐⭐⭐⭐⭐ Excellent

### 2.5 M4 - Realtime Tracking ❌ INCOMPLETE
| Feature | Status | File |
|---------|--------|------|
| Socket.IO setup | ✅ | ws/index.js:5 |
| JWT handshake | ✅ | ws/index.js:20 |
| Rooms (bus-*, trip-*, user-*) | ✅ | ws/index.js:48-49 |
| `bus_position_update` event | ✅ | ws/index.js:75 |
| `driver_gps` handler | ✅ | ws/index.js:96 |
| Throttle rate limit (2s) | ✅ | services/telemetryService.js:69 |
| Geofence 60m | ✅ | utils/geo.js:151 |

**Implementation:**
- ✅ Socket.IO server initialized
- ✅ Auth middleware cho WS
- ✅ Basic events: bus_position_update, ping/pong
- ✅ TelemetryService với geofence logic
- ❌ **Thiếu:** Broadcast to Redis/pub-sub cho scale
- ❌ **Thiếu:** Connection pooling metrics

**Quality:** ⭐⭐⭐⭐ Good (missing scalability features)

### 2.6 M5 - Trip Execution ❌ INCOMPLETE
| Endpoint | Method | Auth | Status | File |
|----------|--------|------|--------|------|
| `/trips` | GET | ✅ | ✅ | routes/api/trip.js:13 |
| `/trips/:id` | GET | ✅ | ✅ | - |
| `/trips/:id/start` | POST | ✅ Driver | ✅ | routes/api/trip.route.js |
| `/trips/:id/end` | POST | ✅ Driver | ✅ | routes/api/trip.route.js |
| `/trips/:id/students/:sid/status` | POST | ✅ | ❌ | **THIẾU** |

**Implementation:**
- ✅ GET list trips với filter (ngayChay, trangThai)
- ✅ Start/End trip with Socket.IO event emission
- ✅ Status update: chua_khoi_hanh → dang_chay → hoan_thanh
- ❌ **Thiếu:** Update student status endpoint
- ❌ **Thiếu:** Time validation (không end trước start)

**Events emitted:**
- ✅ `trip_started` → `trip-{id}` room
- ✅ `trip_completed` → `trip-{id}` room
- ❌ **Thiếu:** `trip_cancelled`

**Defect:**
- 🟡 **BE-DEF-003**: Start trip không validate driver đúng xe/lịch
- 🟡 **BE-DEF-004**: Thiếu cancel trip endpoint

### 2.7 M6 - Notifications ❌ NOT IMPLEMENTED
| Feature | Status | Notes |
|---------|--------|-------|
| approach_stop event | ✅ | services/telemetryService.js:171 |
| delay_alert event | ✅ | services/telemetryService.js:182 |
| Push FCM | ❌ | Firebase not configured |
| Email/SMS | ❌ | Not implemented |

**Events:**
- ✅ `approach_stop` emitted khi xe <60m điểm dừng
- ✅ `delay_alert` emitted khi trễ >5 phút
- ❌ **Thiếu:** `notification` event generic cho in-app

### 2.8 M7 - Reporting ✅ FOUNDATION
| Endpoint | Method | Auth | Status | File |
|----------|--------|------|--------|------|
| `/trips/stats` | GET | ✅ Admin | ✅ | routes/api/trip.js:22 |
| `/buses/stats` | GET | ✅ Admin | ✅ | routes/api/bus.js:21 |
| `/reports/trips/stats` | GET | ✅ Admin | ✅ | server.ts:197 |

**Implementation:**
- ✅ Trip stats: total, completed, cancelled, delayed, onTimePercentage
- ✅ Bus stats: total, active, maintenance, utilization
- ⚠️ SQL queries có thể tối ưu (index verification needed)
- ❌ **Thiếu:** Date range validation (from > to)
- ❌ **Thiếu:** Caching cho stats (nên cache 5 phút)

**Quality:** ⭐⭐⭐ Basic stats working

### 2.9 M8 - Admin & Configuration ⚠️ FOUNDATION
| Feature | Status | File |
|---------|--------|------|
| Dashboard health check | ✅ | server.ts:93 |
| Configuration via ENV | ✅ | config/env.js |
| Admin routes guard | ✅ | AuthMiddleware.authorize("quan_tri") |
| Settings API | ❌ | **THIẾU** |

---

## 3. API CONTRACT ANALYSIS

### 3.1 Response Format Compliance

**OpenAPI Spec:**
```json
{
  "success": true,
  "data": {...},
  "meta": {...}
}
```

**Actual Response (AuthController):**
```javascript
res.status(200).json({
  success: true,
  data: { token, user },  // ✅ OK
  // ❌ Thiếu "meta"
});
```

**Actual Response (BusController.list):**
```javascript
res.status(200).json({
  success: true,
  data: result,  // ✅ OK
  // ❌ Thiếu "meta" pagination
});
```

🔴 **CRITICAL:** Response format không nhất quán:
- Một số endpoint có `meta`
- Một số chỉ có `success, data`
- Một số có `success, code, message, errors` (error case)

**Recommendation:** Unified response middleware.

### 3.2 Error Codes Compliance

**OpenAPI Spec:**
- `AUTH_401`, `VALIDATION_422`, `NOT_FOUND_404`, `CONFLICT_409`, `INTERNAL_500`

**Actual Usage:**
```javascript
// AuthController.js - Login
return res.status(401).json({
  success: false,
  message: "Email hoặc mật khẩu không đúng"  // ❌ Thiếu code
});

// TripController.js - getStats
return res.status(400).json({
  success: false,
  code: "VALIDATION_400",  // ⚠️ Sai format (400 vs 422)
  message: "..."
});
```

🔴 **MISMATCH:** Error codes không chuẩn hóa.

---

## 4. MIDDLEWARE REVIEW

### 4.1 Authentication ✅
| Middleware | Status | File |
|------------|--------|------|
| `AuthMiddleware.authenticate` | ✅ | middlewares/AuthMiddleware.js:7 |
| `AuthMiddleware.verifyToken` | ✅ | Alias |
| `AuthMiddleware.authorize(roles)` | ✅ | middlewares/AuthMiddleware.js:84 |
| `AuthMiddleware.requireAdmin` | ✅ | middlewares/AuthMiddleware.js:111 |

**Features:**
- ✅ JWT verification
- ✅ User existence check
- ✅ Account status check (active/locked)
- ✅ Role-based authorization
- ⚠️ Token refresh not fully implemented

### 4.2 Validation ⚠️
| Middleware | Status | File |
|------------|--------|------|
| `ValidationMiddleware.validateId` | ✅ | middlewares/ValidationMiddleware.js |
| `ValidationMiddleware.validatePosition` | ✅ | - |
| `ValidationMiddleware.validatePagination` | ✅ | - |
| **Missing:** validateRegister, validateLogin | ❌ | **THIẾU** |

**Issue:** Validation logic scattered giữa middleware và controller.

### 4.3 CORS & Security ✅
| Middleware | Status | File |
|------------|--------|------|
| `corsMiddleware` | ✅ | middlewares/cors.ts |
| `helmet` | ✅ | server.ts:48 |
| `rateLimit` | ✅ | server.ts:70 |
| `compression` | ✅ | server.ts:86 |

✅ **Security best practices đã áp dụng.**

---

## 5. WEBSOCKET REVIEW

### 5.1 Socket.IO Setup ✅
```javascript
// server.ts:250
const io = initSocketIO(httpServer);
app.set("io", io);
```

✅ **Proper initialization.**

### 5.2 Events Inventory

**Client → Server:**
| Event | Purpose | Status | Rate Limit |
|-------|---------|--------|------------|
| `ping` | Heartbeat | ✅ | No |
| `join_trip` | Subscribe trip | ✅ | No |
| `leave_trip` | Unsubscribe | ✅ | No |
| `bus_position_update` | Driver GPS | ✅ | ✅ 2s |
| `driver_gps` | Driver GPS (advanced) | ✅ | ✅ 2s |

**Server → Client:**
| Event | Purpose | Status | Notes |
|-------|---------|--------|-------|
| `welcome` | Connection ack | ✅ | - |
| `pong` | Heartbeat ack | ✅ | - |
| `trip_joined` | Subscription ack | ✅ | - |
| `bus_position_update` | Broadcast GPS | ✅ | - |
| `approach_stop` | Geofence triggered | ✅ | 60m radius |
| `delay_alert` | Delay detected | ✅ | >5 min |
| `trip_started` | Trip started | ✅ | From REST |
| `trip_completed` | Trip ended | ✅ | From REST |
| `gps_ack` | GPS processed | ✅ | - |

**Missing Events:**
- ❌ `trip_cancelled`
- ❌ `student_picked_up`
- ❌ `student_dropped_off`
- ❌ `emergency_alert`

### 5.3 Rooms Strategy ✅
| Room Pattern | Purpose | Auto-join | Status |
|--------------|---------|-----------|--------|
| `user-{userId}` | User-specific | ✅ | OK |
| `trip-{tripId}` | Trip tracking | Manual | OK |
| `bus-{busId}` | Bus tracking | ❌ | Not used |

⚠️ **Issue:** `bus-{busId}` rooms không được dùng. Nên thêm auto-join cho driver/parent.

### 5.4 Throttle & Rate Limiting ✅
```javascript
// services/telemetryService.js:69
const RATE_LIMIT_MS = 2000;
```

✅ **Proper throttling implemented.**

---

## 6. GEO & TELEMETRY

### 6.1 Haversine Formula ✅
```javascript
// utils/geo.js:57
export function haversine(lat1, lon1, lat2, lon2)
```

✅ **Correct implementation.**

### 6.2 Geofence ✅
```javascript
// utils/geo.js:151
export function inGeofence(point, center, radius = 60)
```

✅ **60m radius implemented correctly.**

### 6.3 Telemetry Service ⚠️
| Feature | Status | Notes |
|---------|--------|-------|
| Position validation | ✅ | lat ∈ [-90,90], lng ∈ [-180,180] |
| Trip status check | ✅ | Must be "dang_chay" |
| Rate limiting | ✅ | 2s minimum |
| Cache storage | ⚠️ | In-memory Map (not persistent) |
| Geofence check | ✅ | Calls checkGeofence |
| Delay detection | ⚠️ | Simple ETA (needs improvement) |

🔴 **Issue:** In-memory cache mất dữ liệu khi restart. Nên dùng Redis.

---

## 7. ROUTE MOUNTING

### 7.1 Server Routes
```typescript
// server.ts
app.use(`${API_PREFIX}/auth`, authRoutes);         // ✅
app.use(`${API_PREFIX}/buses`, busRoutes);         // ✅
app.use(`${API_PREFIX}/drivers`, driverRoutes);    // ✅
app.use(`${API_PREFIX}/students`, studentRoutes);  // ✅
app.use(`${API_PREFIX}/trips`, tripRoutes);        // ✅
app.use(`${API_PREFIX}/schedules`, scheduleRoutes); // ✅
app.use(`${API_PREFIX}/routes`, routeRoutes);       // ✅
app.use(`${API_PREFIX}/reports/buses`, busRoutes);  // ⚠️ Conflict
app.use(`${API_PREFIX}/reports/trips`, tripRoutes); // ⚠️ Conflict
app.use(`${API_PREFIX}/reports/schedules`, scheduleRoutes); // ⚠️
```

⚠️ **Issue:** Route conflicts - `/reports/*` mount same controllers as `/buses`, `/trips`.

**Recommendation:** Separate stats endpoints hoặc remove duplicate mounts.

### 7.2 Prefix Consistency
```javascript
// constants/routes.ts
export const API_PREFIX = "/api/v1";
```

✅ **Consistent /api/v1 prefix.**

---

## 8. DEFECT LIST

| ID | Mức độ | Mô tả | File | Fix |
|----|--------|-------|------|-----|
| **BE-DEF-001** | 🔴 High | Response format không nhất quán (thiếu `meta`) | Controllers | Add unified middleware |
| **BE-DEF-002** | 🟡 Medium | Drivers/Students thiếu POST/PUT/DELETE | routes/api/*.js | Implement CRUD |
| **BE-DEF-003** | 🟡 Medium | Start trip không validate driver ownership | controllers/TripController.js:512 | Add validation |
| **BE-DEF-004** | 🟢 Low | Thiếu cancel trip endpoint | routes/api/trip.js | Add POST /trips/:id/cancel |
| **BE-DEF-005** | 🔴 High | In-memory telemetry cache mất data khi restart | services/telemetryService.js:49 | Migrate to Redis |
| **BE-DEF-006** | 🟡 Medium | Error codes không chuẩn (VALIDATION_400 vs 422) | Controllers | Unified error codes |
| **BE-DEF-007** | 🟢 Low | Route mounting conflicts (/reports vs /buses) | server.ts:196-198 | Remove duplicates |
| **BE-DEF-008** | 🟡 Medium | Geofence không persistent (mất khi restart) | services/telemetryService.js | State in DB/Redis |
| **BE-DEF-009** | 🟢 Low | Delay detection logic đơn giản quá | services/telemetryService.js:182 | Improve ETA calculation |
| **BE-DEF-010** | 🟡 Medium | Missing student status update endpoint | routes/api/trip.js | Add POST /trips/:id/students/:sid/status |

---

## 9. PERFORMANCE & SCALABILITY

### 9.1 Database Queries
- ⚠️ TripController.getAll: Load ALL trips rồi slice (line 34-38)
  - **Issue:** Không dùng SQL LIMIT/OFFSET
  - **Impact:** Memory usage cao với 10K+ trips
- ⚠️ TripController.getById: 6 queries cho 1 request (lines 83-91)
  - **Recommendation:** JOIN hoặc data loader

### 9.2 Caching
- ❌ No caching layer
- ❌ Stats queries chạy realtime
- **Recommendation:** Add Redis cho:
  - Bus positions (TTL 60s)
  - Stats (TTL 5 min)
  - User sessions

### 9.3 WebSocket
- ✅ Proper throttling
- ⚠️ In-memory state không scale
- **Recommendation:** Redis Pub/Sub cho multi-server

---

## 10. RECOMMENDATIONS

### 10.1 Ưu tiên cao (48h)
1. **Fix response format** (BE-DEF-001)
   ```javascript
   // middlewares/response.ts
   export function successResponse(res, data, meta = {}) {
     return res.json({ success: true, data, meta });
   }
   ```

2. **Add student status endpoint** (BE-DEF-010)
   - Route: `POST /trips/:id/students/:sid/status`
   - Body: `{ status: "da_don" | "da_tra" | "vang" }`

3. **Fix in-memory cache** (BE-DEF-005)
   - Migrate to Redis
   - Persist last position

### 10.2 Nợ kỹ thuật
- [ ] Add request logging (Winston + correlation ID)
- [ ] Add API versioning `/api/v2`
- [ ] Add request/response compression
- [ ] Add Circuit breaker cho DB
- [ ] Add OpenTelemetry tracing

---

## 11. COVERAGE MATRIX MM4

| Module | MM4 Requirement | Implemented | % | Notes |
|--------|------------------|-------------|---|-------|
| **M0** | Auth (login/refresh/profile) | ✅ | 100% | Ready |
| **M1** | CRUD Buses/Drivers/Students | ⚠️ | 60% | Thiếu Update/Delete Drivers/Students |
| **M2** | Routes/Stops CRUD | ⚠️ | 70% | Thiếu reorder stops |
| **M3** | Schedules + Conflict 409 | ✅ | 100% | Excellent |
| **M4** | Socket.IO + Rooms + Throttle | ⚠️ | 80% | Thiếu scale features |
| **M5** | Trip Lifecycle | ⚠️ | 70% | Thiếu cancel + student status |
| **M6** | Notifications | ⚠️ | 50% | Events OK, không có push/email |
| **M7** | Stats | ⚠️ | 70% | Basic OK, thiếu cache |
| **M8** | Admin config | ⚠️ | 40% | Foundation only |

**Overall: 66% MM4 Complete**

---

## 12. CONCLUSION

### Backend Status: 🟡 PARTIALLY READY

**Strengths:**
- ✅ Auth & security solid
- ✅ Socket.IO working
- ✅ Geo calculations correct
- ✅ Schedules conflict detection excellent

**Weaknesses:**
- ❌ Response format inconsistency
- ❌ In-memory state mất data
- ❌ Missing endpoints (student status, cancel trip)
- ❌ No caching/scaling strategy

**Next Steps:**
1. Fix critical defects (BE-DEF-001, 005, 010)
2. Add Redis layer
3. Implement missing endpoints
4. Add monitoring/logging

---

**Báo cáo tiếp theo:** [audit_03_frontend.md](./audit_03_frontend.md)

