"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ParentSidebar } from "@/components/parent/parent-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, AlertCircle, Info, MapPin, Clock, Bell, BellOff, Trash2 } from "lucide-react"

export default function ParentNotifications() {
  const { user } = useAuth()
  const router = useRouter()
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    if (user && user.role !== "parent") {
      router.push(`/${user.role}`)
    }
  }, [user, router])

  if (!user || user.role !== "parent") {
    return null
  }

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      type: "success",
      title: "Đã đón con bạn",
      message: "Con bạn đã được đón lúc 07:17 tại Điểm đón 3",
      time: "5 phút trước",
      date: "2024-01-15",
      read: false,
      icon: CheckCircle2,
    },
    {
      id: 2,
      type: "info",
      title: "Xe buýt đang trên đường",
      message: "Xe buýt 29B-12345 đang di chuyển đến điểm đón của bạn",
      time: "15 phút trước",
      date: "2024-01-15",
      read: false,
      icon: MapPin,
    },
    {
      id: 3,
      type: "warning",
      title: "Xe buýt chậm 3 phút",
      message: "Do tắc đường, xe buýt sẽ đến muộn khoảng 3 phút",
      time: "20 phút trước",
      date: "2024-01-15",
      read: false,
      icon: AlertCircle,
    },
    {
      id: 4,
      type: "success",
      title: "Đã trả con bạn",
      message: "Con bạn đã được trả an toàn lúc 17:02 tại Điểm trả 3",
      time: "2 giờ trước",
      date: "2024-01-14",
      read: true,
      icon: CheckCircle2,
    },
    {
      id: 5,
      type: "info",
      title: "Thay đổi lịch trình",
      message: "Lịch trình ngày mai sẽ thay đổi do bảo trì xe buýt",
      time: "1 ngày trước",
      date: "2024-01-14",
      read: true,
      icon: Info,
    },
  ]

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <DashboardLayout sidebar={<ParentSidebar />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Thông báo</h1>
            <p className="text-muted-foreground mt-1">Nhận thông báo về chuyến đi của con bạn</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Bell className="w-4 h-4" />
              Đánh dấu đã đọc
            </Button>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Trash2 className="w-4 h-4" />
              Xóa tất cả
            </Button>
          </div>
        </div>

        {/* Notification Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Chưa đọc</p>
                  <p className="text-2xl font-bold text-primary mt-1">{unreadCount}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Hôm nay</p>
                  <p className="text-2xl font-bold text-foreground mt-1">3</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng cộng</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{notifications.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <BellOff className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Danh sách thông báo</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-4">
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="success">Thành công</TabsTrigger>
                <TabsTrigger value="warning">Cảnh báo</TabsTrigger>
                <TabsTrigger value="info">Thông tin</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3 mt-6">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                      notification.read ? "border-border/50 bg-muted/20" : "border-primary/50 bg-primary/5"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          notification.type === "success"
                            ? "bg-green-500/10"
                            : notification.type === "warning"
                              ? "bg-orange-500/10"
                              : "bg-primary/10"
                        }`}
                      >
                        <notification.icon
                          className={`w-5 h-5 ${
                            notification.type === "success"
                              ? "text-green-500"
                              : notification.type === "warning"
                                ? "text-orange-500"
                                : "text-primary"
                          }`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-foreground">{notification.title}</h4>
                              {!notification.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="success" className="space-y-3 mt-6">
                {notifications
                  .filter((n) => n.type === "success")
                  .map((notification) => (
                    <div key={notification.id} className="p-4 rounded-lg border border-border/50 bg-muted/20">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                          <notification.icon className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </TabsContent>

              <TabsContent value="warning" className="space-y-3 mt-6">
                {notifications
                  .filter((n) => n.type === "warning")
                  .map((notification) => (
                    <div key={notification.id} className="p-4 rounded-lg border border-border/50 bg-muted/20">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                          <notification.icon className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </TabsContent>

              <TabsContent value="info" className="space-y-3 mt-6">
                {notifications
                  .filter((n) => n.type === "info")
                  .map((notification) => (
                    <div key={notification.id} className="p-4 rounded-lg border border-border/50 bg-muted/20">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <notification.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
