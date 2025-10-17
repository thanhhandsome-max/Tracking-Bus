"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DriverSidebar } from "@/components/driver/driver-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MapPin,
  Navigation,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Flag,
  Cloud,
  Droplets,
  Wind,
  Fuel,
  Gauge,
  Thermometer,
  MessageSquare,
  Send,
  Phone,
  Navigation2,
  TrendingUp,
  AlertCircle,
  MapPinned,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { IncidentForm } from "@/components/driver/incident-form"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

const mockTrip = {
  id: "1",
  route: "Tuyến 1 - Quận 1",
  startTime: "06:30",
  status: "in-progress",
  currentStop: 2,
  vehicle: {
    plateNumber: "51A-12345",
    fuel: 75,
    speed: 35,
    temperature: 85,
    mileage: 45230,
  },
  weather: {
    temp: 28,
    condition: "Nắng nhẹ",
    humidity: 65,
    wind: 12,
  },
  stops: [
    {
      id: "1",
      name: "Điểm 1",
      address: "123 Nguyễn Huệ, Q1",
      time: "06:30",
      eta: "06:30",
      status: "completed",
      notes: "Đã đón đủ học sinh",
      students: [
        {
          id: "1",
          name: "Nguyễn Văn A",
          status: "picked",
          avatar: "/placeholder.svg?height=40&width=40",
          parent: "0901234567",
        },
        {
          id: "2",
          name: "Trần Thị B",
          status: "picked",
          avatar: "/placeholder.svg?height=40&width=40",
          parent: "0901234568",
        },
      ],
    },
    {
      id: "2",
      name: "Điểm 2",
      address: "456 Lê Lợi, Q1",
      time: "06:38",
      eta: "06:40",
      status: "current",
      notes: "",
      students: [
        {
          id: "3",
          name: "Lê Văn C",
          status: "pending",
          avatar: "/placeholder.svg?height=40&width=40",
          parent: "0901234569",
        },
        {
          id: "4",
          name: "Phạm Thị D",
          status: "pending",
          avatar: "/placeholder.svg?height=40&width=40",
          parent: "0901234570",
        },
        {
          id: "5",
          name: "Hoàng Văn E",
          status: "absent",
          avatar: "/placeholder.svg?height=40&width=40",
          parent: "0901234571",
        },
      ],
    },
    {
      id: "3",
      name: "Điểm 3",
      address: "789 Pasteur, Q1",
      time: "06:45",
      eta: "06:48",
      status: "upcoming",
      notes: "",
      students: [
        {
          id: "6",
          name: "Võ Thị F",
          status: "pending",
          avatar: "/placeholder.svg?height=40&width=40",
          parent: "0901234572",
        },
        {
          id: "7",
          name: "Đặng Văn G",
          status: "pending",
          avatar: "/placeholder.svg?height=40&width=40",
          parent: "0901234573",
        },
      ],
    },
    {
      id: "4",
      name: "Trường TH ABC",
      address: "999 Trần Hưng Đạo, Q1",
      time: "07:00",
      eta: "07:05",
      status: "upcoming",
      notes: "",
      students: [],
    },
  ],
}

const mockMessages = [
  { id: "1", sender: "Admin", message: "Chuyến đi có suôn sẻ không?", time: "06:25", isDriver: false },
  { id: "2", sender: "Tài xế", message: "Vâng, mọi thứ ổn", time: "06:26", isDriver: true },
]

export default function TripDetailPage() {
  const router = useRouter()
  const [trip, setTrip] = useState(mockTrip)
  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = useState(false)
  const [stopNotes, setStopNotes] = useState<Record<string, string>>({})
  const [messages, setMessages] = useState(mockMessages)
  const [newMessage, setNewMessage] = useState("")

  const currentStop = trip.stops[trip.currentStop]
  const progress = ((trip.currentStop + 1) / trip.stops.length) * 100

  const handleStudentCheck = (studentId: string, checked: boolean) => {
    setTrip((prev) => ({
      ...prev,
      stops: prev.stops.map((stop) =>
        stop.id === currentStop.id
          ? {
              ...stop,
              students: stop.students.map((student) =>
                student.id === studentId ? { ...student, status: checked ? "picked" : "pending" } : student,
              ),
            }
          : stop,
      ),
    }))
  }

  const handleMarkAbsent = (studentId: string) => {
    setTrip((prev) => ({
      ...prev,
      stops: prev.stops.map((stop) =>
        stop.id === currentStop.id
          ? {
              ...stop,
              students: stop.students.map((student) =>
                student.id === studentId ? { ...student, status: "absent" } : student,
              ),
            }
          : stop,
      ),
    }))
  }

  const handleArriveStop = () => {
    // Logic to mark arrival at stop
  }

  const handleLeaveStop = () => {
    if (trip.currentStop < trip.stops.length - 1) {
      setTrip((prev) => ({
        ...prev,
        currentStop: prev.currentStop + 1,
        stops: prev.stops.map((stop, index) =>
          index === prev.currentStop
            ? { ...stop, status: "completed" }
            : index === prev.currentStop + 1
              ? { ...stop, status: "current" }
              : stop,
        ),
      }))
    }
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message = {
      id: String(messages.length + 1),
      sender: "Tài xế",
      message: newMessage,
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      isDriver: true,
    }

    setMessages([...messages, message])
    setNewMessage("")
  }

  return (
    <DashboardLayout sidebar={<DriverSidebar />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{trip.route}</h1>
            <p className="text-muted-foreground mt-1">Chuyến đi đang diễn ra</p>
          </div>
          <Dialog open={isIncidentDialogOpen} onOpenChange={setIsIncidentDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10 bg-transparent"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Báo cáo sự cố
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Báo cáo sự cố</DialogTitle>
                <DialogDescription>Mô tả chi tiết sự cố đang gặp phải</DialogDescription>
              </DialogHeader>
              <IncidentForm onClose={() => setIsIncidentDialogOpen(false)} tripId={trip.id} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Nhiên liệu</p>
                  <p className="text-2xl font-bold text-foreground">{trip.vehicle.fuel}%</p>
                </div>
                <Fuel
                  className={`w-8 h-8 ${trip.vehicle.fuel > 50 ? "text-success" : trip.vehicle.fuel > 25 ? "text-warning" : "text-destructive"}`}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tốc độ</p>
                  <p className="text-2xl font-bold text-foreground">{trip.vehicle.speed} km/h</p>
                </div>
                <Gauge className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Nhiệt độ xe</p>
                  <p className="text-2xl font-bold text-foreground">{trip.vehicle.temperature}°C</p>
                </div>
                <Thermometer className={`w-8 h-8 ${trip.vehicle.temperature < 90 ? "text-success" : "text-warning"}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Thời tiết</p>
                  <p className="text-2xl font-bold text-foreground">{trip.weather.temp}°C</p>
                  <p className="text-xs text-muted-foreground">{trip.weather.condition}</p>
                </div>
                <Cloud className="w-8 h-8 text-info" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tiến độ chuyến đi</span>
                <span className="font-medium">
                  {trip.currentStop + 1}/{trip.stops.length} điểm dừng
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Stop */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    {currentStop.name}
                  </CardTitle>
                  <Badge className="bg-primary text-primary-foreground">Điểm hiện tại</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{currentStop.address}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Dự kiến: {currentStop.time}
                  </div>
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <TrendingUp className="w-4 h-4" />
                    ETA: {currentStop.eta}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card className="border-border/50 bg-muted/30">
                  <CardContent className="p-4">
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-success/10" />
                      <div className="relative z-10 text-center space-y-2">
                        <MapPinned className="w-12 h-12 text-primary mx-auto animate-pulse" />
                        <p className="text-sm font-medium text-foreground">Bản đồ thời gian thực</p>
                        <p className="text-xs text-muted-foreground">Khoảng cách: 1.2 km • Thời gian: 3 phút</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <Navigation2 className="w-4 h-4 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Rẽ phải tại đường Lê Lợi</p>
                          <p className="text-xs text-muted-foreground">Sau 200m</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
                        <p className="text-muted-foreground">Lưu ý: Đường đang đông xe</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Students List */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Danh sách học sinh ({currentStop.students.length})</h4>
                  {currentStop.students.map((student) => (
                    <Card key={student.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={student.status === "picked"}
                              onCheckedChange={(checked) => handleStudentCheck(student.id, checked as boolean)}
                              disabled={student.status === "absent"}
                            />
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
                              <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{student.name}</p>
                              <div className="flex items-center gap-2">
                                {student.status === "picked" && (
                                  <p className="text-xs text-success flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Đã đón
                                  </p>
                                )}
                                {student.status === "absent" && (
                                  <p className="text-xs text-warning flex items-center gap-1">
                                    <XCircle className="w-3 h-3" />
                                    Vắng
                                  </p>
                                )}
                                {student.status === "pending" && (
                                  <p className="text-xs text-muted-foreground">Chờ đón</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="bg-transparent">
                              <Phone className="w-4 h-4" />
                            </Button>
                            {student.status === "pending" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAbsent(student.id)}
                                className="text-warning border-warning hover:bg-warning/10"
                              >
                                Đánh dấu vắng
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Ghi chú điểm dừng</h4>
                  <Textarea
                    placeholder="Thêm ghi chú cho điểm dừng này..."
                    value={stopNotes[currentStop.id] || currentStop.notes}
                    onChange={(e) => setStopNotes({ ...stopNotes, [currentStop.id]: e.target.value })}
                    rows={2}
                    className="resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <Button variant="outline" onClick={handleArriveStop} className="bg-transparent">
                    <Navigation className="w-4 h-4 mr-2" />
                    Đến điểm dừng
                  </Button>
                  <Button onClick={handleLeaveStop} className="bg-primary hover:bg-primary/90">
                    Rời điểm dừng
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Liên lạc với Admin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="h-[200px] pr-4">
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.isDriver ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            msg.isDriver ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                          }`}
                        >
                          <p className="text-sm font-medium mb-1">{msg.sender}</p>
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">{msg.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nhập tin nhắn..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage} size="icon" className="bg-primary hover:bg-primary/90">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Route Overview */}
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Tổng quan tuyến đường</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trip.stops.map((stop, index) => (
                    <div key={stop.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                            stop.status === "completed"
                              ? "bg-success text-success-foreground"
                              : stop.status === "current"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {index === trip.stops.length - 1 ? <Flag className="w-4 h-4" /> : index + 1}
                        </div>
                        {index < trip.stops.length - 1 && (
                          <div className={`w-0.5 h-12 ${stop.status === "completed" ? "bg-success" : "bg-border"}`} />
                        )}
                      </div>

                      <div className="flex-1 pb-4">
                        <p className="font-medium text-foreground text-sm">{stop.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{stop.time}</span>
                          {stop.status !== "completed" && (
                            <>
                              <span>•</span>
                              <span className="text-primary">ETA: {stop.eta}</span>
                            </>
                          )}
                        </div>
                        {stop.students.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{stop.students.length} học sinh</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Thống kê</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Đã đón</span>
                  <span className="text-sm font-medium text-success">2 học sinh</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Vắng</span>
                  <span className="text-sm font-medium text-warning">1 học sinh</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Còn lại</span>
                  <span className="text-sm font-medium">5 học sinh</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Chi tiết thời tiết</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-info" />
                    <span className="text-sm text-muted-foreground">Độ ẩm</span>
                  </div>
                  <span className="text-sm font-medium">{trip.weather.humidity}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-info" />
                    <span className="text-sm text-muted-foreground">Gió</span>
                  </div>
                  <span className="text-sm font-medium">{trip.weather.wind} km/h</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-info" />
                    <span className="text-sm text-muted-foreground">Tình trạng</span>
                  </div>
                  <span className="text-sm font-medium">{trip.weather.condition}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
