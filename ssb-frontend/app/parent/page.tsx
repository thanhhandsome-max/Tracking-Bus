"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ParentSidebar } from "@/components/parent/parent-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, Phone, CheckCircle2, AlertCircle, TriangleAlert } from "lucide-react"
import { MapView } from "@/components/tracking/MapView"
import { apiClient } from "@/lib/api"
import { useTripBusPosition, useTripAlerts } from "@/hooks/use-socket"
import { useToast } from "@/hooks/use-toast"

export default function ParentDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  // For testing we track a fixed trip room (match backend test script)
  const TRIP_ID = 42
  const { busPosition } = useTripBusPosition(TRIP_ID)
  const [busLocation, setBusLocation] = useState<{ lat: number; lng: number }>({ lat: 21.0285, lng: 105.8542 })
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)
  const { toast } = useToast()
  const { approachStop, delayAlert } = useTripAlerts(TRIP_ID)
  const [banner, setBanner] = useState<{ type: 'info' | 'warning'; title: string; description?: string } | null>(null)
  const [stops, setStops] = useState<{ id: string; lat: number; lng: number; label?: string }[]>([])
  const [busInfo, setBusInfo] = useState<{ id: string; plateNumber: string; route: string } | null>(null)

  useEffect(() => {
    if (user && user.role?.toLowerCase() !== "parent") {
      const userRole = user.role?.toLowerCase()
      if (userRole === "admin" || userRole === "driver") {
        router.push(`/${userRole}`)
      }
    }
  }, [user, router])

  // Update local position whenever realtime event arrives
  useEffect(() => {
    if (busPosition && Number.isFinite(busPosition.lat) && Number.isFinite(busPosition.lng)) {
      console.log('[Parent] busPosition', busPosition)
      setBusLocation({ lat: busPosition.lat, lng: busPosition.lng })
      setLastUpdate(Date.now())
    }
  }, [busPosition])

  // Day 4: show alerts for approach_stop & delay_alert
  useEffect(() => {
    if (approachStop) {
      toast({
        title: 'Xe sắp đến điểm dừng',
        description: `Trip ${TRIP_ID} sắp đến điểm ${approachStop.stopName || approachStop.stopId || ''}`,
      })
      setBanner({ type: 'info', title: 'Xe sắp đến điểm dừng', description: approachStop.stopName || `Điểm ${approachStop.stopId || ''}` })
    }
  }, [approachStop, toast])
  useEffect(() => {
    if (delayAlert) {
      toast({
        title: 'Cảnh báo trễ chuyến',
        description: delayAlert.reason || 'Xe có thể đến trễ',
        variant: 'destructive',
      })
      setBanner({ type: 'warning', title: 'Cảnh báo trễ chuyến', description: delayAlert.reason || undefined })
    }
  }, [delayAlert, toast])

  // Load child's route/bus info from API (best effort, structure may vary)
  useEffect(() => {
    async function load() {
      try {
        // Try to get a route by id=1 as fallback demo; in real flow, query student's assigned route
        try {
          const routeRes = await apiClient.getRouteById(1)
          const routeData: any = (routeRes as any).data || routeRes
          const points: any[] = routeData?.diemDung || routeData?.route?.diemDung || []
          const mapped = points.map((s: any) => ({ id: (s.maDiem || s.id || `${s.viDo}_${s.kinhDo}`) + '', lat: Number(s.viDo || s.lat || s.latitude), lng: Number(s.kinhDo || s.lng || s.longitude), label: s.tenDiem || s.ten }))
          setStops(mapped.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)))
        } catch {}
        setBusInfo({ id: '5', plateNumber: '29B-12345', route: `Trip ${TRIP_ID}` })
      } catch (e) {
        console.warn('Parent route load failed', e)
      }
    }
    load()
  }, [])

  if (!user || user.role?.toLowerCase() !== "parent") {
    return null
  }

  // Mock data for parent's child
  const childInfo = {
    name: "Nguyễn Minh An",
    grade: "Lớp 3A",
    status: "on-bus",
    busNumber: "29B-12345",
    driverName: "Trần Văn Hùng",
    driverPhone: "0912345678",
    pickupTime: "07:15",
    dropoffTime: "16:30",
    currentStop: "Điểm đón 3/5",
    estimatedArrival: "5 phút",
  }

  return (
    <DashboardLayout sidebar={<ParentSidebar />}>
      <div className="space-y-6">
        {banner && (
          <div
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              banner.type === 'warning'
                ? 'bg-orange-500/10 border-orange-300 text-orange-800'
                : 'bg-primary/10 border-primary/30 text-primary'
            }`}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/40">
              {banner.type === 'warning' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <TriangleAlert className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{banner.title}</div>
              {banner.description && (
                <div className="text-xs opacity-90 mt-0.5">{banner.description}</div>
              )}
            </div>
            <button
              onClick={() => setBanner(null)}
              className="text-xs underline opacity-80 hover:opacity-100"
            >
              Đóng
            </button>
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Theo dõi xe buýt</h1>
          <p className="text-muted-foreground mt-1">Xem vị trí xe buýt của con bạn trong thời gian thực</p>
        </div>

        {/* Child Status Card */}
        <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{childInfo.name}</h3>
                  <p className="text-sm text-muted-foreground">{childInfo.grade}</p>
                </div>
                <div className="flex items-center gap-2">
                  {childInfo.status === "on-bus" && (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <Badge variant="default" className="bg-green-500/20 text-green-700 hover:bg-green-500/30">
                        Đang trên xe
                      </Badge>
                    </>
                  )}
                  {childInfo.status === "picked-up" && (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <Badge variant="default" className="bg-green-500/20 text-green-700 hover:bg-green-500/30">
                        Đã đón
                      </Badge>
                    </>
                  )}
                  {childInfo.status === "waiting" && (
                    <>
                      <Clock className="w-4 h-4 text-orange-500" />
                      <Badge variant="default" className="bg-orange-500/20 text-orange-700 hover:bg-orange-500/30">
                        Đang chờ
                      </Badge>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{childInfo.currentStop}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Còn {childInfo.estimatedArrival}</span>
                  </div>
                </div>
              </div>
              <Button size="sm" className="gap-2">
                <Phone className="w-4 h-4" />
                Gọi tài xế
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Real-time Map */}
          <Card className="lg:col-span-2 border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Vị trí xe buýt
                  <Badge variant="outline" className="ml-2">Trip {TRIP_ID}</Badge>
                  {lastUpdate && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      Cập nhật: {new Date(lastUpdate).toLocaleTimeString()} | ({busLocation.lat.toFixed(5)}, {busLocation.lng.toFixed(5)})
                    </span>
                  )}
              </CardTitle>
            </CardHeader>
            <CardContent>
                  {/* Replace placeholder with Leaflet MapView */}
                  <MapView
                    buses={[{ id: busInfo?.id || '5', plateNumber: busInfo?.plateNumber || childInfo.busNumber, route: busInfo?.route || `Trip ${TRIP_ID}`, status: 'running', lat: busLocation.lat, lng: busLocation.lng, speed: 30, students: 12 }] as any}
                    stops={stops}
                    height="500px"
                    followFirstMarker
                    autoFitOnUpdate
                  />
                </CardContent>
          </Card>

          {/* Right sidebar with schedule and notifications */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Lịch trình hôm nay</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">Đón sáng</p>
                      <p className="text-xs text-muted-foreground mt-1">{childInfo.pickupTime} - Điểm đón 3</p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        Xe buýt {childInfo.busNumber}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">Trả chiều</p>
                      <p className="text-xs text-muted-foreground mt-1">{childInfo.dropoffTime} - Điểm trả 3</p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        Xe buýt {childInfo.busNumber}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tài xế</span>
                    <span className="font-medium text-foreground">{childInfo.driverName}</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3 gap-2 bg-transparent">
                    <Phone className="w-4 h-4" />
                    {childInfo.driverPhone}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Thông báo gần đây</span>
                  <Badge variant="secondary" className="text-xs">
                    3 mới
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      type: "success",
                      title: "Đã đón con bạn",
                      time: "5 phút trước",
                      icon: CheckCircle2,
                    },
                    {
                      type: "info",
                      title: "Xe buýt đang trên đường",
                      time: "15 phút trước",
                      icon: MapPin,
                    },
                    {
                      type: "warning",
                      title: "Xe buýt chậm 3 phút",
                      time: "20 phút trước",
                      icon: AlertCircle,
                    },
                  ].map((notification, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          notification.type === "success"
                            ? "bg-green-500/10"
                            : notification.type === "warning"
                              ? "bg-orange-500/10"
                              : "bg-primary/10"
                        }`}
                      >
                        <notification.icon
                          className={`w-4 h-4 ${
                            notification.type === "success"
                              ? "text-green-500"
                              : notification.type === "warning"
                                ? "text-orange-500"
                                : "text-primary"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-3">
                  Xem tất cả thông báo
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
