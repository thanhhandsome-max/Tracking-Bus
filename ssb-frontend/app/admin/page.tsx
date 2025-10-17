"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bus, AlertTriangle, Clock, TrendingUp, MapPin, Users, ArrowRight, Activity } from "lucide-react"
import { StatsCard } from "@/components/admin/stats-card"
import { ActivityFeed } from "@/components/admin/activity-feed"
import { PerformanceChart } from "@/components/admin/performance-chart"
import { BusStatusChart } from "@/components/admin/bus-status-chart"
import { MiniMap } from "@/components/admin/mini-map"

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push(`/${user.role}`)
    }
  }, [user, router])

  if (!user || user.role !== "admin") {
    return null
  }

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tổng quan</h1>
            <p className="text-muted-foreground mt-1">Theo dõi hoạt động xe buýt trong thời gian thực</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Activity className="w-4 h-4 mr-2" />
              Xuất báo cáo
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <MapPin className="w-4 h-4 mr-2" />
              Xem bản đồ đầy đủ
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Chuyến đang hoạt động"
            value="12"
            change="+2 so với hôm qua"
            trend="up"
            icon={Bus}
            iconColor="text-primary"
          />
          <StatsCard
            title="Xe đang trễ"
            value="3"
            change="Trung bình 5 phút"
            trend="neutral"
            icon={Clock}
            iconColor="text-warning"
          />
          <StatsCard
            title="Sự cố trong ngày"
            value="1"
            change="Xe R05 - Kẹt xe"
            trend="down"
            icon={AlertTriangle}
            iconColor="text-destructive"
          />
          <StatsCard
            title="Tỷ lệ đúng giờ"
            value="94.5%"
            change="+2.3% so với tuần trước"
            trend="up"
            icon={TrendingUp}
            iconColor="text-success"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Chart */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Hiệu suất tuần này</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      7 ngày qua
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <PerformanceChart />
              </CardContent>
            </Card>

            {/* Bus Status Distribution */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Trạng thái xe buýt</CardTitle>
              </CardHeader>
              <CardContent>
                <BusStatusChart />
              </CardContent>
            </Card>

            {/* Real-time Map Preview */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Bản đồ theo dõi Real-time</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => router.push("/admin/tracking")}>
                    Xem đầy đủ
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <MiniMap />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity Feed */}
          <div className="space-y-6">
            <ActivityFeed />

            {/* Quick Stats */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Thống kê nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bus className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Tổng số xe</p>
                      <p className="text-xs text-muted-foreground">Đang hoạt động</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">24</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Học sinh</p>
                      <p className="text-xs text-muted-foreground">Đang trên xe</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">342</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Tuyến đường</p>
                      <p className="text-xs text-muted-foreground">Đang hoạt động</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">8</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
