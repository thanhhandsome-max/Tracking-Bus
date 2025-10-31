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
import apiClient from "@/lib/api"

export default function ParentHistory() {
  const { user } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && user.role !== "parent") {
      router.push(`/${user.role}`)
    }
  }, [user, router])

  if (!user || user.role !== "parent") {
    return null
  }

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.getTripHistory({ limit: 100 })
        const arr = Array.isArray(res?.data) ? res.data : []
        setItems(arr)
      } catch (e) {
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalTrips = items.length
  const stats = {
    totalTrips,
    onTimeRate: 0,
    avgDelay: 0,
    absences: 0,
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
              {(loading ? [] : items).map((trip: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          {trip.ngayChay}
                        </Badge>
                        <Badge variant={trip.loaiChuyen === "don_sang" ? "default" : "secondary"}>
                          {trip.loaiChuyen === "don_sang" ? "Buổi sáng" : "Buổi chiều"}
                        </Badge>
                        {trip.trangThai === "hoan_thanh" && (
                          <Badge variant="default" className="bg-green-500/20 text-green-700 hover:bg-green-500/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Hoàn thành
                          </Badge>
                        )}
                        {trip.trangThai === "vang" && (
                          <Badge variant="default" className="bg-red-500/20 text-red-700 hover:bg-red-500/30">
                            <XCircle className="w-3 h-3 mr-1" />
                            Vắng mặt
                          </Badge>
                        )}
                        {false && (
                          <Badge variant="default" className="bg-orange-500/20 text-orange-700 hover:bg-orange-500/30">
                            Trễ 0 phút
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Xe buýt</p>
                          <p className="font-medium text-foreground">{trip.bienSoXe || ""}</p>
                          <p className="text-xs text-muted-foreground">{trip.tenTuyen || ""}</p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-muted-foreground">Thời gian đón</p>
                          <p className="font-medium text-foreground">{""}</p>
                          <p className="text-xs text-muted-foreground">Dự kiến: {trip.gioKhoiHanh}</p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-muted-foreground">Thời gian trả</p>
                          <p className="font-medium text-foreground">{""}</p>
                          <p className="text-xs text-muted-foreground">Dự kiến: {""}</p>
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
