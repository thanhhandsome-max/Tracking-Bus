"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, CheckCircle, AlertTriangle, Clock, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

const notifications = [
  {
    id: "1",
    type: "warning",
    title: "Xe R03 trễ 6 phút",
    description: "Tuyến Quận 1 - Quận 3, dự kiến đến trễ",
    time: "5 phút trước",
    read: false,
  },
  {
    id: "2",
    type: "danger",
    title: "Sự cố: Xe R05 kẹt xe",
    description: "Tài xế đã báo cáo tình trạng kẹt xe nghiêm trọng",
    time: "12 phút trước",
    read: false,
  },
  {
    id: "3",
    type: "success",
    title: "Xe R01 hoàn thành chuyến",
    description: "Đã trả 28 học sinh an toàn",
    time: "15 phút trước",
    read: true,
  },
  {
    id: "4",
    type: "info",
    title: "Phụ huynh yêu cầu đổi điểm đón",
    description: "Học sinh Nguyễn Văn A - Lớp 5B",
    time: "22 phút trước",
    read: false,
  },
  {
    id: "5",
    type: "success",
    title: "Tài xế Nguyễn Văn A đăng nhập",
    description: "Bắt đầu ca làm việc sáng",
    time: "1 giờ trước",
    read: true,
  },
]

export default function NotificationsPage() {
  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Thông báo & Cảnh báo</h1>
            <p className="text-muted-foreground mt-1">Theo dõi các thông báo và cảnh báo hệ thống</p>
          </div>
          <Button variant="outline">
            <CheckCircle className="w-4 h-4 mr-2" />
            Đánh dấu tất cả đã đọc
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-foreground">3</div>
                  <p className="text-sm text-muted-foreground">Chưa đọc</p>
                </div>
                <Bell className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-warning">2</div>
                  <p className="text-sm text-muted-foreground">Cảnh báo</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-destructive">1</div>
                  <p className="text-sm text-muted-foreground">Khẩn cấp</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-success">2</div>
                  <p className="text-sm text-muted-foreground">Thành công</p>
                </div>
                <CheckCircle className="w-8 h-8 text-success" />
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
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="unread">Chưa đọc (3)</TabsTrigger>
                <TabsTrigger value="warning">Cảnh báo</TabsTrigger>
                <TabsTrigger value="success">Thành công</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className={cn(
                          "border transition-colors",
                          notification.read ? "border-border/50 bg-muted/20" : "border-primary/30 bg-card",
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                notification.type === "success" && "bg-success/10",
                                notification.type === "warning" && "bg-warning/10",
                                notification.type === "danger" && "bg-destructive/10",
                                notification.type === "info" && "bg-primary/10",
                              )}
                            >
                              {notification.type === "success" && <CheckCircle className="w-5 h-5 text-success" />}
                              {notification.type === "warning" && <Clock className="w-5 h-5 text-warning" />}
                              {notification.type === "danger" && <AlertTriangle className="w-5 h-5 text-destructive" />}
                              {notification.type === "info" && <Info className="w-5 h-5 text-primary" />}
                            </div>

                            <div className="flex-1 space-y-1">
                              <div className="flex items-start justify-between">
                                <h4 className="font-medium text-foreground">{notification.title}</h4>
                                {!notification.read && (
                                  <Badge variant="outline" className="border-primary text-primary ml-2">
                                    Mới
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{notification.description}</p>
                              <p className="text-xs text-muted-foreground">{notification.time}</p>
                            </div>

                            <Button variant="ghost" size="icon" className="flex-shrink-0">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="unread">
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {notifications
                      .filter((n) => !n.read)
                      .map((notification) => (
                        <Card key={notification.id} className="border-primary/30 bg-card">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                  notification.type === "success" && "bg-success/10",
                                  notification.type === "warning" && "bg-warning/10",
                                  notification.type === "danger" && "bg-destructive/10",
                                  notification.type === "info" && "bg-primary/10",
                                )}
                              >
                                {notification.type === "success" && <CheckCircle className="w-5 h-5 text-success" />}
                                {notification.type === "warning" && <Clock className="w-5 h-5 text-warning" />}
                                {notification.type === "danger" && (
                                  <AlertTriangle className="w-5 h-5 text-destructive" />
                                )}
                                {notification.type === "info" && <Info className="w-5 h-5 text-primary" />}
                              </div>

                              <div className="flex-1 space-y-1">
                                <h4 className="font-medium text-foreground">{notification.title}</h4>
                                <p className="text-sm text-muted-foreground">{notification.description}</p>
                                <p className="text-xs text-muted-foreground">{notification.time}</p>
                              </div>

                              <Button variant="ghost" size="icon" className="flex-shrink-0">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
