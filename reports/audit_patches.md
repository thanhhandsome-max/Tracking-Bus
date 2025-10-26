# 🔧 SSB Day 1 Audit Patches

## 📋 Minor Fixes Required

### Patch 1: Update API Guide Port
**File**: `ssb-backend/API_GUIDE.md`  
**Issue**: Wrong port (3001 instead of 4000)  
**Priority**: High  

```diff
- PORT=3001
+ PORT=4000

- Server sẽ chạy tại: `http://localhost:3001`
+ Server sẽ chạy tại: `http://localhost:4000`

- const socket = io("http://localhost:3001");
+ const socket = io("http://localhost:4000");

- curl -X GET "http://localhost:3001/api/buses"
+ curl -X GET "http://localhost:4000/api/buses"

- curl -X POST "http://localhost:3001/api/buses" \
+ curl -X POST "http://localhost:4000/api/buses" \

- curl -X POST "http://localhost:3001/api/buses/bus_001/position" \
+ curl -X POST "http://localhost:4000/api/buses/bus_001/position" \

- curl -X POST "http://localhost:3001/api/buses/bus_001/assign-driver" \
+ curl -X POST "http://localhost:4000/api/buses/bus_001/assign-driver" \
```

### Patch 2: Update Test File Port
**File**: `ssb-backend/test.html`  
**Issue**: Wrong port (3001 instead of 4000)  
**Priority**: High  

```diff
- console.log("Đang thử kết nối đến http://localhost:3001...");
+ console.log("Đang thử kết nối đến http://localhost:4000...");

- const socket = io("http://localhost:3001");
+ const socket = io("http://localhost:4000");
```

### Patch 3: Add Database Health Check
**File**: `ssb-backend/src/server.ts`  
**Issue**: Database health check returns hardcoded 'up'  
**Priority**: Medium  

```diff
// Database health check
async function checkDatabaseHealth(): Promise<string> {
  try {
-   // TODO: Implement actual database health check
-   // const connection = await pool.getConnection();
-   // await connection.ping();
-   // connection.release();
-   return 'up';
+   const connection = await pool.getConnection();
+   await connection.ping();
+   connection.release();
+   return 'up';
  } catch (error) {
+   console.error('Database health check failed:', error);
    return 'down';
  }
}
```

### Patch 4: Add Redis Health Check
**File**: `ssb-backend/src/server.ts`  
**Issue**: Redis health check returns hardcoded 'up'  
**Priority**: Medium  

```diff
// Redis health check
async function checkRedisHealth(): Promise<string> {
  try {
-   // TODO: Implement actual Redis health check
-   // await redisClient.ping();
-   return 'up';
+   if (config.redis) {
+     await redisClient.ping();
+     return 'up';
+   }
+   return 'not_configured';
  } catch (error) {
+   console.error('Redis health check failed:', error);
    return 'down';
  }
}
```

### Patch 5: Add Socket.IO JWT Authentication
**File**: `ssb-backend/src/server.ts`  
**Issue**: Socket.IO auth middleware has TODO comment  
**Priority**: High  

```diff
// Socket.IO authentication middleware
io.use((socket, next) => {
- // TODO: Implement JWT authentication for Socket.IO
- // For now, allow all connections
- next();
+ try {
+   const token = socket.handshake.auth.token;
+   if (!token) {
+     return next(new Error('Authentication error'));
+   }
+   
+   const decoded = jwt.verify(token, config.jwt.secret);
+   socket.userId = decoded.userId;
+   socket.userRole = decoded.vaiTro;
+   socket.userEmail = decoded.email;
+   next();
+ } catch (error) {
+   next(new Error('Authentication error'));
+ }
});
```

## 🎯 Implementation Priority

### Immediate (Day 1.5)
1. **Patch 1**: Update API Guide port
2. **Patch 2**: Update test file port

### Day 2
3. **Patch 5**: Implement Socket.IO JWT authentication
4. **Patch 3**: Add database health check
5. **Patch 4**: Add Redis health check

## 📊 Patch Summary

- **Total Patches**: 5
- **High Priority**: 3
- **Medium Priority**: 2
- **Lines Changed**: ~20 lines total
- **Files Affected**: 3 files

**Recommendation**: Apply patches 1-2 immediately, patches 3-5 in Day 2.

---

*Audit patches completed on: 2025-10-25*  
*Status: READY FOR IMPLEMENTATION*
