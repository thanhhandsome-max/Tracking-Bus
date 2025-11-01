"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, CalendarIcon, Bus, User, Zap } from "lucide-react"
import { ScheduleForm } from "@/components/admin/schedule-form"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type Schedule = { id: string; date?: string; route?: string; bus?: string; driver?: string; startTime?: string; status?: string; raw?: any }

export default function SchedulePage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoAssignLoading, setAutoAssignLoading] = useState(false)
  const { toast } = useToast()

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
      status: s.dangApDung ? 'hoat_dong' : 'khong_hoat_dong',
      raw: s,
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
      const todaySchedules = allSchedules.filter(s => s.raw?.ngayChay === selectedDateStr)
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
  
  const selectedDateStr = formatDate(date)
  const todaysSchedules = allSchedules.filter(s => s.raw?.ngayChay === selectedDateStr)

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Lịch trình & Phân công</h1>
            <p className="text-muted-foreground mt-1">Quản lý lịch trình và phân công tài xế, xe buýt</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Tạo lịch trình
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tạo lịch trình mới</DialogTitle>
                <DialogDescription>Phân công xe buýt và tài xế cho tuyến đường</DialogDescription>
              </DialogHeader>
              <ScheduleForm onClose={() => {
                setIsAddDialogOpen(false)
                fetchAllSchedules()
              }} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

          {/* Schedule List */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Lịch trình ngày {date?.toLocaleDateString("vi-VN")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading && <div className="py-2">Đang tải lịch trình...</div>}
                {error && <div className="py-2 text-destructive">{error}</div>}
                {todaysSchedules.length === 0 && !loading && !error && (
                  <div className="py-4 text-center text-muted-foreground">
                    Không có lịch trình nào trong ngày này
                  </div>
                )}
                {todaysSchedules.map((schedule) => (
                  <Card key={schedule.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-foreground">{schedule.route}</h4>
                          <p className="text-sm text-muted-foreground mt-1">Khởi hành: {schedule.startTime}</p>
                        </div>
                        <Badge variant="outline" className="border-primary text-primary">
                          {schedule.raw?.loaiChuyen === 'don_sang' ? 'Đón sáng' : schedule.raw?.loaiChuyen === 'tra_chieu' ? 'Trả chiều' : 'N/A'}
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

            {/* All Schedules */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Tất cả lịch trình</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {allSchedules.length === 0 && !loading && !error && (
                  <div className="py-4 text-center text-muted-foreground">
                    Chưa có lịch trình nào
                  </div>
                )}
                {allSchedules.map((schedule) => (
                  <Card key={schedule.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-foreground">{schedule.route}</h4>
                          <p className="text-sm text-muted-foreground mt-1">Khởi hành: {schedule.startTime}</p>
                          <p className="text-xs text-muted-foreground">Ngày: {schedule.raw?.ngayChay}</p>
                        </div>
                        <Badge variant="outline" className="border-primary text-primary">
                          {schedule.raw?.loaiChuyen === 'don_sang' ? 'Đón sáng' : schedule.raw?.loaiChuyen === 'tra_chieu' ? 'Trả chiều' : 'N/A'}
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
                <CardTitle>Phân công nhanh</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Sử dụng AI để tự động phân công xe và tài xế cho ngày {date?.toLocaleDateString("vi-VN")}
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
      </div>
    </DashboardLayout>
  )
}
