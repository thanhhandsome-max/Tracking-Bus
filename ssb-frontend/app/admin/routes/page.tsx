"use client"

import { useEffect, useState, useMemo } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Eye, MapPin, Clock, Search, Filter, AlertCircle, Route } from "lucide-react"
import { RouteForm } from "@/components/admin/route-form"
import { RouteDetail } from "@/components/admin/route-detail"
import { apiClient } from "@/lib/api"
import { StatsCard } from "@/components/admin/stats-card"

type Route = { 
  id: string; 
  name: string; 
  status?: string; 
  stopsCount?: number; 
  distance?: any; 
  duration?: any; 
  assignedBus?: string; 
  raw?: any 
}

export default function RoutesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<Route | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)

  function mapRoute(r: any): Route {
    return {
      id: String(r.maTuyen || r.id || r._id || ''),
      name: r.tenTuyen || r.ten || r.name || '',
      status: r.trangThai || r.status,
      stopsCount: r.soDiemDung || r.stops?.length || r.diemDung?.length,
      distance: r.quangDuong || r.distance || r.khoangCach,
      duration: r.thoiLuong || r.duration || r.thoiGianUocTinh,
      assignedBus: r.xeDuocGan || r.assignedBus,
      raw: r,
    }
  }

  async function fetchRoutes() {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.getRoutes({ limit: 100 })
      const data = (res as any).data || []
      const items = Array.isArray(data) ? data : data?.data || []
      setRoutes(items.map(mapRoute))

      // Calculate stats from routes
      const totalRoutes = items.length
      const activeRoutes = items.filter((r: any) => r.trangThai === true || r.status === 'hoat_dong' || r.status === 'active').length
      
      // Get total stops count
      let totalStops = 0
      items.forEach((r: any) => {
        const stops = r.diemDung || r.stops || []
        totalStops += stops.length
      })

      // Calculate average time
      const avgTime = items.length > 0 
        ? Math.round(items.reduce((sum: number, r: any) => sum + (r.thoiGianUocTinh || 0), 0) / items.length)
        : 0

      setStats({
        total: totalRoutes,
        active: activeRoutes,
        inactive: totalRoutes - activeRoutes,
        totalStops,
        averageStops: Math.round(totalStops / totalRoutes) || 0,
        averageTime: avgTime
      })
    } catch (e: any) {
      setError(e?.message || "Không lấy được danh sách tuyến")
      console.error("Lỗi khi lấy danh sách tuyến:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoutes()
  }, [])

  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      const matchesSearch = (route.name || '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' 
        ? true 
        : statusFilter === 'active' 
          ? (route.status === true || route.status === 'hoat_dong' || route.status === 'active')
          : (route.status === false || route.status === 'ngung_hoat_dong' || route.status === 'inactive')
      return matchesSearch && matchesStatus
    })
  }, [routes, searchQuery, statusFilter])

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quản lý Tuyến đường</h1>
            <p className="text-muted-foreground mt-1">Quản lý tuyến đường và điểm dừng</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Thêm tuyến mới
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Thêm tuyến đường mới</DialogTitle>
                <DialogDescription>Nhập thông tin tuyến đường và các điểm dừng</DialogDescription>
              </DialogHeader>
              <RouteForm
                onClose={() => setIsAddDialogOpen(false)}
                onCreated={() => {
                  fetchRoutes()
                }}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Chỉnh sửa tuyến đường</DialogTitle>
                <DialogDescription>Cập nhật thông tin tuyến đường và điểm dừng</DialogDescription>
              </DialogHeader>
              <RouteForm
                mode="edit"
                initial={{
                  id: editingRoute?.id,
                  name: editingRoute?.name,
                  stops: editingRoute?.raw?.diemDung,
                }}
                onClose={() => setIsEditDialogOpen(false)}
                onUpdated={() => fetchRoutes()}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard
              title="Tổng tuyến"
              value={String(stats.total)}
              change={`${stats.active} đang hoạt động`}
              trend="up"
              icon={Route}
              iconColor="text-primary"
            />
            <StatsCard
              title="Đang hoạt động"
              value={String(stats.active)}
              change={`${stats.inactive} tạm ngừng`}
              trend="up"
              icon={AlertCircle}
              iconColor="text-success"
            />
            <StatsCard
              title="Tổng điểm dừng"
              value={String(stats.totalStops)}
              change={`TB: ${stats.averageStops} điểm/tuyến`}
              trend="neutral"
              icon={MapPin}
              iconColor="text-warning"
            />
            <StatsCard
              title="Thời gian TB"
              value={`${stats.averageTime} phút`}
              change="Ước tính hoàn thành"
              trend="neutral"
              icon={Clock}
              iconColor="text-info"
            />
          </div>
        )}

        {/* Search and Filter Bar */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm tuyến đường..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                  >
                    Tất cả
                  </Button>
                  <Button
                    variant={statusFilter === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('active')}
                  >
                    Hoạt động
                  </Button>
                  <Button
                    variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('inactive')}
                  >
                    Tạm ngừng
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Routes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="pt-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredRoutes.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="pt-12 pb-12">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Route className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Không có tuyến đường</h3>
                  <p className="text-muted-foreground">Bắt đầu bằng cách thêm tuyến đường đầu tiên</p>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm tuyến mới
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRoutes.map((route) => (
              <Card key={route.id} className="border-border/50 hover:border-primary/50 transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{route.name}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {route.stopsCount ?? '-'} điểm dừng
                        </div>
                        {route.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {route.duration} phút
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        route.status === "active" || route.status === "hoat_dong" || route.status === true
                          ? "border-success text-success bg-success/10"
                          : "border-muted-foreground text-muted-foreground bg-muted/10"
                      }
                    >
                      {route.status === "active" || route.status === "hoat_dong" || route.status === true ? "Hoạt động" : "Tạm ngừng"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(route.distance || route.assignedBus) && (
                    <div className="grid grid-cols-2 gap-4 text-sm p-3 bg-muted/30 rounded-lg">
                      {route.distance && (
                        <div>
                          <p className="text-muted-foreground text-xs">Khoảng cách</p>
                          <p className="font-medium">{route.distance}</p>
                        </div>
                      )}
                      {route.assignedBus && (
                        <div>
                          <p className="text-muted-foreground text-xs">Xe được gán</p>
                          <p className="font-medium">{route.assignedBus}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setSelectedRoute(route.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Xem chi tiết
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => { setEditingRoute(route); setIsEditDialogOpen(true) }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={async () => {
                        if (!confirm(`Bạn có chắc chắn muốn xóa tuyến "${route.name}"?`)) return
                        try {
                          await apiClient.deleteRoute(route.id)
                          fetchRoutes()
                        } catch (err: any) {
                          console.error(err)
                          alert(err?.message || 'Xóa thất bại')
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Route Detail Dialog */}
        <Dialog open={selectedRoute !== null} onOpenChange={() => setSelectedRoute(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chi tiết tuyến đường</DialogTitle>
            </DialogHeader>
            {selectedRoute && <RouteDetail routeId={selectedRoute} />}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
