# ESM Internal Imports Analysis

## Summary
Analysis of internal imports in `ssb-backend/src/` to verify ESM compliance.

## Internal Import Analysis

| Importer | Importee | .js Extension | Status | Notes |
|----------|----------|---------------|--------|-------|
| server.ts | ./config/env.js | ✅ | OK | Has .js extension |
| server.ts | ./middlewares/cors.js | ✅ | OK | Has .js extension |
| server.ts | ./middlewares/error.js | ✅ | OK | Has .js extension |
| server.ts | ./constants/http.js | ✅ | OK | Has .js extension |
| server.ts | ./constants/realtime.js | ✅ | OK | Has .js extension |
| validate.ts | ./error.js | ✅ | OK | Has .js extension |
| test_db.js | ./config/db.js | ✅ | OK | Has .js extension |
| bus.route.js | ../controllers/buscontroller.js | ✅ | OK | Has .js extension |
| app.js | ./routes/api/bus.js | ✅ | OK | Has .js extension |
| app.js | ./routes/api/driver.js | ✅ | OK | Has .js extension |
| app.js | ./routes/api/schedule.js | ✅ | OK | Has .js extension |
| schedule.js | ../../services/inMemoryStore.js | ✅ | OK | Has .js extension |
| bus.js | ../../services/inMemoryStore.js | ✅ | OK | Has .js extension |
| cors.ts | ../config/env.js | ✅ | OK | Has .js extension |
| driver.js | ../../services/inMemoryStore.js | ✅ | OK | Has .js extension |
| DiemDungModel.js | ../config/db.config.js | ✅ | OK | Has .js extension |
| NguoiDungModel.js | ../config/db.config.js | ✅ | OK | Has .js extension |
| TaiXeModel.js | ../config/db.config.js | ✅ | OK | Has .js extension |
| HocSinhModel.js | ../config/db.config.js | ✅ | OK | Has .js extension |
| PhuHuynhModel.js | ../config/db.config.js | ✅ | OK | Has .js extension |
| LichTrinhModel.js | ../config/db.config.js | ✅ | OK | Has .js extension |
| TuyenDuongModel.js | ../config/db.config.js | ✅ | OK | Has .js extension |
| TrangThaiHocSinhModel.js | ../config/db.config.js | ✅ | OK | Has .js extension |
| XeBuytModel.js | ../config/db.config.js | ✅ | OK | Has .js extension |
| AuthController.js | ../models/NguoiDungModel.js | ✅ | OK | Has .js extension |
| AuthController.js | ../models/TaiXeModel.js | ✅ | OK | Has .js extension |
| DriverController.js | ../models/TaiXeModel.js | ✅ | OK | Has .js extension |
| DriverController.js | ../models/NguoiDungModel.js | ✅ | OK | Has .js extension |
| DriverController.js | ../models/LichTrinhModel.js | ✅ | OK | Has .js extension |
| DriverController.js | ../models/ChuyenDiModel.js | ✅ | OK | Has .js extension |
| BusController.js | ../models/XeBuytModel.js | ✅ | OK | Has .js extension |
| BusController.js | ../models/LichTrinhModel.js | ✅ | OK | Has .js extension |
| BusController.js | ../models/TaiXeModel.js | ✅ | OK | Has .js extension |
| BusController.js | ../models/ChuyenDiModel.js | ✅ | OK | Has .js extension |
| RouteController.js | ../models/TuyenDuongModel.js | ✅ | OK | Has .js extension |
| RouteController.js | ../models/DiemDungModel.js | ✅ | OK | Has .js extension |
| RouteController.js | ../models/LichTrinhModel.js | ✅ | OK | Has .js extension |
| TripController.js | ../models/ChuyenDiModel.js | ✅ | OK | Has .js extension |
| TripController.js | ../models/LichTrinhModel.js | ✅ | OK | Has .js extension |
| TripController.js | ../models/TrangThaiHocSinhModel.js | ✅ | OK | Has .js extension |
| TripController.js | ../models/XeBuytModel.js | ✅ | OK | Has .js extension |
| TripController.js | ../models/TaiXeModel.js | ✅ | OK | Has .js extension |
| TripController.js | ../models/TuyenDuongModel.js | ✅ | OK | Has .js extension |
| TripController.js | ../models/HocSinhModel.js | ✅ | OK | Has .js extension |
| ScheduleController.js | ../models/LichTrinhModel.js | ✅ | OK | Has .js extension |
| ScheduleController.js | ../models/XeBuytModel.js | ✅ | OK | Has .js extension |
| ScheduleController.js | ../models/TaiXeModel.js | ✅ | OK | Has .js extension |
| ScheduleController.js | ../models/TuyenDuongModel.js | ✅ | OK | Has .js extension |
| ScheduleController.js | ../models/ChuyenDiModel.js | ✅ | OK | Has .js extension |
| StudentController.js | ../models/HocSinhModel.js | ✅ | OK | Has .js extension |
| StudentController.js | ../models/NguoiDungModel.js | ✅ | OK | Has .js extension |
| AuthMiddleware.js | ../models/NguoiDungModel.js | ✅ | OK | Has .js extension |
| ChuyenDiModel.js | ../config/db.config.js | ✅ | OK | Has .js extension |

## Directory Imports
No directory imports found (imports ending with `/`) - PASS

## JSON Imports
No direct JSON imports found in src/ - PASS

## CJS-only Shims
Found `createRequire` usage in:
- `test_firebase.js` - Used for Firebase service account JSON file
  - Status: ACCEPTED (CJS-only shim for Firebase config)
  - Reason: Firebase service account requires JSON file import

## Summary
- **Total internal imports**: 53
- **Imports with .js extension**: 53 (100%)
- **Directory imports**: 0
- **JSON imports**: 0
- **CJS-only shims**: 1 (Firebase config - ACCEPTED)

## Conclusion
✅ **PASS** - All internal imports properly use .js extensions as required by ESM NodeNext module resolution.
