# SSB Backend Run Notes

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ installed
- MySQL 8.0+ running
- Git installed

### 1. Environment Setup

```bash
# Navigate to backend directory
cd ssb-backend

# Copy environment template
cp src/config/env.example .env

# Edit .env file with your database credentials
# Update DB_HOST, DB_USER, DB_PASS, DB_NAME as needed
```

#### Required Environment Variables

**BE .env**:
```bash
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASS=secret
DB_NAME=ssb
JWT_SECRET=change_me
JWT_REFRESH_SECRET=change_me_refresh
FE_ORIGIN=http://localhost:3000
```

**FE .env.local** (for frontend integration):
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:4000
NEXT_PUBLIC_MAPS_PROVIDER=leaflet
```

**Important**: Never hard-code URLs in frontend code. Always read from environment variables.

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# Install TypeScript globally (if not already installed)
npm install -g typescript ts-node
```

### 3. Database Setup

```bash
# Option 1: Use the seed script (recommended)
npm run seed

# Option 2: Manual database setup
mysql -u root -p < database/init_db.sql
mysql -u root -p < database/sample_data.sql
```

### 4. Start Development Server

```bash
# Start with nodemon (auto-restart on changes)
npm run dev

# Or start with node directly
npm start
```

### 5. Verify Installation

```bash
# Test health endpoint
curl http://localhost:4000/api/v1/health

# Expected response:
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2025-10-25T10:30:00Z",
    "uptime": 123.456,
    "environment": "development",
    "version": "1.0.0",
    "services": {
      "database": "up",
      "redis": "up",
      "socketio": "up"
    }
  }
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 4000 | No |
| `NODE_ENV` | Environment | development | No |
| `DB_HOST` | Database host | localhost | Yes |
| `DB_USER` | Database user | root | Yes |
| `DB_PASS` | Database password | secret | Yes |
| `DB_NAME` | Database name | ssb | Yes |
| `JWT_SECRET` | JWT secret key | change_me_to_a_secure_secret_key | Yes |
| `JWT_REFRESH_SECRET` | JWT refresh secret | change_me_to_a_secure_refresh_secret_key | Yes |
| `FE_ORIGIN` | Frontend origin | http://localhost:3000 | Yes |

### Database Configuration

The system uses MySQL with the following default settings:
- Host: localhost
- Port: 3306
- Database: ssb
- User: root
- Password: secret

## 📊 Available Endpoints

### Health Check
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/detailed` - Detailed health check

### Authentication (Placeholder)
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/profile` - Get user profile
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - User logout

### Buses (Placeholder)
- `GET /api/v1/buses` - Get all buses
- `GET /api/v1/buses/:id` - Get bus by ID
- `POST /api/v1/buses` - Create bus
- `PUT /api/v1/buses/:id` - Update bus
- `DELETE /api/v1/buses/:id` - Delete bus
- `POST /api/v1/buses/:id/position` - Update bus position

### Drivers (Placeholder)
- `GET /api/v1/drivers` - Get all drivers
- `GET /api/v1/drivers/:id` - Get driver by ID
- `POST /api/v1/drivers` - Create driver
- `PUT /api/v1/drivers/:id` - Update driver
- `DELETE /api/v1/drivers/:id` - Delete driver

### Routes (Placeholder)
- `GET /api/v1/routes` - Get all routes
- `GET /api/v1/routes/:id` - Get route by ID
- `GET /api/v1/routes/:id/stops` - Get route stops

### Schedules (Placeholder)
- `GET /api/v1/schedules` - Get all schedules
- `GET /api/v1/schedules/:id` - Get schedule by ID

### Trips (Placeholder)
- `GET /api/v1/trips` - Get all trips
- `POST /api/v1/trips/:id/start` - Start trip
- `POST /api/v1/trips/:id/end` - End trip
- `POST /api/v1/trips/:id/students/:studentId/status` - Update student status

### Reports (Placeholder)
- `GET /api/v1/reports/buses/stats` - Get bus statistics
- `GET /api/v1/reports/trips/stats` - Get trip statistics

## 🔌 Socket.IO

### Connection
```javascript
const socket = io('http://localhost:4000', {
  auth: {
    token: 'your-jwt-token-here'
  }
});
```

### Available Rooms
- `bus-{busId}` - Bus-specific updates
- `trip-{tripId}` - Trip-specific updates
- `user-{userId}` - User-specific notifications
- `driver-{driverId}` - Driver-specific notifications
- `parent-{parentId}` - Parent-specific notifications
- `admin` - Admin notifications

### Events
- `bus_position_update` - Real-time bus position updates
- `trip_started` - Trip started event
- `trip_completed` - Trip completed event
- `student_picked_up` - Student picked up event
- `student_dropped_off` - Student dropped off event
- `delay_alert` - Delay alert event
- `notification` - General notification event

## 🧪 Testing

### Manual Testing
```bash
# Test health endpoint
curl http://localhost:4000/api/v1/health

# Test with authentication (placeholder)
curl -H "Authorization: Bearer your-token" http://localhost:4000/api/v1/buses

# Test Socket.IO connection
# Use a WebSocket client or browser console
```

### Automated Testing
```bash
# Run tests (when implemented)
npm test

# Run linting
npm run lint

# Build for production
npm run build
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution**: Ensure MySQL is running and credentials are correct in `.env`

#### 2. Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::4000
```
**Solution**: Change PORT in `.env` or kill the process using port 4000

#### 3. JWT Secret Not Set
```
Error: JWT_SECRET is required
```
**Solution**: Set JWT_SECRET in `.env` file

#### 4. Database Not Found
```
Error: Unknown database 'ssb'
```
**Solution**: Run `npm run seed` to create database and tables

#### 5. Socket.IO Connection Failed
```
Error: Socket connection failed
```
**Solution**: Check CORS settings and ensure frontend origin is correct

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# Enable specific debug modules
DEBUG=socket.io* npm run dev
```

## 📝 Logs

### Log Files
- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- Combined logs: `logs/combined.log`

### Log Levels
- `error` - Error messages
- `warn` - Warning messages
- `info` - Informational messages
- `debug` - Debug messages

## 🔄 Development Workflow

### 1. Code Changes
```bash
# Make changes to source files
# Nodemon will automatically restart the server
```

### 2. Database Changes
```bash
# Update database schema
# Run migration scripts
npm run seed
```

### 3. Testing Changes
```bash
# Test API endpoints
curl http://localhost:4000/api/v1/health

# Test Socket.IO events
# Use browser console or WebSocket client
```

### 4. Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📚 Documentation

### API Documentation
- OpenAPI Spec: `docs/openapi.yaml`
- Postman Collection: `docs/postman_collection.json`

### Socket.IO Documentation
- Events Reference: `docs/ws_events.md`

### Database Schema
- Initialization: `database/init_db.sql`
- Sample Data: `database/sample_data.sql`

## 🚀 Production Deployment

### Environment Setup
```bash
# Set production environment
export NODE_ENV=production

# Set production database credentials
export DB_HOST=your-production-host
export DB_USER=your-production-user
export DB_PASS=your-production-password
export DB_NAME=your-production-database
```

### Security Considerations
1. Change default JWT secrets
2. Use strong database passwords
3. Enable SSL/TLS for database connections
4. Configure firewall rules
5. Set up monitoring and logging

### Performance Optimization
1. Enable database connection pooling
2. Configure Redis for caching
3. Set up load balancing
4. Monitor memory usage
5. Optimize database queries

## 📞 Support

### Getting Help
1. Check this documentation
2. Review error logs
3. Test with health endpoint
4. Verify database connection
5. Check environment variables

### Common Commands
```bash
# Check server status
curl http://localhost:4000/api/v1/health

# Check database connection
mysql -u root -p -e "SELECT 1"

# View logs
tail -f logs/app.log

# Restart server
npm run dev
```

---

**Last Updated**: 2025-10-25  
**Version**: 1.0.0  
**Status**: Development Ready
