"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DriverSidebar } from "@/components/driver/driver-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  BusFront, 
  Users, 
  Eye, 
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  CalendarDays
} from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

type DateRange = 'today' | 'thisWeek' | 'custom' | null
type TripStatus = 'chua_khoi_hanh' | 'dang_chay' | 'hoan_thanh' | 'huy' | 'all'

export default function DriverSchedulePage() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  
  // Filters
  const [dateRange, setDateRange] = useState<DateRange>('today')
  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")
  const [tripStatus, setTripStatus] = useState<TripStatus>('all')
  
  // Detail dialog
  const [openDetail, setOpenDetail] = useState(false)
  const [detailSchedule, setDetailSchedule] = useState<any | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadSchedules()
    }
  }, [user, dateRange, fromDate, toDate, tripStatus])

  async function loadSchedules() {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const params: any = {}
      
      if (dateRange === 'today') {
        params.dateRange = 'today'
      } else if (dateRange === 'thisWeek') {
        params.dateRange = 'thisWeek'
      } else if (dateRange === 'custom' && fromDate && toDate) {
        params.dateRange = 'custom'
        params.fromDate = fromDate
        params.toDate = toDate
      }
      
      if (tripStatus !== 'all') {
        params.tripStatus = tripStatus
      }

      const res = await apiClient.getDriverSchedules(user.id, params)
      const data = (res as any)?.data || []
      setSchedules(Array.isArray(data) ? data : [])
    } catch (e: any) {
      console.error("Failed to load schedules", e)
      toast({ 
        title: "Lỗi", 
        description: e.message || "Không thể tải lịch trình. Vui lòng kiểm tra kết nối mạng", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  async function openScheduleDetail(schedule: any) {
    if (!user?.id) return
    
    setOpenDetail(true)
    setLoadingDetail(true)
    setDetailSchedule(null)
    
    try {
      const res = await apiClient.getDriverScheduleDetail(user.id, schedule.maLichTrinh)
      const data = (res as any)?.data || res
      setDetailSchedule(data)
    } catch (e: any) {
      toast({ 
        title: "Lỗi", 
        description: "Không thể tải chi tiết lịch trình", 
        variant: "destructive" 
      })
      setOpenDetail(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  function handleStartTrip(schedule: any) {
    if (schedule.tripId) {
      // Nếu đã có trip, chuyển đến trang trip detail
      router.push(`/driver/trip/${schedule.tripId}`)
    } else {
      // Nếu chưa có trip, cần tạo trip trước (hoặc chuyển đến trang tạo trip)
      toast({
        title: "Thông báo",
        description: "Chuyến đi chưa được tạo. Vui lòng liên hệ Admin.",
      })
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    return d.toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return ""
    if (timeStr.includes('T')) {
      return new Date(timeStr).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })
    }
    return timeStr.slice(0, 5) // HH:mm
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'chua_khoi_hanh':
        return <Badge variant="outline" className="border-gray-500 text-gray-700">Chưa bắt đầu</Badge>
      case 'dang_chay':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Đang chạy</Badge>
      case 'hoan_thanh':
        return <Badge variant="outline" className="border-green-500 text-green-700">Hoàn thành</Badge>
      case 'huy':
        return <Badge variant="outline" className="border-red-500 text-red-700">Đã hủy</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getLoaiChuyenLabel = (loaiChuyen: string) => {
    return loaiChuyen === 'don_sang' ? 'Đón sáng' : 'Trả chiều'
  }

  return (
    <DashboardLayout sidebar={<DriverSidebar />}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lịch làm việc</h1>
          <p className="text-muted-foreground mt-1">Xem lịch trình được phân công</p>
        </div>

        {/* Filters */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Khoảng thời gian</Label>
                <Select value={dateRange || ''} onValueChange={(v) => setDateRange(v as DateRange)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khoảng thời gian" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hôm nay</SelectItem>
                    <SelectItem value="thisWeek">Tuần này</SelectItem>
                    <SelectItem value="custom">Tùy chỉnh</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRange === 'custom' && (
                <>
                  <div className="space-y-2">
                    <Label>Từ ngày</Label>
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Đến ngày</Label>
                    <Input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select value={tripStatus} onValueChange={(v) => setTripStatus(v as TripStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="chua_khoi_hanh">Chưa bắt đầu</SelectItem>
                    <SelectItem value="dang_chay">Đang chạy</SelectItem>
                    <SelectItem value="hoan_thanh">Hoàn thành</SelectItem>
                    <SelectItem value="huy">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedules List */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Danh sách lịch trình</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Giờ</TableHead>
                      <TableHead>Tuyến đường</TableHead>
                      <TableHead>Xe</TableHead>
                      <TableHead>Loại chuyến</TableHead>
                      <TableHead>Học sinh</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-20 inline-block" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : schedules.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Chưa có lịch trình nào</p>
                <p className="text-sm mt-2">Vui lòng liên hệ Admin để được phân công lịch trình</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Giờ</TableHead>
                    <TableHead>Tuyến đường</TableHead>
                    <TableHead>Xe</TableHead>
                    <TableHead>Loại chuyến</TableHead>
                    <TableHead>Học sinh</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule: any) => (
                    <TableRow key={schedule.maLichTrinh}>
                      <TableCell className="font-medium">
                        {formatDate(schedule.ngayChay)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {formatTime(schedule.gioKhoiHanh)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {schedule.tenTuyen || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <BusFront className="w-4 h-4 text-muted-foreground" />
                          {schedule.bienSoXe || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getLoaiChuyenLabel(schedule.loaiChuyen)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          {schedule.totalStudents || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(schedule.tripStatus)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openScheduleDetail(schedule)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Chi tiết
                          </Button>
                          {schedule.tripStatus === 'chua_khoi_hanh' && (
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={() => handleStartTrip(schedule)}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Bắt đầu
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <ScheduleDetailDialog 
          open={openDetail} 
          onOpenChange={setOpenDetail} 
          data={detailSchedule} 
          loading={loadingDetail}
          onStartTrip={handleStartTrip}
        />
      </div>
    </DashboardLayout>
  )
}

// Schedule Detail Dialog Component
function ScheduleDetailDialog({ 
  open, 
  onOpenChange, 
  data, 
  loading,
  onStartTrip 
}: { 
  open: boolean
  onOpenChange: (v: boolean) => void
  data: any
  loading: boolean
  onStartTrip: (schedule: any) => void
}) {
  const d = data || {}
  const title = d.routeInfo?.tenTuyen || d.tenTuyen || `Lịch trình #${d.maLichTrinh || ''}`
  const dateStr = d.ngayChay ? new Date(d.ngayChay).toLocaleDateString('vi-VN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : '-'
  const planned = d.gioKhoiHanh || '-'
  const stops = d.stops || []
  const students = d.students || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            {dateStr}
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between border rounded-md p-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow icon={<Clock className="w-4 h-4" />} label="Giờ khởi hành" value={planned} />
              <InfoRow icon={<BusFront className="w-4 h-4" />} label="Biển số xe" value={d.busInfo?.bienSoXe || d.bienSoXe || '-'} />
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="Điểm bắt đầu" value={d.routeInfo?.diemBatDau || '-'} />
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="Điểm kết thúc" value={d.routeInfo?.diemKetThuc || '-'} />
              <InfoRow icon={<Users className="w-4 h-4" />} label="Tổng học sinh" value={d.totalStudents || students.length || 0} />
              <InfoRow 
                icon={<CheckCircle className="w-4 h-4" />} 
                label="Trạng thái" 
                value={
                  d.trip?.trangThai === 'chua_khoi_hanh' ? 'Chưa bắt đầu' :
                  d.trip?.trangThai === 'dang_chay' ? 'Đang chạy' :
                  d.trip?.trangThai === 'hoan_thanh' ? 'Hoàn thành' :
                  d.trip?.trangThai === 'huy' ? 'Đã hủy' : 'Chưa bắt đầu'
                }
              />
            </div>

            <Separator />

            {/* Route Stops */}
            {stops.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Điểm đón/trả ({stops.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {stops.map((stop: any, idx: number) => (
                    <div key={stop.maDiem || idx} className="border rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                            {stop.sequence || idx + 1}
                          </Badge>
                          <div>
                            <p className="font-medium">{stop.tenDiem || stop.address || 'Điểm dừng'}</p>
                            {stop.address && stop.tenDiem !== stop.address && (
                              <p className="text-sm text-muted-foreground">{stop.address}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{stop.studentCount || 0} học sinh</span>
                        </div>
                      </div>
                      {stop.students && stop.students.length > 0 && (
                        <div className="mt-2 pl-10 text-sm text-muted-foreground">
                          {stop.students.slice(0, 3).map((s: any) => s.hoTen).join(', ')}
                          {stop.students.length > 3 && ` và ${stop.students.length - 3} học sinh khác`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Students List */}
            {students.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Danh sách học sinh ({students.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {students.map((student: any) => (
                    <div key={student.maHocSinh} className="border rounded-md p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{student.hoTen}</p>
                        {student.lop && (
                          <p className="text-sm text-muted-foreground">Lớp: {student.lop}</p>
                        )}
                      </div>
                      {student.diaChi && (
                        <p className="text-sm text-muted-foreground">{student.diaChi}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {d.trip?.trangThai === 'huy' && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="text-red-800">Lịch trình này đã bị hủy. Vui lòng liên hệ Admin</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
          {(!d.trip || d.trip.trangThai === 'chua_khoi_hanh') && d.trip?.trangThai !== 'huy' && (
            <Button onClick={() => onStartTrip(d)}>
              <Play className="w-4 h-4 mr-2" />
              Bắt đầu chuyến đi
            </Button>
          )}
          {d.trip?.trangThai === 'dang_chay' && d.trip?.maChuyen && (
            <Button onClick={() => window.location.href = `/driver/trip/${d.trip.maChuyen}`}>
              <Eye className="w-4 h-4 mr-2" />
              Xem chuyến đi
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Info Row Component
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border rounded-md p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}

