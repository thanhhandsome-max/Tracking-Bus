"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ParentSidebar } from "@/components/parent/parent-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, CheckCircle2, XCircle, Search } from "lucide-react"

export default function ParentHistory() {
  const { user } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (user && user.role !== "parent") {
      router.push(`/${user.role}`)
    }
  }, [user, router])

  if (!user || user.role !== "parent") {
    return null
  }

  // Mock trip history data
  const tripHistory = [
    {
      id: 1,
      date: "2024-01-15",
      type: "morning",
      busNumber: "29B-12345",
      driverName: "Trần Văn Hùng",
      pickupTime: "07:15",
      actualPickupTime: "07:17",
      dropoffTime: "07:45",
      actualDropoffTime: "07:48",
      status: "completed",
      delay: 2,
    },
    {
      id: 2,
      date: "2024-01-15",
      type: "afternoon",
      busNumber: "29B-12345",
      driverName: "Trần Văn Hùng",
      pickupTime: "16:30",
      actualPickupTime: "16:30",
      dropoffTime: "17:00",
      actualDropoffTime: "17:02",
      status: "completed",
      delay: 0,
    },
    {
      id: 3,
      date: "2024-01-14",
      type: "morning",
      busNumber: "29B-12345",
      driverName: "Trần Văn Hùng",
      pickupTime: "07:15",
      actualPickupTime: "07:15",
      dropoffTime: "07:45",
      actualDropoffTime: "07:43",
      status: "completed",
      delay: 0,
    },
    {
      id: 4,
      date: "2024-01-14",
      type: "afternoon",
      busNumber: "29B-12345",
      driverName: "Trần Văn Hùng",
      pickupTime: "16:30",
      actualPickupTime: null,
      dropoffTime: "17:00",
      actualDropoffTime: null,
      status: "absent",
      delay: 0,
    },
    {
      id: 5,
      date: "2024-01-13",
      type: "morning",
      busNumber: "29B-12345",
      driverName: "Trần Văn Hùng",
      pickupTime: "07:15",
      actualPickupTime: "07:20",
      dropoffTime: "07:45",
      actualDropoffTime: "07:52",
      status: "completed",
      delay: 5,
    },
  ]

  const stats = {
    totalTrips: 48,
    onTimeRate: 92,
    avgDelay: 2,
    absences: 2,
  }

  return (
    <DashboardLayout sidebar={<ParentSidebar />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lịch sử chuyến đi</h1>
          <p className="text-muted-foreground mt-1">Xem lại các chuyến đi của con bạn</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng chuyến đi</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.totalTrips}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tỷ lệ đúng giờ</p>
                  <p className="text-2xl font-bold text-green-500 mt-1">{stats.onTimeRate}%</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Trễ trung bình</p>
                  <p className="text-2xl font-bold text-orange-500 mt-1">{stats.avgDelay} phút</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vắng mặt</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.absences}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trip History Table */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Danh sách chuyến đi</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo ngày..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tripHistory.map((trip) => (
                <div
                  key={trip.id}
                  className="p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          {trip.date}
                        </Badge>
                        <Badge variant={trip.type === "morning" ? "default" : "secondary"}>
                          {trip.type === "morning" ? "Buổi sáng" : "Buổi chiều"}
                        </Badge>
                        {trip.status === "completed" && (
                          <Badge variant="default" className="bg-green-500/20 text-green-700 hover:bg-green-500/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Hoàn thành
                          </Badge>
                        )}
                        {trip.status === "absent" && (
                          <Badge variant="default" className="bg-red-500/20 text-red-700 hover:bg-red-500/30">
                            <XCircle className="w-3 h-3 mr-1" />
                            Vắng mặt
                          </Badge>
                        )}
                        {trip.delay > 0 && (
                          <Badge variant="default" className="bg-orange-500/20 text-orange-700 hover:bg-orange-500/30">
                            Trễ {trip.delay} phút
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Xe buýt</p>
                          <p className="font-medium text-foreground">{trip.busNumber}</p>
                          <p className="text-xs text-muted-foreground">{trip.driverName}</p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-muted-foreground">Thời gian đón</p>
                          <p className="font-medium text-foreground">{trip.actualPickupTime || "Không có"}</p>
                          <p className="text-xs text-muted-foreground">Dự kiến: {trip.pickupTime}</p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-muted-foreground">Thời gian trả</p>
                          <p className="font-medium text-foreground">{trip.actualDropoffTime || "Không có"}</p>
                          <p className="text-xs text-muted-foreground">Dự kiến: {trip.dropoffTime}</p>
                        </div>
                      </div>
                    </div>

                    <Button variant="ghost" size="sm">
                      Chi tiết
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
