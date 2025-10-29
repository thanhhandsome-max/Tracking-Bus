"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DriverSidebar } from "@/components/driver/driver-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Users, Play } from "lucide-react"

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

  useEffect(() => {
    if (user && user.role?.toLowerCase() !== "driver") {
      const userRole = user.role?.toLowerCase()
      if (userRole === "admin" || userRole === "parent") {
        router.push(`/${userRole}`)
      }
    }
  }, [user, router])

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

        {/* Today's Trips */}
        <div className="space-y-5">
          <h2 className="text-xl font-semibold text-foreground">Chuyến đi hôm nay</h2>
          {todayTrips.map((trip) => (
            <Card key={trip.id} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-foreground">{trip.route}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {trip.startTime} - {trip.endTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {trip.stops} điểm dừng
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {trip.students} học sinh
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-primary text-primary">
                    Đã lên lịch
                  </Badge>
                </div>

                <Button
                  className="w-full bg-primary hover:bg-primary/90 cursor-pointer"
                  onClick={() => router.push(`/driver/trip/${trip.id}`)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Bắt đầu chuyến đi
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
