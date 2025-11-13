"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Plus, 
  CalendarIcon, 
  Bus, 
  User, 
  Zap, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  TrendingUp,
  Clock,
  Route as RouteIcon,
  Filter,
  Download,
  Copy
} from "lucide-react"
import { ScheduleForm } from "@/components/admin/schedule-form"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"

type Schedule = { 
  id: string; 
  date?: string; 
  route?: string; 
  bus?: string; 
  driver?: string; 
  startTime?: string; 
  status?: string; 
  raw?: any 
  routeId?: number;
  busId?: number;
  driverId?: number;
  tripType?: string;
}

export default function SchedulePage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoAssignLoading, setAutoAssignLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterTripType, setFilterTripType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isMobile, setIsMobile] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  function formatDate(d?: Date) {
    if (!d) return ''
    const yyyy = d.getFullYear()
    const mm = `${d.getMonth() + 1}`.padStart(2, '0')
    const dd = `${d.getDate()}`.padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  function mapSchedule(s: any): Schedule {
    return {
      id: String(s.maLichTrinh || s.id || s.maLich || s._id || ''),
      date: s.ngayChay || s.date,
      route: s.tenTuyen || s.route?.tenTuyen || s.routeName || s.route,
      bus: s.bienSoXe || s.bus?.bienSoXe || s.busPlate || s.bus,
      driver: s.tenTaiXe || s.driver?.hoTen || s.driverName || s.driver,
      startTime: s.gioKhoiHanh || s.startTime,
      status: s.dangApDung ? 'active' : 'inactive',
      tripType: s.loaiChuyen,
      raw: s,
      routeId: s.maTuyen,
      busId: s.maXe,
      driverId: s.maTaiXe,
    }
  }

  async function fetchAllSchedules() {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.getSchedules({})
      const data = (res as any).data || []
      const items = Array.isArray(data) ? data : data?.data || []
      const mappedSchedules = items.map(mapSchedule)
      setAllSchedules(mappedSchedules)
    } catch (e: any) {
      setError(e?.message || 'Không lấy được lịch trình')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllSchedules()
  }, [])

  async function handleAutoAssign() {
    if (!date) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày",
        variant: "destructive",
      })
      return
    }

    setAutoAssignLoading(true)
    try {
      // Fetch available resources
      const [routesRes, busesRes, driversRes] = await Promise.all([
        apiClient.getRoutes({ limit: 100 }),
        apiClient.getBuses({ limit: 100 }),
        apiClient.getDrivers({ limit: 100 }),
      ])

      const routes = (routesRes as any).data || (routesRes as any).data?.data || []
      const buses = (busesRes as any).data || (busesRes as any).data?.data || []
      const drivers = (driversRes as any).data || (driversRes as any).data?.data || []

      // Filter only active resources
      const activeBuses = buses.filter((b: any) => b.trangThai === 'hoat_dong')
      const activeDrivers = drivers.filter((d: any) => d.trangThai === 'hoat_dong')

      if (activeBuses.length === 0 || activeDrivers.length === 0 || routes.length === 0) {
        toast({
          title: "Không thể phân công",
          description: "Không đủ xe, tài xế hoặc tuyến đường",
          variant: "destructive",
        })
        return
      }

      const selectedDateStr = formatDate(date)
      
      // Get already assigned resources for the selected date
      const todaySchedules = allSchedules.filter(s => {
        const scheduleDate = s.date || s.raw?.ngayChay
        return scheduleDate === selectedDateStr
      })
      const assignedBusIds = new Set(todaySchedules.map(s => s.raw?.maXe).filter(Boolean))
      const assignedDriverIds = new Set(todaySchedules.map(s => s.raw?.maTaiXe).filter(Boolean))

      // Find available resources
      const availableBuses = activeBuses.filter((b: any) => !assignedBusIds.has(b.maXe))
      const availableDrivers = activeDrivers.filter((d: any) => !assignedDriverIds.has(d.maTaiXe))

      if (availableBuses.length === 0 || availableDrivers.length === 0) {
        toast({
          title: "Không thể phân công",
          description: "Tất cả xe hoặc tài xế đã được phân công trong ngày này",
          variant: "destructive",
        })
        return
      }

      // Auto-assign: create schedule for first available route, bus, driver
      const tripTypes = ['don_sang', 'tra_chieu']
      const defaultTimes = ['06:30', '16:30'] // Default departure times
      
      let createdCount = 0
      const maxAssignments = Math.min(availableBuses.length, availableDrivers.length, routes.length * 2)

      for (let i = 0; i < maxAssignments && createdCount < 2; i++) {
        const route = routes[i % routes.length]
        const bus = availableBuses[createdCount % availableBuses.length]
        const driver = availableDrivers[createdCount % availableDrivers.length]
        const tripType = tripTypes[createdCount % tripTypes.length]
        const startTime = defaultTimes[createdCount % defaultTimes.length]

        try {
          const payload = {
            maTuyen: route.maTuyen || route.id,
            maXe: bus.maXe || bus.id,
            maTaiXe: driver.maTaiXe || driver.maNguoiDung || driver.id,
            loaiChuyen: tripType,
            gioKhoiHanh: startTime,
            ngayChay: selectedDateStr,
            dangApDung: true,
          }

          await apiClient.createSchedule(payload)
          createdCount++
        } catch (err: any) {
          console.error('Failed to create schedule:', err)
        }
      }

      if (createdCount > 0) {
        toast({
          title: "Thành công",
          description: `Đã tự động phân công ${createdCount} lịch trình`,
        })
        fetchAllSchedules()
      } else {
        toast({
          title: "Không thành công",
          description: "Không thể tạo lịch trình tự động",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      console.error('Auto assign error:', err)
      toast({
        title: "Lỗi",
        description: err?.message || "Không thể phân công tự động",
        variant: "destructive",
      })
    } finally {
      setAutoAssignLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa lịch trình này?")) return

    try {
      await apiClient.deleteSchedule(id)
      toast({ title: "Thành công", description: "Đã xóa lịch trình" })
      fetchAllSchedules()
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.message || "Không thể xóa lịch trình",
        variant: "destructive",
      })
    }
  }

  async function handleDuplicate(schedule: Schedule) {
    try {
      const payload = {
        maTuyen: schedule.routeId,
        maXe: schedule.busId,
        maTaiXe: schedule.driverId,
        loaiChuyen: schedule.tripType,
        gioKhoiHanh: schedule.startTime,
        ngayChay: schedule.date,
        dangApDung: true,
      }
      await apiClient.createSchedule(payload)
      toast({ title: "Thành công", description: "Đã sao chép lịch trình" })
      fetchAllSchedules()
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.message || "Không thể sao chép lịch trình",
        variant: "destructive",
      })
    }
  }
  
  const selectedDateStr = formatDate(date)
  const todaysSchedules = allSchedules.filter(s => {
    // Check both date field and raw.ngayChay
    const scheduleDate = s.date || s.raw?.ngayChay || ''
    return scheduleDate === selectedDateStr
  })

  // Filter and search
  const filteredSchedules = allSchedules.filter(schedule => {
    const matchesSearch = !searchQuery || 
      schedule.route?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.bus?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.driver?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTripType = filterTripType === 'all' || schedule.tripType === filterTripType
    const matchesStatus = filterStatus === 'all' || schedule.status === filterStatus
    
    return matchesSearch && matchesTripType && matchesStatus
  })

  // Statistics
  const stats = {
    total: allSchedules.length,
    active: allSchedules.filter(s => s.status === 'active').length,
    morning: allSchedules.filter(s => s.tripType === 'don_sang').length,
    afternoon: allSchedules.filter(s => s.tripType === 'tra_chieu').length,
    today: todaysSchedules.length,
  }

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quản lý Lịch trình</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Phân công và theo dõi lịch trình xe buýt</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Tạo lịch trình mới</span>
                <span className="sm:hidden">Tạo mới</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl">Tạo lịch trình mới</DialogTitle>
                <DialogDescription className="text-sm sm:text-base">Phân công xe buýt và tài xế cho tuyến đường</DialogDescription>
              </DialogHeader>
              <ScheduleForm onClose={() => {
                setIsAddDialogOpen(false)
                fetchAllSchedules()
              }} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Tổng lịch trình</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
                </div>
                <RouteIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary opacity-20 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Đang áp dụng</p>
                  <p className="text-xl sm:text-2xl font-bold text-success">{stats.active}</p>
                </div>
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-success opacity-20 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Đón sáng</p>
                  <p className="text-xl sm:text-2xl font-bold text-warning">{stats.morning}</p>
                </div>
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-warning opacity-20 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Trả chiều</p>
                  <p className="text-xl sm:text-2xl font-bold text-primary">{stats.afternoon}</p>
                </div>
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-primary opacity-20 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 col-span-2 md:col-span-1">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Hôm nay</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats.today}</p>
                </div>
                <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground opacity-20 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Quick Actions */}
        <Card className="border-border/50">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tuyến, xe, tài xế..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={filterTripType} onValueChange={setFilterTripType}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Loại chuyến" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="don_sang">Đón sáng</SelectItem>
                    <SelectItem value="tra_chieu">Trả chiều</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="active">Đang áp dụng</SelectItem>
                    <SelectItem value="inactive">Không áp dụng</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={fetchAllSchedules} className="w-full sm:w-auto">
                  Tải lại
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="table" className="space-y-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="table" className="flex-1 sm:flex-none">Xem dạng bảng</TabsTrigger>
            <TabsTrigger value="calendar" className="flex-1 sm:flex-none">Xem theo lịch</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Danh sách lịch trình</CardTitle>
                  <div className="flex gap-2">
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-xl sm:text-2xl">Chỉnh sửa lịch trình</DialogTitle>
                          <DialogDescription className="text-sm sm:text-base">Cập nhật thông tin lịch trình</DialogDescription>
                        </DialogHeader>
                        {editingSchedule && (
                          <ScheduleForm 
                            mode="edit" 
                            initialSchedule={editingSchedule}
                            onClose={() => {
                              setIsEditDialogOpen(false)
                              setEditingSchedule(null)
                              fetchAllSchedules()
                            }} 
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading && (
                  <div className="py-8 text-center text-muted-foreground">
                    Đang tải lịch trình...
                  </div>
                )}
                {error && (
                  <div className="py-8 text-center text-destructive">{error}</div>
                )}
                {!loading && !error && filteredSchedules.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    Không có lịch trình nào
                  </div>
                )}
                {!loading && !error && filteredSchedules.length > 0 && (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ngày chạy</TableHead>
                            <TableHead>Giờ khởi hành</TableHead>
                            <TableHead>Tuyến đường</TableHead>
                            <TableHead>Loại chuyến</TableHead>
                            <TableHead>Xe buýt</TableHead>
                            <TableHead>Tài xế</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSchedules.map((schedule) => (
                            <TableRow key={schedule.id}>
                              <TableCell className="font-medium">
                                {schedule.date ? new Date(schedule.date).toLocaleDateString('vi-VN') : '-'}
                              </TableCell>
                              <TableCell>{schedule.startTime || '-'}</TableCell>
                              <TableCell>{schedule.route || '-'}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={
                                  schedule.tripType === 'don_sang' 
                                    ? 'border-warning text-warning' 
                                    : 'border-primary text-primary'
                                }>
                                  {schedule.tripType === 'don_sang' ? 'Đón sáng' : schedule.tripType === 'tra_chieu' ? 'Trả chiều' : '-'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Bus className="w-4 h-4 text-primary" />
                                  {schedule.bus || '-'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-success" />
                                  {schedule.driver || '-'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={schedule.status === 'active' ? 'default' : 'secondary'}>
                                  {schedule.status === 'active' ? 'Đang áp dụng' : 'Không áp dụng'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleDuplicate(schedule)}
                                    title="Sao chép"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      setEditingSchedule(schedule)
                                      setIsEditDialogOpen(true)
                                    }}
                                    title="Chỉnh sửa"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleDelete(schedule.id)}
                                    title="Xóa"
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {filteredSchedules.map((schedule) => (
                        <Card key={schedule.id} className="border-border/50 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-primary" />
                                  <h4 className="font-medium text-foreground">{schedule.route}</h4>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {schedule.date ? new Date(schedule.date).toLocaleDateString('vi-VN') : '-'} • {schedule.startTime}
                                </p>
                              </div>
                              <Badge variant="outline" className={
                                schedule.tripType === 'don_sang' 
                                  ? 'border-warning text-warning' 
                                  : 'border-primary text-primary'
                              }>
                                {schedule.tripType === 'don_sang' ? 'Đón sáng' : schedule.tripType === 'tra_chieu' ? 'Trả chiều' : '-'}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div className="flex items-center gap-2 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Bus className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">Xe buýt</p>
                                  <p className="font-medium">{schedule.bus}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                                  <User className="w-4 h-4 text-success" />
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">Tài xế</p>
                                  <p className="font-medium">{schedule.driver}</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t">
                              <Badge variant={schedule.status === 'active' ? 'default' : 'secondary'}>
                                {schedule.status === 'active' ? 'Đang áp dụng' : 'Không áp dụng'}
                              </Badge>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDuplicate(schedule)}
                                  title="Sao chép"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setEditingSchedule(schedule)
                                    setIsEditDialogOpen(true)
                                  }}
                                  title="Chỉnh sửa"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(schedule.id)}
                                  title="Xóa"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Calendar */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Lịch
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border-0" />
                </CardContent>
              </Card>

              {/* Today's Schedules */}
              <div className="lg:col-span-3 space-y-4">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Lịch trình ngày {date?.toLocaleDateString("vi-VN")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {loading && <div className="py-8 text-center text-muted-foreground">Đang tải...</div>}
                    {error && <div className="py-8 text-center text-destructive">{error}</div>}
                    {!loading && !error && todaysSchedules.length === 0 && (
                      <div className="py-8 text-center text-muted-foreground">
                        Không có lịch trình nào trong ngày này
                      </div>
                    )}
                    {!loading && !error && todaysSchedules.map((schedule) => (
                      <Card key={schedule.id} className="border-border/50 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                <h4 className="font-medium text-foreground">{schedule.route}</h4>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Khởi hành: {schedule.startTime}
                              </p>
                            </div>
                            <Badge variant="outline" className={
                              schedule.tripType === 'don_sang' 
                                ? 'border-warning text-warning' 
                                : 'border-primary text-primary'
                            }>
                              {schedule.tripType === 'don_sang' ? 'Đón sáng' : 'Trả chiều'}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Bus className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Xe buýt</p>
                                <p className="font-medium">{schedule.bus}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-success" />
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Tài xế</p>
                                <p className="font-medium">{schedule.driver}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>

                {/* Quick Assignment */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Phân công nhanh
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Tự động phân công xe và tài xế cho ngày {date?.toLocaleDateString("vi-VN")}
                      </p>
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setIsAddDialogOpen(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Tạo lịch trình thủ công
                        </Button>
                        <Button 
                          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                          onClick={handleAutoAssign}
                          disabled={autoAssignLoading}
                        >
                          {autoAssignLoading ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                              Đang phân công...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              Phân công tự động
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
