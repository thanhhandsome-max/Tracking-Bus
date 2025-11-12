# Project Tree Structure

## Root Directory
```
Smart_School_Bus_Tracking_System/
├── ssb-backend/          # Backend API (Node.js/Express)
├── ssb-frontend/          # Frontend (Next.js 15)
├── database/              # SQL scripts
├── docs/                  # Documentation
├── components/            # Shared components (legacy)
├── lib/                   # Shared libraries (legacy)
└── reports/               # Reports & analysis
```

## Directory Structure (Max 3 Levels)

### ssb-backend/
```
ssb-backend/
├── src/
│   ├── app.js            # Express app setup
│   ├── server.ts          # Server entry point
│   ├── config/           # Configuration (env, db, cache, firebase)
│   ├── constants/        # Constants (realtime events, etc.)
│   ├── controllers/      # Route controllers (18 files)
│   ├── core/             # Core utilities
│   ├── middlewares/       # Express middlewares (10 files)
│   ├── models/           # Database models (15 files)
│   ├── routes/            # API routes (18 files)
│   ├── services/          # Business logic (18 files)
│   ├── utils/             # Utilities (7 files)
│   └── ws/                # WebSocket handlers (1 file)
├── dist/                  # Compiled TypeScript
├── docs/                  # Backend documentation
├── scripts/               # Utility scripts (14 files)
├── tests/                 # Test files
└── package.json
```

### ssb-frontend/
```
ssb-frontend/
├── app/                   # Next.js App Router (52 files: 51 .tsx, 1 .css)
│   ├── admin/             # Admin pages
│   │   ├── routes/        # Route management
│   │   │   ├── [id]/      # Route detail/edit
│   │   │   └── page.tsx   # Routes list
│   │   ├── buses/         # Bus management
│   │   ├── drivers/       # Driver management
│   │   ├── students/      # Student management
│   │   ├── tracking/      # Real-time tracking
│   │   ├── schedule/      # Schedule management
│   │   ├── reports/       # Reports & analytics
│   │   └── settings/      # System settings
│   ├── driver/            # Driver pages
│   │   ├── trip/[id]/     # Trip detail/control
│   │   └── history/       # Trip history
│   ├── parent/            # Parent pages
│   │   ├── history/       # Trip history
│   │   └── notifications/ # Notifications
│   ├── login/             # Login page
│   └── layout.tsx         # Root layout
├── components/            # React components (50 .tsx files)
│   ├── admin/             # Admin components
│   ├── driver/             # Driver components
│   ├── map/                # Map components
│   └── ui/                 # UI primitives (shadcn/ui)
├── lib/                   # Libraries (21 files: 16 .ts, 5 .tsx)
│   ├── api-client.ts      # Axios client
│   ├── auth-context.tsx   # Auth context
│   ├── socket.ts           # Socket.IO client
│   ├── hooks/              # Custom hooks (4 .ts)
│   ├── services/           # Service layers
│   └── maps/               # Google Maps utilities
├── hooks/                 # Additional hooks (4 .ts)
└── package.json
```

### database/
```
database/
├── 01_init_db_ver2.sql    # Database schema
├── 02_sample_data.sql     # Sample data
├── 03_create_trip_today_31oct.sql
├── 04_add_m1m3_indexes.sql
└── SSB.sql                 # Main schema
```

### docs/
```
docs/
├── openapi.yaml            # API specification
├── GOOGLE_MAPS_API_SETUP.md
├── POSTMAN_GUIDE.md
├── reports/                # Progress reports
└── ws_events.md            # WebSocket events doc
```

## File Count by Extension

### Backend (ssb-backend/)
- **.js**: 89 files
- **.ts**: 9 files
- **.json**: 5 files
- **.md**: 8 files
- **.txt**: 4 files
- **.yaml**: 1 file

### Frontend (ssb-frontend/)
- **.tsx**: 101 files (51 in app/, 50 in components/)
- **.ts**: 20 files (16 in lib/, 4 in hooks/)
- **.css**: 2 files
- **.json**: 3 files
- **.md**: 4 files

### Root
- **.md**: 10+ files
- **.sql**: 8 files
- **.json**: 3 files
- **.txt**: 2 files
- **.xml**: 1 file (ERD)

## Key Files

### Backend Entry Points
- `ssb-backend/src/server.ts` - Main server
- `ssb-backend/src/app.js` - Express app

### Frontend Entry Points
- `ssb-frontend/app/layout.tsx` - Root layout
- `ssb-frontend/app/page.tsx` - Home (redirects to /login)

### Configuration
- `ssb-backend/src/config/env.ts` - Environment config
- `ssb-frontend/next.config.mjs` - Next.js config
- `ssb-backend/tsconfig.json` - TypeScript config (BE)
- `ssb-frontend/tsconfig.json` - TypeScript config (FE)

### API Documentation
- `docs/openapi.yaml` - Main OpenAPI spec
- `ssb-backend/docs/openapi.yaml` - Backend-specific spec


