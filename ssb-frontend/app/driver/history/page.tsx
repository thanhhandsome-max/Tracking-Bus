"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DriverSidebar } from "@/components/driver/driver-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function DriverHistoryPage() {
  const { user } = useAuth()
  const [trips, setTrips] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      if (!user?.id) return
      try {
        setLoading(true)
        const res = await apiClient.getDriverHistory(user.id, { limit: 100 })
        const data = (res as any)?.data || []
        const statsData = (res as any)?.stats || {}
        setTrips(Array.isArray(data) ? data : [])
        setStats(statsData)
      } catch (e) {
        console.error("Failed to load driver history", e)
        toast({ title: "Lỗi", description: "Không thể tải lịch sử chuyến đi", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, toast])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    return d.toLocaleDateString("vi-VN")
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return ""
    return timeStr.slice(0, 5) // HH:mm
  }

  return (
    <DashboardLayout sidebar={<DriverSidebar />}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lịch sử chuyến đi</h1>
          <p className="text-muted-foreground mt-1">Xem lại các chuyến đi đã hoàn thành</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">{stats?.totalTrips || trips.length}</div>
              <p className="text-sm text-muted-foreground">Tổng chuyến</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">{stats?.onTimeTrips || 0}</div>
              <p className="text-sm text-muted-foreground">Đúng giờ</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-warning">{stats?.delayedTrips || 0}</div>
              <p className="text-sm text-muted-foreground">Trễ</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">{stats?.incidents || 0}</div>
              <p className="text-sm text-muted-foreground">Sự cố</p>
            </CardContent>
          </Card>
        </div>

        {/* History Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Lịch sử chuyến đi</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Đang tải lịch sử...</div>
            ) : trips.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">Chưa có chuyến đi nào</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Tuyến</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Học sinh</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.map((trip: any) => {
                    const isOnTime = trip.gioBatDauThucTe && trip.gioKhoiHanh
                      ? new Date(`${trip.ngayChay} ${trip.gioKhoiHanh}`) >= new Date(trip.gioBatDauThucTe)
                      : false
                    const status = trip.trangThai
                    return (
                      <TableRow key={trip.maChuyen || trip.id}>
                        <TableCell className="font-medium">{formatDate(trip.ngayChay)}</TableCell>
                        <TableCell>{trip.tenTuyen || trip.route || "-"}</TableCell>
                        <TableCell>
                          {formatTime(trip.gioKhoiHanh || trip.startTime)}
                          {trip.gioBatDauThucTe ? ` - ${formatTime(new Date(trip.gioBatDauThucTe).toTimeString().slice(0, 5))}` : ""}
                        </TableCell>
                        <TableCell>{trip.soHocSinh || trip.students || 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {status === "hoan_thanh" && isOnTime && (
                              <>
                                <CheckCircle className="w-4 h-4 text-success" />
                                <Badge variant="outline" className="border-success text-success">
                                  Hoàn thành
                                </Badge>
                              </>
                            )}
                            {status === "hoan_thanh" && !isOnTime && (
                              <>
                                <Clock className="w-4 h-4 text-warning" />
                                <Badge variant="outline" className="border-warning text-warning">
                                  Trễ
                                </Badge>
                              </>
                            )}
                            {status === "huy" && (
                              <>
                                <AlertTriangle className="w-4 h-4 text-destructive" />
                                <Badge variant="outline" className="border-destructive text-destructive">
                                  Hủy
                                </Badge>
                              </>
                            )}
                            {status === "dang_chay" && (
                              <Badge variant="outline" className="border-primary text-primary">
                                Đang chạy
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => window.location.href = `/driver/trip/${trip.maChuyen || trip.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
