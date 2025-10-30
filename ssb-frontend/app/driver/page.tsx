"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DriverSidebar } from "@/components/driver/driver-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Users, Play } from "lucide-react"
import { apiClient } from "@/lib/api"
import MapView from '@/components/tracking/MapView'
import { startTrip } from '@/lib/services/trip.service'
import { useToast } from '@/hooks/use-toast'


// Remove hardcoded todayTrips; we'll use real API

export default function DriverDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [trips, setTrips] = useState<any[]>([])
  const [stops, setStops] = useState<{ id: string; lat: number; lng: number; label?: string }[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (user && user.role?.toLowerCase() !== "driver") {
      const userRole = user.role?.toLowerCase()
      if (userRole === "admin" || userRole === "parent") {
        router.push(`/${userRole}`)
      }
    }
  }, [user, router])

  // Load trips for the logged in driver and fetch details for the first active trip
  useEffect(() => {
    if (!user) return

    async function load() {
      try {
        // Ưu tiên dùng schedules vì backend đang mount /api/v1/trips hạn chế (không có GET /).
        // Tránh gọi /trips để không log lỗi 404 làm rối console.
        const driverIdNum = Number(user!.id)
        let normalized: any[] = []
        try {
          const r1 = await apiClient.getSchedules({ maTaiXe: driverIdNum })
          const list1: any[] = Array.isArray(r1?.data) ? r1.data : []
          if (list1.length > 0) {
            normalized = list1
          } else {
            const r2 = await apiClient.getSchedules()
            const list2: any[] = Array.isArray(r2?.data) ? r2.data : []
            normalized = list2.filter((s: any) => Number(s?.maTaiXe ?? s?.driverId) === driverIdNum)
          }
        } catch (e) {
          // Nếu schedules lỗi hoàn toàn, là tình huống bất thường → reset và dừng
          normalized = []
        }

        setTrips(normalized)

        // Only fetch stops/details for an active schedule (trip started)
        const active = normalized.find((t: any) => (t.trangThai === 'dang_chay' || t.status === 'running' || t.status === 'dang_chay'))
        if (active) {
          const scheduleId = active.maLichTrinh || active.id || active.maChuyen || active.maChuyenDi
          if (scheduleId) {
            try {
              const detailRes = await apiClient.getScheduleById(scheduleId)
              const detail = detailRes && detailRes.data ? detailRes.data : detailRes
              const detailAny: any = detail
              const routeStops = detailAny?.routeInfo?.diemDung || detailAny?.schedule?.route?.diemDung || detailAny?.route?.diemDung || detailAny?.lichTrinh?.tuyen?.diemDung || []
              const mappedStops = (routeStops || []).map((s: any) => ({ id: s.maDiem || s.id || s.maDiemDung || `${s.lat}_${s.lng}`, lat: Number(s.viDo || s.lat || s.latitude), lng: Number(s.kinhDo || s.lng || s.longitude), label: s.tenDiem || s.ten || s.label }))
              setStops(mappedStops.filter((s: any) => Number.isFinite(s.lat) && Number.isFinite(s.lng)))
            } catch {
              setStops([])
            }
          }
        } else {
          // no active trip → clear stops and do not show map
          setStops([])
        }
      } catch (err) {
        console.error('Failed to load trips for driver', err)
        setStops([])
      }
    }

    load()
  }, [user])

  if (!user || user.role?.toLowerCase() !== "driver") {
    return null
  }

  return (
    <DashboardLayout sidebar={<DriverSidebar />}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lịch trình hôm nay</h1>
          <p className="text-muted-foreground mt-1">Quản lý chuyến đi và điểm dừng của bạn</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">2</div>
              <p className="text-sm text-muted-foreground">Chuyến hôm nay</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">28</div>
              <p className="text-sm text-muted-foreground">Học sinh</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">156</div>
              <p className="text-sm text-muted-foreground">Chuyến hoàn thành</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">94.5%</div>
              <p className="text-sm text-muted-foreground">Đúng giờ</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Trips + Map */}
        <div className={stops.length > 0 ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : "space-y-5"}>
          <div className={stops.length > 0 ? "lg:col-span-1 space-y-5" : "space-y-5"}>
            <h2 className="text-xl font-semibold text-foreground">Chuyến đi hôm nay</h2>
            {trips.map((trip: any, idx: number) => {
              const id = trip.maChuyenDi || trip.id || trip.maChuyen || idx
              const title = trip.tenTuyen || trip.route || trip.moTa || trip.loai || `Chuyến ${id}`
              return (
                <Card key={id} className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-foreground">{title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {/* Ưu tiên giờ khởi hành từ lịch trình nếu không có giờ thực tế */}
                            {trip.gioBatDauThucTe || trip.gioKhoiHanh || trip.startTime || '-'}
                            {" "}-{" "}
                            {trip.gioKetThucThucTe || trip.endTime || '-'}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {Array.isArray(trip.diemDung) ? trip.diemDung.length : (trip.stops || '-')} điểm dừng
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {trip.soHocSinh || trip.students || '-'} học sinh
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-primary text-primary">
                        {trip.trangThai || trip.status || (trip.dangApDung ? 'Đang áp dụng' : 'Đã lên lịch')}
                      </Badge>
                    </div>

                    <Button
                      className="w-full bg-primary hover:bg-primary/90 cursor-pointer"
                      onClick={async () => {
                        try {
                          // Call start trip via REST when available; fallback handled in service
                          await startTrip(id)
                          toast({ title: 'Đã bắt đầu chuyến đi', description: `Trip ${id} đang chạy` })
                        } catch (e) {
                          // Not fatal; still navigate to trip page
                          toast({ title: 'Không thể bắt đầu qua API', description: 'Đi tiếp vào trang chuyến đi', variant: 'destructive' })
                        } finally {
                          router.push(`/driver/trip/${id}`)
                        }
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Bắt đầu chuyến đi
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {stops.length > 0 && (
            <div className="lg:col-span-2">
              <MapView buses={[]} stops={stops} height="640px" />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
