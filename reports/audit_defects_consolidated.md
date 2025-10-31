# DEFECTS CONSOLIDATED LIST
**Smart School Bus Tracking System (SSB 1.0)**  
**Ngày tạo:** 2025-10-23

---

## 🔴 CRITICAL (Fix trong 48h)

### Database
| ID | Mô tả | File | Line | Fix |
|----|-------|------|------|-----|
| **DB-DEF-001** | `XeBuyt.trangThai` ENUM mismatch (Tiếng Việt vs English spec) | init_db.sql | 65 | Change ENUM to: `active`, `inactive`, `maintenance` |
| **DB-DEF-002** | `TaiXe.maTaiXe` FK dùng CASCADE nguy hiểm | init_db.sql | 54 | Change to `ON DELETE RESTRICT` |

### Backend
| ID | Mô tả | File | Line | Fix |
|----|-------|------|------|-----|
| **BE-DEF-001** | Response format không nhất quán (thiếu `meta`) | Controllers | - | Add unified middleware |
| **BE-DEF-005** | In-memory cache mất data khi restart | services/telemetryService.js | 49 | Migrate to Redis |

### Frontend
| ID | Mô tả | File | Line | Fix |
|----|-------|------|------|-----|
| **FE-DEF-001** | Thiếu role-based route guard | app/admin/layout.tsx | - | Add role check |
| **FE-DEF-002** | Missing socket listeners (approach_stop, delay_alert) | lib/socket.ts | - | Add event listeners |

### E2E
| ID | Mô tả | File | Line | Fix |
|----|-------|------|------|-----|
| **E2E-001** | Driver GPS sending logic unclear | app/driver/trip/[id]/page.tsx | - | Verify/test |
| **E2E-002** | Hardcode data trong pages | Multiple | - | Replace với API |

---

## 🟡 MEDIUM PRIORITY

### Database
| ID | Mô tả | File | Line | Fix |
|----|-------|------|------|-----|
| **DB-DEF-003** | Học sinh mồ côi (không có maPhuHuynh) | sample_data.sql | 317-318 | Add maPhuHuynh |
| **DB-DEF-004** | Thông báo FK CASCADE | init_db.sql | 188 | Change to SET NULL |

### Backend
| ID | Mô tả | File | Line | Fix |
|----|-------|------|------|-----|
| **BE-DEF-002** | Drivers/Students thiếu POST/PUT/DELETE | routes/api/*.js | - | Implement CRUD |
| **BE-DEF-003** | Start trip không validate driver ownership | controllers/TripController.js | 512 | Add validation |
| **BE-DEF-006** | Error codes không chuẩn | Controllers | - | Unified codes |
| **BE-DEF-007** | Route mounting conflicts | server.ts | 196-198 | Remove duplicates |
| **BE-DEF-010** | Missing student status endpoint | routes/api/trip.js | - | Add POST /trips/:id/students/:sid/status |

### Frontend
| ID | Mô tả | File | Line | Fix |
|----|-------|------|------|-----|
| **FE-DEF-003** | Mixed API calls pattern | app/admin/*/page.tsx | - | Unified service layer |
| **FE-DEF-007** | Parent dashboard hardcode child info | app/parent/page.tsx | 141 | Fetch from API |

---

## 🟢 LOW PRIORITY

### Database
| ID | Mô tả | File | Line | Fix |
|----|-------|------|------|-----|
| **DB-DEF-005** | Mật khẩu mặc định không an toàn | sample_data.sql | 11-18 | Change to random hash |
| **DB-DEF-006** | Thiếu comment cho INT fields | init_db.sql | 94, 195 | Add comments |

### Backend
| ID | Mô tả | File | Line | Fix |
|----|-------|------|------|-----|
| **BE-DEF-004** | Thiếu cancel trip endpoint | routes/api/trip.js | - | Add POST /trips/:id/cancel |
| **BE-DEF-008** | Geofence không persistent | services/telemetryService.js | - | State in DB/Redis |
| **BE-DEF-009** | Delay detection logic đơn giản | services/telemetryService.js | 182 | Improve ETA |

### Frontend
| ID | Mô tả | File | Line | Fix |
|----|-------|------|------|-----|
| **FE-DEF-004** | Thiếu error boundary | app/admin/layout.tsx | - | Add ErrorBoundary |
| **FE-DEF-005** | GPS sending chưa verify | app/driver/trip/[id]/page.tsx | - | Test flow |
| **FE-DEF-006** | Thiếu skeleton loading | components/tracking/MapView.tsx | - | Add loading |
| **FE-DEF-008** | No offline handling | lib/socket.ts | - | Add offline queue |
| **FE-DEF-009** | Response parsing không unified | lib/api.ts | - | Unified parsing |

---

## 📊 SUMMARY

| Priority | Count | Avg Fix Time |
|----------|-------|--------------|
| 🔴 Critical | 8 | 2-4h each |
| 🟡 Medium | 8 | 1-2h each |
| 🟢 Low | 9 | 30min each |
| **Total** | **25** | **~80h** |

**Estimated Fix Time: 80 hours (10 working days)**

---

## 🎯 FIX PRIORITIES

### Day 1-2: Critical Database + Backend
1. DB-DEF-001: Fix enum mismatch
2. DB-DEF-002: Fix FK CASCADE
3. BE-DEF-001: Unified response
4. BE-DEF-005: Add Redis

### Day 3-4: Critical Frontend
5. FE-DEF-001: Add role guards
6. FE-DEF-002: Add socket listeners
7. E2E-002: Remove hardcode

### Day 5-6: Medium Backend
8. BE-DEF-002: Add CRUD endpoints
9. BE-DEF-003: Add validation
10. BE-DEF-010: Student status endpoint

### Day 7-8: Medium Frontend
11. FE-DEF-003: Unified services
12. FE-DEF-007: Real child data
13. E2E-001: Verify GPS

### Day 9-10: Polish
14. Low priority fixes
15. Testing
16. Documentation

---

**End of Defects List** ✅

