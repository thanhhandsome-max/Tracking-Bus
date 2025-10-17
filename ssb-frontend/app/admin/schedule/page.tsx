"use client"

import { useState } from "react"
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
import { Plus, CalendarIcon, Bus, User } from "lucide-react"
import { ScheduleForm } from "@/components/admin/schedule-form"

const mockSchedules = [
  {
    id: "1",
    date: "2024-01-15",
    route: "Tuyến 1 - Quận 1",
    bus: "51A-12345",
    driver: "Nguyễn Văn A",
    startTime: "06:30",
    status: "scheduled",
  },
  {
    id: "2",
    date: "2024-01-15",
    route: "Tuyến 3 - Quận 3",
    bus: "51B-67890",
    driver: "Trần Văn B",
    startTime: "06:45",
    status: "scheduled",
  },
  {
    id: "3",
    date: "2024-01-15",
    route: "Tuyến 5 - Quận 5",
    bus: "51D-22222",
    driver: "Phạm Văn D",
    startTime: "07:00",
    status: "scheduled",
  },
]

export default function SchedulePage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

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
              <ScheduleForm onClose={() => setIsAddDialogOpen(false)} />
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
                {mockSchedules.map((schedule) => (
                  <Card key={schedule.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-foreground">{schedule.route}</h4>
                          <p className="text-sm text-muted-foreground mt-1">Khởi hành: {schedule.startTime}</p>
                        </div>
                        <Badge variant="outline" className="border-primary text-primary">
                          Đã lên lịch
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
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                          <Bus className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm font-medium">12 xe</p>
                        <p className="text-xs text-muted-foreground">Sẵn sàng</p>
                      </div>
                    </div>

                    <div className="p-4 border border-border rounded-lg hover:border-success/50 transition-colors cursor-pointer">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
                          <User className="w-6 h-6 text-success" />
                        </div>
                        <p className="text-sm font-medium">18 tài xế</p>
                        <p className="text-xs text-muted-foreground">Sẵn sàng</p>
                      </div>
                    </div>

                    <div className="p-4 border border-border rounded-lg hover:border-warning/50 transition-colors cursor-pointer">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-2">
                          <CalendarIcon className="w-6 h-6 text-warning" />
                        </div>
                        <p className="text-sm font-medium">8 tuyến</p>
                        <p className="text-xs text-muted-foreground">Hoạt động</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground text-center">
                    Kéo và thả để phân công nhanh tài xế và xe vào tuyến
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
