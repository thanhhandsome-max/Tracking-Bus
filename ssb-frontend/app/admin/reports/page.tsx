"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  FileText,
  Users,
  Bus,
  Clock,
  AlertTriangle,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import apiClient from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("7days")
  const [reportType, setReportType] = useState("overview")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Backend stats
  const [stats, setStats] = useState<{
    totalTrips: number
    onTimeRate: number
    totalStudents: number
    avgDelay: number
    incidents: number
    activeBuses: number
  } | null>(null)

  // Map dateRange to from/to (YYYY-MM-DD)
  const { from, to } = useMemo(() => {
    const now = new Date()
    const end = new Date(now)
    let start = new Date(now)
    if (dateRange === "7days") start.setDate(start.getDate() - 6)
    else if (dateRange === "30days") start.setDate(start.getDate() - 29)
    else if (dateRange === "90days") start.setDate(start.getDate() - 89)
    else start.setDate(start.getDate() - 6) // default 7 days
    const toISO = end.toISOString().slice(0, 10)
    const fromISO = start.toISOString().slice(0, 10)
    return { from: fromISO, to: toISO }
  }, [dateRange])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        const res = await apiClient.getReportsOverview({ from, to })
        const data: any = (res as any)?.data || {}
        const buses = data.buses || {}
        const trips = data.trips || {}
        // Derive UI stats with safe fallbacks
        const totalTrips = Number(trips.total || 0)
        const completed = Number(trips.completed || 0)
        const delayed = Number(trips.delayed || 0)
        const onTime = Math.max(completed - delayed, 0)
        const onTimeRate = totalTrips > 0 ? Math.round((onTime / totalTrips) * 100) : 0
        const avgDelay = Number(trips.averageDurationMinutes || 0) > 0 ? Math.max(Math.round((delayed / (totalTrips || 1)) * 10) / 10, 0) : 0
        const activeBuses = Number(buses.active || 0)
        // Note: totalStudents/incidents are not provided by BE yet → keep placeholders  from UI context
        const derived = {
          totalTrips,
          onTimeRate,
          totalStudents: 490, // TODO: replace when BE provides
          avgDelay: 3.2, // TODO: replace when BE provides
          incidents: 53, // TODO: replace when BE provides
          activeBuses,
        }
        if (mounted) setStats(derived)
      } catch (e: any) {
        console.warn("Failed to load reports overview", e)
        toast({ title: "Không tải được báo cáo", description: e?.message || "Vui lòng thử lại", variant: "destructive" })
        if (mounted) setStats(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [from, to, toast])

  // Mock data for charts
  const tripTrendData = [
    { date: "T2", trips: 45, onTime: 42, late: 3 },
    { date: "T3", trips: 48, onTime: 45, late: 3 },
    { date: "T4", trips: 46, onTime: 43, late: 3 },
    { date: "T5", trips: 50, onTime: 46, late: 4 },
    { date: "T6", trips: 47, onTime: 45, late: 2 },
    { date: "T7", trips: 44, onTime: 42, late: 2 },
    { date: "CN", trips: 0, onTime: 0, late: 0 },
  ]

  const busUtilizationData = [
    { name: "29B-12345", trips: 48, utilization: 96 },
    { name: "29B-12346", trips: 45, utilization: 90 },
    { name: "29B-12347", trips: 42, utilization: 84 },
    { name: "29B-12348", trips: 40, utilization: 80 },
    { name: "29B-12349", trips: 38, utilization: 76 },
  ]

  const attendanceData = [
    { name: "Có mặt", value: 450, color: "#10b981" },
    { name: "Vắng mặt", value: 25, color: "#ef4444" },
    { name: "Đi muộn", value: 15, color: "#f59e0b" },
  ]

  const incidentData = [
    { type: "Tắc đường", count: 12, severity: "low" },
    { type: "Sự cố kỹ thuật", count: 3, severity: "high" },
    { type: "Học sinh vắng mặt", count: 25, severity: "medium" },
    { type: "Thời tiết xấu", count: 5, severity: "medium" },
    { type: "Khác", count: 8, severity: "low" },
  ]

  const driverPerformanceData = [
    { name: "Trần Văn Hùng", trips: 48, onTimeRate: 95, rating: 4.8 },
    { name: "Nguyễn Văn Nam", trips: 45, onTimeRate: 93, rating: 4.7 },
    { name: "Lê Văn Tùng", trips: 42, onTimeRate: 90, rating: 4.5 },
    { name: "Phạm Văn Đức", trips: 40, onTimeRate: 88, rating: 4.3 },
    { name: "Hoàng Văn Minh", trips: 38, onTimeRate: 85, rating: 4.2 },
  ]

  const uiStats = stats || {
    totalTrips: 0,
    onTimeRate: 0,
    totalStudents: 0,
    avgDelay: 0,
    incidents: 0,
    activeBuses: 0,
  }

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Báo cáo & Thống kê</h1>
            <p className="text-muted-foreground mt-1">Phân tích dữ liệu và tạo báo cáo chi tiết</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 ngày qua</SelectItem>
                <SelectItem value="30days">30 ngày qua</SelectItem>
                <SelectItem value="90days">90 ngày qua</SelectItem>
                <SelectItem value="custom">Tùy chỉnh</SelectItem>
              </SelectContent>
            </Select>
            <Button className="gap-2">
              <Download className="w-4 h-4" />
              Xuất báo cáo
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng chuyến đi</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{uiStats.totalTrips}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500">+12%</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bus className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tỷ lệ đúng giờ</p>
                  <p className="text-2xl font-bold text-green-500 mt-1">{uiStats.onTimeRate}%</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500">+3%</span>
                  </div>
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
                  <p className="text-sm text-muted-foreground">Học sinh</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{uiStats.totalStudents}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500">+5</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Trễ TB</p>
                  <p className="text-2xl font-bold text-orange-500 mt-1">{uiStats.avgDelay}m</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingDown className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500">-0.5m</span>
                  </div>
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
                  <p className="text-sm text-muted-foreground">Sự cố</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{uiStats.incidents}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingDown className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500">-8</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Xe hoạt động</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{uiStats.activeBuses}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-muted-foreground">Tổng: 5</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bus className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports */}
        <Tabs defaultValue="trips" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-5">
            <TabsTrigger value="trips">Chuyến đi</TabsTrigger>
            <TabsTrigger value="buses">Xe buýt</TabsTrigger>
            <TabsTrigger value="drivers">Tài xế</TabsTrigger>
            <TabsTrigger value="students">Học sinh</TabsTrigger>
            <TabsTrigger value="incidents">Sự cố</TabsTrigger>
          </TabsList>

          {/* Trips Report */}
          <TabsContent value="trips" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Xu hướng chuyến đi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={tripTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="trips" stroke="#3b82f6" name="Tổng chuyến" strokeWidth={2} />
                      <Line type="monotone" dataKey="onTime" stroke="#10b981" name="Đúng giờ" strokeWidth={2} />
                      <Line type="monotone" dataKey="late" stroke="#f59e0b" name="Trễ" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Chi tiết chuyến đi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Tổng chuyến đi</span>
                        <span className="text-lg font-bold text-foreground">{uiStats.totalTrips}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: "100%" }} />
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Chuyến đúng giờ</span>
                        <span className="text-lg font-bold text-green-500">196</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: "92%" }} />
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Chuyến trễ</span>
                        <span className="text-lg font-bold text-orange-500">17</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: "8%" }} />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Thời gian TB</p>
                          <p className="font-semibold text-foreground mt-1">32 phút</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Khoảng cách TB</p>
                          <p className="font-semibold text-foreground mt-1">12.5 km</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Buses Report */}
          <TabsContent value="buses" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Tỷ lệ sử dụng xe buýt</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={busUtilizationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="utilization" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Hiệu suất xe buýt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {busUtilizationData.map((bus, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Bus className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{bus.name}</p>
                              <p className="text-xs text-muted-foreground">{bus.trips} chuyến</p>
                            </div>
                          </div>
                          <Badge variant={bus.utilization >= 90 ? "default" : "secondary"}>{bus.utilization}%</Badge>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${bus.utilization >= 90 ? "bg-green-500" : "bg-orange-500"}`}
                            style={{ width: `${bus.utilization}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Drivers Report */}
          <TabsContent value="drivers" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Hiệu suất tài xế</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {driverPerformanceData.map((driver, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-bold text-primary">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{driver.name}</p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span>{driver.trips} chuyến</span>
                              <span>•</span>
                              <span>Đúng giờ: {driver.onTimeRate}%</span>
                              <span>•</span>
                              <span>Đánh giá: {driver.rating}/5.0</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {driver.onTimeRate >= 90 ? (
                            <Badge variant="default" className="bg-green-500/20 text-green-700 hover:bg-green-500/30">
                              Xuất sắc
                            </Badge>
                          ) : driver.onTimeRate >= 85 ? (
                            <Badge variant="default" className="bg-blue-500/20 text-blue-700 hover:bg-blue-500/30">
                              Tốt
                            </Badge>
                          ) : (
                            <Badge
                              variant="default"
                              className="bg-orange-500/20 text-orange-700 hover:bg-orange-500/30"
                            >
                              Trung bình
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Report */}
          <TabsContent value="students" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Tỷ lệ điểm danh</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={attendanceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => {
                          const p = Number(percent ?? 0)
                          return `${name}: ${(p * 100).toFixed(0)}%`
                        }}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {attendanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Thống kê học sinh</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {attendanceData.map((item, index) => (
                      <div key={index} className="p-4 rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-sm font-medium text-foreground">{item.name}</span>
                          </div>
                          <span className="text-lg font-bold text-foreground">{item.value}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              backgroundColor: item.color,
                              width: `${(item.value / 490) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}

                    <div className="pt-4 border-t border-border">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Tổng học sinh</p>
                          <p className="font-semibold text-foreground mt-1">490</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Tỷ lệ có mặt</p>
                          <p className="font-semibold text-green-500 mt-1">91.8%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Incidents Report */}
          <TabsContent value="incidents" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Phân loại sự cố</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {incidentData.map((incident, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              incident.severity === "high"
                                ? "bg-red-500/10"
                                : incident.severity === "medium"
                                  ? "bg-orange-500/10"
                                  : "bg-blue-500/10"
                            }`}
                          >
                            <AlertTriangle
                              className={`w-6 h-6 ${
                                incident.severity === "high"
                                  ? "text-red-500"
                                  : incident.severity === "medium"
                                    ? "text-orange-500"
                                    : "text-blue-500"
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{incident.type}</p>
                            <p className="text-sm text-muted-foreground mt-1">{incident.count} sự cố</p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            incident.severity === "high"
                              ? "destructive"
                              : incident.severity === "medium"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {incident.severity === "high"
                            ? "Nghiêm trọng"
                            : incident.severity === "medium"
                              ? "Trung bình"
                              : "Nhẹ"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Export Options */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Xuất báo cáo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="gap-2 h-auto py-4 flex-col bg-transparent">
                <Download className="w-6 h-6 text-primary" />
                <div className="text-center">
                  <p className="font-semibold">Báo cáo PDF</p>
                  <p className="text-xs text-muted-foreground mt-1">Xuất báo cáo tổng quan</p>
                </div>
              </Button>

              <Button variant="outline" className="gap-2 h-auto py-4 flex-col bg-transparent">
                <Download className="w-6 h-6 text-green-500" />
                <div className="text-center">
                  <p className="font-semibold">Báo cáo Excel</p>
                  <p className="text-xs text-muted-foreground mt-1">Xuất dữ liệu chi tiết</p>
                </div>
              </Button>

              <Button variant="outline" className="gap-2 h-auto py-4 flex-col bg-transparent">
                <Calendar className="w-6 h-6 text-orange-500" />
                <div className="text-center">
                  <p className="font-semibold">Báo cáo tùy chỉnh</p>
                  <p className="text-xs text-muted-foreground mt-1">Chọn khoảng thời gian</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
