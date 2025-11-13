"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MapPin, Clock, Users, Navigation, Phone, MessageSquare } from "lucide-react"
import { MapView } from "@/components/tracking/MapView"
import { apiClient } from "@/lib/api"
import { socketService } from "@/lib/socket"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSearchParams } from "next/navigation"
import { useTripBusPosition } from "@/hooks/use-socket"

type Bus = { id: string; plateNumber: string; route: string; driver?: string; driverPhone?: string; status: 'running'|'late'|'incident'|string; speed?: number; students?: number; currentStop?: string; nextStop?: string; eta?: string; progress?: number; lat: number; lng: number }

export default function TrackingPage() {
  const searchParams = useSearchParams()
  // Khởi tạo đồng nhất: 1 chấm mặc định ở Hà Nội
  const [buses, setBuses] = useState<Bus[]>([{
    id: 'demo',
    plateNumber: '29B-TEST',
    route: 'Demo',
    status: 'running',
    speed: 0,
    students: 0,
    progress: 0,
    lat: 21.0285,
    lng: 105.8542,
  }])
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null)

  // testTrip override để nhận toạ độ realtime từ script/socket, cập nhật marker 'demo'
  const testTripFromQuery = searchParams?.get('testTrip') || searchParams?.get('testTripId') || undefined
  const testTripId = useMemo(() => {
    const v = testTripFromQuery ? Number(testTripFromQuery) : undefined
    return (typeof v === 'number' && Number.isFinite(v)) ? v : undefined
  }, [testTripFromQuery])
  const { busPosition } = useTripBusPosition(testTripId)

  useEffect(() => {
    setSelectedBus((prev) => prev || buses[0] || null)
  }, [buses])

  useEffect(() => {
    if (!busPosition || typeof busPosition.lat !== 'number' || typeof busPosition.lng !== 'number') return
    setBuses((prev) => {
      const idx = prev.findIndex((b) => b.id === 'demo')
      const updated = {
        ...prev[(idx >= 0 ? idx : 0)] ?? {},
        id: 'demo',
        plateNumber: '29B-TEST',
        route: testTripId ? `Trip ${testTripId}` : 'Demo',
        status: 'running' as const,
        lat: busPosition.lat,
        lng: busPosition.lng,
        speed: busPosition.speed ?? 0,
      } as Bus
      if (idx >= 0) {
        const copy = prev.slice()
        copy[idx] = { ...copy[idx], ...updated }
        return copy
      }
      return [...prev, updated]
    })
  }, [busPosition, testTripId])

  // Realtime: update bus list when bus position events arrive (so speed/status UI stays fresh)
  useEffect(() => {
    const handler = (e: Event) => {
      const d: any = (e as CustomEvent).detail
      if (!d) return
      const id = (d.busId ?? d.id ?? d.vehicleId ?? d.bus?.id)
      const lat = d.lat ?? d.latitude ?? d.coords?.lat
      const lng = d.lng ?? d.longitude ?? d.coords?.lng ?? d.lon
      const speed = typeof d.speed === 'number' ? d.speed : undefined
      if (!id && lat == null && lng == null && speed == null) return
      setBuses((prev) => prev.map((b) => {
        if ((b.id + '') !== (id + '')) return b
        const nextLat = (typeof lat === 'number') ? lat : b.lat
        const nextLng = (typeof lng === 'number') ? lng : b.lng
        const nextSpeed = (typeof speed === 'number') ? speed : b.speed || 0
        const nextStatus = (nextSpeed > 0) ? 'running' : (b.status === 'incident' ? 'incident' : 'idle')
        return { ...b, lat: nextLat, lng: nextLng, speed: nextSpeed, status: nextStatus }
      }))
    }
    window.addEventListener('busPositionUpdate', handler as EventListener)
    window.addEventListener('busLocationUpdate', handler as EventListener)
    return () => {
      window.removeEventListener('busPositionUpdate', handler as EventListener)
      window.removeEventListener('busLocationUpdate', handler as EventListener)
    }
  }, [])

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Theo dõi Real-time</h1>
          <p className="text-muted-foreground mt-1">Giám sát vị trí và trạng thái xe buýt trực tiếp</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Bản đồ theo dõi</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-primary text-primary">
                      <div className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />
                      Live
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <MapView
                  buses={buses as any}
                  selectedBus={selectedBus as any}
                  onSelectBus={(b: any) => setSelectedBus(b)}
                  height="650px"
                  followFirstMarker
                  autoFitOnUpdate
                />
              </CardContent>
            </Card>
          </div>

          {/* Bus List & Details */}
          <div className="space-y-6">
            {/* Bus List */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Xe đang hoạt động ({buses.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {buses.map((bus) => (
                      <Card
                        key={bus.id}
                        className={`border cursor-pointer transition-all ${
                          selectedBus && selectedBus.id === bus.id
                            ? "border-primary bg-primary/5"
                            : "border-border/50 hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedBus(bus)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-foreground">{bus.plateNumber}</p>
                              <p className="text-xs text-muted-foreground">{bus.route}</p>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                bus.status === "running"
                                  ? "border-primary text-primary"
                                  : bus.status === "late"
                                    ? "border-warning text-warning"
                                    : bus.status === "incident"
                                      ? "border-destructive text-destructive"
                                      : "border-muted-foreground text-muted-foreground"
                              }
                            >
                              {bus.status === "running"
                                ? "Đang chạy"
                                : bus.status === "late"
                                  ? "Trễ"
                                  : bus.status === "incident"
                                    ? "Sự cố"
                                    : "Đứng yên"}
                            </Badge>
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Navigation className="w-3 h-3" />
                              {bus.speed} km/h
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="w-3 h-3" />
                              {bus.students} học sinh
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  bus.status === "running"
                                    ? "bg-primary"
                                    : bus.status === "late"
                                      ? "bg-warning"
                                      : "bg-destructive"
                                }`}
                                style={{ width: `${bus.progress}%` }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Selected Bus Details */}
        {selectedBus && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Chi tiết xe {selectedBus.plateNumber}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Driver Info */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Tài xế</p>
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={`/.jpg?height=40&width=40&query=${selectedBus.driver || ''}`} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {(selectedBus.driver || 'T')[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{selectedBus.driver || '-'}</p>
                    <p className="text-xs text-muted-foreground">{selectedBus.driverPhone || '-'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Phone className="w-3 h-3 mr-2" />
                    Gọi
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    <MessageSquare className="w-3 h-3 mr-2" />
                    Nhắn
                  </Button>
                </div>
              </div>

              {/* Current Location */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Vị trí hiện tại</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{selectedBus.currentStop || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Navigation className="w-4 h-4" />
                    <span className="text-sm">Tiếp theo: {selectedBus.nextStop || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">ETA: {selectedBus.eta || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Trip Stats */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Thống kê chuyến đi</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tốc độ</span>
                    <span className="text-sm font-medium">{selectedBus.speed || 0} km/h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Học sinh</span>
                    <span className="text-sm font-medium">{selectedBus.students || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tiến độ</span>
                    <span className="text-sm font-medium">{selectedBus.progress || 0}%</span>
                  </div>
                </div>
              </div>

              {/* Recent Events */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Sự kiện gần đây</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-success mt-1.5" />
                    <div>
                      <p className="text-xs font-medium">Đã đón 5 học sinh</p>
                      <p className="text-xs text-muted-foreground">2 phút trước</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                    <div>
                      <p className="text-xs font-medium">Rời điểm dừng 3</p>
                      <p className="text-xs text-muted-foreground">5 phút trước</p>
                    </div>
                  </div>
                  {selectedBus.status === "incident" && (
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-destructive mt-1.5" />
                      <div>
                        <p className="text-xs font-medium">Báo cáo sự cố: Kẹt xe</p>
                        <p className="text-xs text-muted-foreground">12 phút trước</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
