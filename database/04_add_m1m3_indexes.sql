-- M1-M3: Database Indexes for Performance
-- Run this script to add indexes for schedules conflict detection and stops ordering

-- Indexes for Schedules table (conflict detection)
-- Index on bus_id + time fields for fast conflict checks
CREATE INDEX IF NOT EXISTS idx_schedules_bus_time 
ON LichTrinh(maXe, ngayChay, gioKhoiHanh, loaiChuyen);

-- Index on driver_id + time fields for fast conflict checks
CREATE INDEX IF NOT EXISTS idx_schedules_driver_time 
ON LichTrinh(maTaiXe, ngayChay, gioKhoiHanh, loaiChuyen);

-- Composite index for active schedules lookup
CREATE INDEX IF NOT EXISTS idx_schedules_active 
ON LichTrinh(dangApDung, ngayChay, gioKhoiHanh);

-- Indexes for route_stops table (stops ordering) - FIXED for new schema
-- Index on route_id + sequence for fast reorder operations
CREATE INDEX IF NOT EXISTS idx_route_stops_route_seq 
ON route_stops(route_id, sequence);

-- Composite index for route stops lookup
CREATE INDEX IF NOT EXISTS idx_route_stops_route 
ON route_stops(route_id);

-- Index for stop lookup
CREATE INDEX IF NOT EXISTS idx_route_stops_stop 
ON route_stops(stop_id);

-- Additional indexes for common queries
-- Index on buses status for filtering
CREATE INDEX IF NOT EXISTS idx_buses_status 
ON XeBuyt(trangThai);

-- Index on drivers status for filtering
CREATE INDEX IF NOT EXISTS idx_drivers_status 
ON TaiXe(trangThai);

-- Index on students parent for parent visibility
CREATE INDEX IF NOT EXISTS idx_students_parent 
ON HocSinh(maPhuHuynh);

-- Index on routes status
CREATE INDEX IF NOT EXISTS idx_routes_status 
ON TuyenDuong(trangThai);

-- Show indexes created
SHOW INDEX FROM LichTrinh;
SHOW INDEX FROM route_stops;
SHOW INDEX FROM DiemDung;
SHOW INDEX FROM XeBuyt;
SHOW INDEX FROM TaiXe;
SHOW INDEX FROM HocSinh;
SHOW INDEX FROM TuyenDuong;

