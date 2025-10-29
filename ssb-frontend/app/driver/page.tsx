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


const todayTrips = [
  {
    id: "1",
    route: "Tuyến 1 - Quận 1",
    startTime: "06:30",
    endTime: "07:30",
    students: 28,
    stops: 8,
    status: "scheduled",
  },
  {
    id: "2",
    route: "Tuyến 1 - Quận 1 (Chiều)",
    startTime: "15:00",
    endTime: "16:00",
    students: 28,
    stops: 8,
    status: "scheduled",
  },
]

export default function DriverDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [trips, setTrips] = useState<any[]>([])
  const [stops, setStops] = useState<{ id: string; lat: number; lng: number; label?: string }[]>([])

  useEffect(() => {
    if (user && user.role?.toLowerCase() !== "driver") {
      const userRole = user.role?.toLowerCase()
      if (userRole === "admin" || userRole === "parent") {
        router.push(`/${userRole}`)
      }
    }
  }, [user, router])

  // Load trips for the logged in driver and fetch details for the first trip (today's / active)
  useEffect(() => {
    if (!user) return

    async function load() {
      try {
        // Fetch trips for this driver
        const res = await apiClient.getTrips({ maTaiXe: Number(user!.id) })
        const list = (res && res.data) || []
        const normalized = Array.isArray(list) ? list : []
        setTrips(normalized)

        // Only fetch stops/details for an active trip (trip started)
        const active = normalized.find((t: any) => (t.trangThai === 'dang_chay' || t.status === 'running' || t.status === 'dang_chay'))
        if (active) {
          const tripId = active.maChuyenDi || active.id || active.maChuyen
          if (tripId) {
            const detailRes = await apiClient.getTripById(tripId)
            const detail = detailRes && detailRes.data ? detailRes.data : detailRes
            const detailAny: any = detail
            const routeStops = detailAny?.routeInfo?.diemDung || detailAny?.schedule?.route?.diemDung || detailAny?.route?.diemDung || detailAny?.route?.diemDung || []
            const mappedStops = (routeStops || []).map((s: any) => ({ id: s.maDiem || s.id || s.maDiemDung || `${s.lat}_${s.lng}`, lat: Number(s.viDo || s.lat || s.latitude), lng: Number(s.kinhDo || s.lng || s.longitude), label: s.tenDiem || s.ten || s.label }))
            setStops(mappedStops.filter((s: any) => Number.isFinite(s.lat) && Number.isFinite(s.lng)))
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
            {(trips.length === 0 ? todayTrips : trips).map((trip: any, idx: number) => {
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
                            {trip.gioBatDauThucTe || trip.startTime || '-'} - {trip.gioKetThucThuc || trip.endTime || '-'}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {Array.isArray(trip.diemDung) ? trip.diemDung.length : trip.stops || '-'} điểm dừng
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {trip.soHocSinh || trip.students || '-'} học sinh
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-primary text-primary">
                        {trip.trangThai || trip.status || 'Đã lên lịch'}
                      </Badge>
                    </div>

                    <Button
                      className="w-full bg-primary hover:bg-primary/90 cursor-pointer"
                      onClick={() => router.push(`/driver/trip/${id}`)}
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
