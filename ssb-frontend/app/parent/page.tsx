"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ParentSidebar } from "@/components/parent/parent-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, Phone, CheckCircle2, AlertCircle } from "lucide-react"

export default function ParentDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [busLocation, setBusLocation] = useState({ lat: 21.0285, lng: 105.8542 })

  useEffect(() => {
    if (user && user.role !== "parent") {
      router.push(`/${user.role}`)
    }
  }, [user, router])

  useEffect(() => {
    const interval = setInterval(() => {
      setBusLocation((prev) => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.001,
        lng: prev.lng + (Math.random() - 0.5) * 0.001,
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  if (!user || user.role !== "parent") {
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
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-[500px] bg-muted/30 rounded-lg overflow-hidden">
                {/* Map placeholder with animated bus marker */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="relative inline-block">
                      <div className="w-16 h-16 rounded-full bg-primary/20 animate-ping absolute inset-0" />
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center relative">
                        <MapPin className="w-8 h-8 text-primary-foreground" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">Xe buýt {childInfo.busNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Lat: {busLocation.lat.toFixed(4)}, Lng: {busLocation.lng.toFixed(4)}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        Cập nhật 3 giây trước
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Route visualization */}
                <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-xs">
                  <h4 className="font-semibold text-sm mb-3 text-foreground">Lộ trình hôm nay</h4>
                  <div className="space-y-3">
                    {[
                      { name: "Điểm đón 1", time: "07:00", status: "completed" },
                      { name: "Điểm đón 2", time: "07:10", status: "completed" },
                      { name: "Điểm đón 3", time: "07:15", status: "current" },
                      { name: "Điểm đón 4", time: "07:25", status: "upcoming" },
                      { name: "Trường học", time: "07:45", status: "upcoming" },
                    ].map((stop, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                            stop.status === "completed"
                              ? "bg-green-500/20 text-green-700"
                              : stop.status === "current"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{stop.name}</p>
                          <p className="text-xs text-muted-foreground">{stop.time}</p>
                        </div>
                        {stop.status === "completed" && (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                        {stop.status === "current" && (
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
