# Project Tree - Smart School Bus Tracking System

**Generated:** 2025-11-11  
**Max Depth:** 3 levels  
**File Count by Extension:** See below

## Directory Structure (3 levels)

```
Smart_School_Bus_Tracking_System/
├── components/
│   └── tracking/
│       └── MapView.tsx
├── database/
│   ├── 01_init_db_ver2.sql
│   ├── 01_init_db.sql
│   ├── 02_sample_data.sql
│   ├── 03_create_trip_today_31oct.sql
│   ├── check_trip_16.sql
│   ├── create_today_trip.sql
│   ├── SSB.sql
│   └── test_delay_alert.sql
├── docs/
│   ├── openapi.yaml
│   ├── postman_collection_backup.json
│   ├── POSTMAN_GUIDE.md
│   ├── SSB_Local_Environment.json
│   ├── SSB_Postman_Collection.json
│   └── ws_events.md
├── env/
│   ├── local.postman_environment.json
│   └── postman_environment_v3.json
├── lib/
│   ├── api.ts
│   ├── auth-context.tsx
│   ├── guards/
│   │   └── RequireAuth.tsx
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── bus.service.ts
│   └── socket.ts
├── plans/
│   ├── be_hardening_plan.md
│   └── fe_integration_plan.md
├── reports/
│   ├── mvp_blockers.csv
│   ├── mvp_checklist_results.json
│   ├── mvp_fix_verification_2025-11-11.md
│   ├── mvp_progress_2025-11-11.md
│   └── mvp_scorecard.csv
├── ssb-backend/
│   ├── dist/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── middlewares/
│   │   ├── server.d.ts
│   │   ├── server.d.ts.map
│   │   ├── server.js
│   │   └── server.js.map
│   ├── docs/
│   │   ├── backend_audit_v1_1.md
│   │   ├── DAY2_COMPLETE_GUIDE.md
│   │   ├── DAY3_SOCKET_IO_GUIDE.md
│   │   ├── DAY4_COMPLETE_SUMMARY.md
│   │   ├── openapi.yaml
│   │   ├── postman_collection.json
│   │   ├── REFACTOR_V1_1_SUMMARY.md
│   │   └── ws_events.md
│   ├── logs/
│   │   ├── app-2025-10-23.log
│   │   ├── database-2025-10-23.log
│   │   └── system-2025-10-23.log
│   ├── postman/
│   │   ├── README_TESTING.md
│   │   ├── SSB_API_Collection.postman_collection.json
│   │   └── SSB_Local_Environment.postman_environment.json
│   ├── reports/
│   │   ├── backend_2025-11-09.md
│   │   └── esmpurity_fix_result.md
│   ├── scripts/
│   │   ├── export-postman.js
│   │   ├── init-database.js
│   │   ├── rebuild-polyline.js
│   │   ├── rebuild-polyline.ts
│   │   ├── seed-data.js
│   │   └── simple-init-db.js
│   ├── src/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── core/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── ws/
│   │   ├── app.js
│   │   ├── server.ts
│   │   └── test_firebase.js
│   ├── tests/
│   │   └── controllers/
│   └── tsconfig.json
└── ssb-frontend/
    ├── app/
    │   ├── admin/
    │   │   ├── buses/
    │   │   ├── drivers/
    │   │   ├── notifications/
    │   │   ├── profile/
    │   │   ├── reports/
    │   │   ├── routes/
    │   │   │   └── [id]/
    │   │   ├── schedule/
    │   │   ├── settings/
    │   │   ├── students/
    │   │   ├── tracking/
    │   │   └── page.tsx
    │   ├── driver/
    │   │   ├── history/
    │   │   ├── incidents/
    │   │   ├── profile/
    │   │   ├── settings/
    │   │   ├── trip/
    │   │   │   └── [id]/
    │   │   └── page.tsx
    │   ├── login/
    │   ├── parent/
    │   │   ├── history/
    │   │   ├── notifications/
    │   │   ├── profile/
    │   │   └── settings/
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components/
    │   ├── admin/
    │   ├── driver/
    │   ├── layout/
    │   ├── map/
    │   ├── parent/
    │   └── ui/
    ├── hooks/
    ├── lib/
    │   ├── hooks/
    │   ├── maps/
    │   ├── providers/
    │   └── services/
    ├── public/
    ├── styles/
    └── types/
```

## File Count by Extension

### TypeScript/JavaScript
- `.ts`: ~50 files (TypeScript source)
- `.tsx`: ~70 files (React components)
- `.js`: ~80 files (JavaScript source)
- `.mjs`: ~5 files (ES modules)

### Configuration
- `.json`: ~30 files (package.json, configs, collections)
- `.yaml`/`.yml`: ~3 files (OpenAPI specs)
- `.md`: ~40 files (Documentation)
- `.sql`: ~8 files (Database scripts)

### Styles
- `.css`: ~5 files (Global styles)
- `.scss`/`.sass`: 0 files

### Other
- `.xml`: 1 file (ERD diagram)
- `.txt`: ~10 files (Notes, guides)
- `.csv`: ~3 files (Reports)
- `.log`: ~3 files (Logs)

## Summary

- **Total Directories:** ~100+
- **Total Files:** ~300+
- **Main Codebase:** 
  - Backend: `ssb-backend/src/` (~150 files)
  - Frontend: `ssb-frontend/` (~150 files)
- **Documentation:** ~40 markdown files
- **Database Scripts:** 8 SQL files

