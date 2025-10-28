# Phase A Status Audit Report - Day 1 (Tạ Quang Thắng)
## Auth (M0) + Reporting/Stats (M7)

**Date**: 2025-01-25  
**Scope**: Read-only assessment of current implementation vs. OpenAPI spec  
**Status**: ✅ Audit Complete

---

## A1. CODE SCAN & SPEC ALIGNMENT

### ✅ **AUTH MODULE (M0)**

#### Routes (`src/routes/api/auth.route.js`)
- ✅ POST `/api/v1/auth/login` - **EXISTS**
- ✅ GET `/api/v1/auth/profile` - **EXISTS** (with authenticate middleware)
- ✅ POST `/api/v1/auth/refresh` - **EXISTS** (route present, middleware commented)

#### Controller (`src/controllers/AuthController.js`)
- ✅ `login()`: Returns `{ token, refreshToken, user }`
- ✅ `getProfile()`: Protected by middleware
- ✅ `refreshToken()`: Handles refresh token validation

#### Token Management
- ✅ Access token: 15 minutes (`expiresIn: "15m"`)
- ✅ Refresh token: 7 days (`expiresIn: "7d"`)
- ✅ Separate secrets: `JWT_SECRET` vs `JWT_REFRESH_SECRET`
- ⚠️ Login returns both `token` (old 7d) and `accessToken` (15m) - **AMBIGUOUS**

#### Middleware (`src/middlewares/AuthMiddleware.js`)
- ✅ `authenticate`: JWT validation, user lookup, status check
- ✅ `authorize`: Role-based access control
- ✅ `requireAdmin`: Admin-only protection

#### Response Format
- ✅ Uses envelope: `{ success, data, message }`
- ⚠️ Error codes: Mixed between hard-coded messages and constants
- ⚠️ Missing standardized error codes from constants (AUTH_401, VALIDATION_422)

---

### ✅ **REPORTING/STATS MODULE (M7)**

#### Routes
- ✅ GET `/api/v1/reports/buses/stats` - **MOUNTED** at `src/server.ts:145`
- ✅ GET `/api/v1/reports/trips/stats` - **MOUNTED** at `src/server.ts:146`
- Both protected by: `authenticate` + `requireAdmin`

#### Controllers
- ✅ `BusController.getStats()`: Returns `{ totalBuses, activeBuses, maintenanceBuses, ... }`
- ✅ `TripController.getStats(from, to)`: Returns `{ totalTrips, completedTrips, onTimePercentage, ... }`

#### Spec Alignment
- ✅ Field names match OpenAPI schema (`docs/openapi.yaml`)
- ✅ Meta fields included where applicable
- ⚠️ Some fields hardcoded to 0 (e.g., `averageUtilization` in bus stats)

---

### ✅ **SOCKET.IO AUTHENTICATION**

#### Implementation
- ✅ `verifyWsJWT` middleware (`src/middlewares/socketAuth.js`)
- ✅ Reads `handshake.auth.token`
- ✅ Validates JWT, sets `socket.data.user = { id, role }`
- ✅ Rejects on missing/invalid token

#### Server Integration (`src/server.ts`)
- ✅ `io.use(verifyWsJWT)` at line 277 - **ENABLED**
- ⚠️ CORS configured as `origin: "*"` (should use FE_ORIGIN)
- ⚠️ Room ACL skeleton present but not fully implemented

---

### ✅ **CONFIGURATION**

#### Environment
- ✅ `JWT_SECRET` - configured
- ✅ `JWT_REFRESH_SECRET` - configured
- ✅ `FE_ORIGIN` - configured
- ✅ `API_PREFIX="/api/v1"` - consistent

#### Middleware Order (`src/server.ts`)
1. ✅ Morgan (logging)
2. ✅ Helmet (security)
3. ✅ CORS
4. ✅ Rate limiting
5. ✅ Compression
6. ✅ express.json()
7. ✅ Route mounting
8. ✅ Error handler (last)

---

### ⚠️ **ISSUES IDENTIFIED**

#### 1. Health Check - Mock vs Real
- ⚠️ `GET /api/v1/health` returns hardcoded `{ database: "up", redis: "up" }`
- ❌ No actual DB ping in `checkDatabaseHealth()`
- ❌ No Redis check in `checkRedisHealth()`

#### 2. Placeholder Routes
- ✅ Placeholder routes for `/buses`, `/trips`, `/reports` are **COMMENTED OUT** (lines 124-171)
- ✅ Real routes mounted at lines 143-146

#### 3. CORS Socket.IO
- ⚠️ Line 239: `origin: "*"` should be `origin: config.frontend.origin`

#### 4. Error Envelope Inconsistency
- ⚠️ Mix of `{ success, message }` vs `{ success, code, message }`
- ⚠️ No consistent use of error constants from `src/constants/errors.ts`

#### 5. Refresh Token Route
- ⚠️ POST `/auth/refresh` middleware commented (line 16)
- ✅ Controller properly validates refresh token

---

## A2. READY FOR DAY 2?

### Condition Assessment

**✅ PASS Criteria:**
1. ✅ Auth endpoints implemented (login, profile, refresh)
2. ✅ Reports endpoints mounted and accessible
3. ✅ JWT handshake enabled for Socket.IO
4. ✅ Admin-only protection on reports
5. ✅ Token expiry configured (15m/7d)

**⚠️ NEEDS FIX (Day 1):**
1. ❌ Health check DB ping
2. ❌ CORS Socket.IO origin
3. ⚠️ Remove duplicate token in login response
4. ⚠️ Standardize error codes
5. ⚠️ Room ACL implementation (baseline)

### **RECOMMENDATION**: 
🟡 **PROCEED WITH CAUTION**  
- Core functionality works
- Need to apply fixes in Phase B
- Can integrate FE but monitor health check

---

## A3. ROOT CAUSE ANALYSIS

### Why Issues Exist
1. **Health Check Mock**: Template copied, not updated with real DB connection
2. **CORS Socket.IO**: Development convenience (`*`) not replaced with production value
3. **Error Codes**: Lack of strict typing on error responses
4. **Token Duplicate**: Login returns both old and new token format

### Impact on Day 2 Integration
- **Low**: FE can proceed with auth flow
- **Medium**: Health monitoring will show false positives
- **High**: Security concern with CORS `*` in production

---

**END OF PHASE A**
