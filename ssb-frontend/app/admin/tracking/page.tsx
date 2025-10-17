"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MapPin, Clock, Users, Navigation, Phone, MessageSquare } from "lucide-react"
import { TrackingMap } from "@/components/admin/tracking-map"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const mockBuses = [
  {
    id: "1",
    plateNumber: "51A-12345",
    route: "Tuyến 1",
    driver: "Nguyễn Văn A",
    driverPhone: "0901234567",
    status: "running",
    speed: 35,
    students: 28,
    currentStop: "Điểm 3",
    nextStop: "Điểm 4",
    eta: "5 phút",
    progress: 60,
    lat: 10.762622,
    lng: 106.660172,
  },
  {
    id: "2",
    plateNumber: "51B-67890",
    route: "Tuyến 3",
    driver: "Trần Văn B",
    driverPhone: "0912345678",
    status: "late",
    speed: 28,
    students: 24,
    currentStop: "Điểm 2",
    nextStop: "Điểm 3",
    eta: "8 phút (Trễ 6 phút)",
    progress: 40,
    lat: 10.772622,
    lng: 106.670172,
  },
  {
    id: "3",
    plateNumber: "51D-22222",
    route: "Tuyến 5",
    driver: "Phạm Văn D",
    driverPhone: "0934567890",
    status: "incident",
    speed: 0,
    students: 32,
    currentStop: "Điểm 5",
    nextStop: "Điểm 6",
    eta: "Đang xử lý sự cố",
    progress: 50,
    lat: 10.752622,
    lng: 106.650172,
  },
  {
    id: "4",
    plateNumber: "51E-33333",
    route: "Tuyến 7",
    driver: "Lê Thị C",
    driverPhone: "0923456789",
    status: "running",
    speed: 40,
    students: 26,
    currentStop: "Điểm 6",
    nextStop: "Trường",
    eta: "3 phút",
    progress: 85,
    lat: 10.742622,
    lng: 106.640172,
  },
]

export default function TrackingPage() {
  const [selectedBus, setSelectedBus] = useState(mockBuses[0])

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
                <TrackingMap buses={mockBuses} selectedBus={selectedBus} onSelectBus={setSelectedBus} />
              </CardContent>
            </Card>
          </div>

          {/* Bus List & Details */}
          <div className="space-y-6">
            {/* Bus List */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Xe đang hoạt động ({mockBuses.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {mockBuses.map((bus) => (
                      <Card
                        key={bus.id}
                        className={`border cursor-pointer transition-all ${
                          selectedBus.id === bus.id
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
                                    : "border-destructive text-destructive"
                              }
                            >
                              {bus.status === "running" ? "Đang chạy" : bus.status === "late" ? "Trễ" : "Sự cố"}
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
                    <AvatarImage src={`/.jpg?height=40&width=40&query=${selectedBus.driver}`} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedBus.driver.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{selectedBus.driver}</p>
                    <p className="text-xs text-muted-foreground">{selectedBus.driverPhone}</p>
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
                    <span className="text-sm font-medium">{selectedBus.currentStop}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Navigation className="w-4 h-4" />
                    <span className="text-sm">Tiếp theo: {selectedBus.nextStop}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">ETA: {selectedBus.eta}</span>
                  </div>
                </div>
              </div>

              {/* Trip Stats */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Thống kê chuyến đi</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tốc độ</span>
                    <span className="text-sm font-medium">{selectedBus.speed} km/h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Học sinh</span>
                    <span className="text-sm font-medium">{selectedBus.students}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tiến độ</span>
                    <span className="text-sm font-medium">{selectedBus.progress}%</span>
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
      </div>
    </DashboardLayout>
  )
}
