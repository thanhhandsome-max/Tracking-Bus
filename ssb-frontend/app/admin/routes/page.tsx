"use client"

import { useEffect, useState, useMemo } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Eye, MapPin, Clock, Search, Filter, AlertCircle, Route, Grid3x3, List, Navigation, ArrowRight, MoreVertical } from "lucide-react"
import { RouteBuilder } from "@/components/admin/route-builder"
import { StatsCard } from "@/components/admin/stats-card"
import { useRoutes, useDeleteRoute } from "@/lib/hooks/useRoutes"
import { useRouter } from "next/navigation"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

type Route = { 
  id: string; 
  name: string; 
  status?: string | boolean; 
  stopsCount?: number; 
  distance?: any; 
  duration?: any; 
  assignedBus?: string; 
  raw?: any 
}

type ViewMode = "grid" | "list"

export default function RoutesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<Route | null>(null)
  
  const { mutate: deleteRoute } = useDeleteRoute()

  const { data: routesData, isLoading, error } = useRoutes({
    limit: 100,
    search: debouncedSearch || undefined,
    trangThai: statusFilter === 'all' ? undefined : statusFilter === 'active',
  })

  function mapRoute(r: any): Route {
    // Normalize trangThai: convert number (1/0) to boolean, or keep as is
    let status = r.trangThai || r.status;
    if (typeof status === 'number') {
      status = status === 1;
    }
    return {
      id: String(r.maTuyen || r.id || r._id || ''),
      name: r.tenTuyen || r.ten || r.name || '',
      status: status,
      stopsCount: r.soDiemDung || r.stops?.length || r.diemDung?.length || 0,
      distance: r.quangDuong || r.distance || r.khoangCach,
      duration: r.thoiLuong || r.duration || r.thoiGianUocTinh,
      assignedBus: r.xeDuocGan || r.assignedBus,
      raw: r,
    }
  }

  const routes = useMemo(() => {
    if (!routesData?.data) return []
    const items = Array.isArray(routesData.data) ? routesData.data : []
    return items.map(mapRoute)
  }, [routesData])

  const stats = useMemo(() => {
    if (!routes.length) return null
    const totalRoutes = routes.length
    const activeRoutes = routes.filter((r) => {
      const status = r.status
      return status === true || status === 'hoat_dong' || status === 'active'
    }).length
    const totalStops = routes.reduce((sum, r) => sum + (r.stopsCount || 0), 0)
    const avgTime = Math.round(routes.reduce((sum, r) => sum + (r.duration || 0), 0) / routes.length) || 0
    return {
      total: totalRoutes,
      active: activeRoutes,
      inactive: totalRoutes - activeRoutes,
      totalStops,
      averageStops: Math.round(totalStops / totalRoutes) || 0,
      averageTime: avgTime,
    }
  }, [routes])

  // Filtering routes by status only (removed date filter)
  const filteredRoutes = useMemo(() => {
    let filtered = routes

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((route) => {
        const status = route.status
        if (statusFilter === 'active') {
          return status === true || status === 'hoat_dong' || status === 'active'
        }
        return status === false || status === 'ngung_hoat_dong' || status === 'inactive'
      })
    }

    return filtered
  }, [routes, statusFilter])

  // Helper to get route origin and destination
  const getRouteEndpoints = (route: Route) => {
    const raw = route.raw
    if (!raw) return { origin: null, destination: null }
    
    // Try to get from diemBatDau/diemKetThuc
    const origin = raw.diemBatDau || raw.origin || null
    const destination = raw.diemKetThuc || raw.destination || null
    
    // If we have stops, get first and last stop names
    const stops = raw.stops || raw.diemDung || []
    if (stops.length > 0) {
      const sortedStops = [...stops].sort((a: any, b: any) => (a.sequence || a.thuTu || 0) - (b.sequence || b.thuTu || 0))
      return {
        origin: origin || sortedStops[0]?.tenDiem || sortedStops[0]?.name || 'Điểm bắt đầu',
        destination: destination || sortedStops[sortedStops.length - 1]?.tenDiem || sortedStops[sortedStops.length - 1]?.name || 'Điểm kết thúc'
      }
    }
    
    return { origin, destination }
  }

  // Show RouteBuilder in fullscreen when creating/editing
  if (isAddDialogOpen || isEditDialogOpen) {
    return (
      <DashboardLayout sidebar={<AdminSidebar />}>
        <RouteBuilder
          mode={isEditDialogOpen ? 'edit' : 'create'}
          initialRoute={
            isEditDialogOpen && editingRoute
              ? {
                  id: editingRoute.id,
                  name: editingRoute.name,
                  diemBatDau: editingRoute.raw?.diemBatDau,
                  diemKetThuc: editingRoute.raw?.diemKetThuc,
                  stops: editingRoute.raw?.diemDung || editingRoute.raw?.stops,
                }
              : undefined
          }
          onClose={() => {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setEditingRoute(null);
          }}
          onSaved={() => {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setEditingRoute(null);
          }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quản lý Tuyến đường</h1>
            <p className="text-muted-foreground mt-1">Quản lý và cấu hình các tuyến đường xe buýt</p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm tuyến mới
          </Button>
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
            <div className="space-y-4">
              {/* Top Row: Search and View Mode */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm tuyến đường..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/30">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="h-8 px-3"
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="h-8 px-3"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Filters */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Lọc:</span>
                </div>
                
                {/* Status Filter */}
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

              {/* Active Filters Summary */}
              {statusFilter !== 'all' && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <span className="text-xs text-muted-foreground">Đang lọc:</span>
                  <Badge variant="secondary" className="gap-1">
                    Trạng thái: {statusFilter === 'active' ? 'Hoạt động' : 'Tạm ngừng'}
                    <button
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                      onClick={() => setStatusFilter('all')}
                    >
                      ×
                    </button>
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs ml-auto"
                    onClick={() => setStatusFilter('all')}
                  >
                    Xóa bộ lọc
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Routes Grid/List */}
        {isLoading ? (
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
                <p>{error instanceof Error ? error.message : 'Không thể tải danh sách tuyến'}</p>
              </div>
            </CardContent>
          </Card>
        ) : routes.length === 0 ? (
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
        ) : filteredRoutes.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="pt-12 pb-12">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Route className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Không tìm thấy tuyến đường</h3>
                  <p className="text-muted-foreground">
                    {statusFilter !== 'all' 
                      ? "Thử thay đổi bộ lọc để xem thêm tuyến đường"
                      : "Bắt đầu bằng cách thêm tuyến đường đầu tiên"}
                  </p>
                </div>
                {statusFilter !== 'all' ? (
                  <Button 
                    variant="outline"
                    onClick={() => setStatusFilter('all')}
                  >
                    Xóa bộ lọc
                  </Button>
                ) : (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm tuyến mới
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredRoutes.map((route) => {
              const endpoints = getRouteEndpoints(route)
              const isActive = route.status === true || route.status === "active" || route.status === "hoat_dong"
              
              return (
                <Card key={route.id} className="border-border/50 hover:border-primary/50 transition-all hover:shadow-lg flex flex-col group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                          {route.name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={
                            isActive
                              ? "border-success text-success bg-success/10 shrink-0 mt-1"
                              : "border-muted-foreground text-muted-foreground bg-muted/10 shrink-0 mt-1"
                          }
                        >
                          {isActive ? "Hoạt động" : "Tạm ngừng"}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/admin/routes/${route.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setEditingRoute(route); setIsEditDialogOpen(true) }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            variant="destructive"
                            onClick={() => {
                              if (!confirm(`Bạn có chắc chắn muốn xóa tuyến "${route.name}"?`)) return
                              deleteRoute(route.id, {
                                onSuccess: () => {
                                  toast({ title: "Thành công", description: "Đã xóa tuyến đường." })
                                },
                                onError: (err: Error) => {
                                  toast({ title: "Lỗi", description: err.message || 'Xóa thất bại', variant: "destructive" })
                                },
                              })
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-1 flex flex-col">
                    {/* Route Endpoints */}
                    {(endpoints.origin || endpoints.destination) && (
                      <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                        {endpoints.origin && (
                          <div className="flex items-start gap-2 text-sm">
                            <Navigation className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground mb-0.5">Điểm bắt đầu</p>
                              <p className="font-medium line-clamp-1">{endpoints.origin}</p>
                            </div>
                          </div>
                        )}
                        {endpoints.destination && (
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground mb-0.5">Điểm kết thúc</p>
                              <p className="font-medium line-clamp-1">{endpoints.destination}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Route Stats */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 p-2 bg-muted/20 rounded">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Điểm dừng</p>
                          <p className="font-semibold">{route.stopsCount ?? '-'}</p>
                        </div>
                      </div>
                      {route.duration && (
                        <div className="flex items-center gap-2 p-2 bg-muted/20 rounded">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Thời gian</p>
                            <p className="font-semibold">{route.duration} phút</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 mt-auto border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/admin/routes/${route.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1.5" />
                        Chi tiết
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setEditingRoute(route); setIsEditDialogOpen(true) }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRoutes.map((route) => {
              const endpoints = getRouteEndpoints(route)
              const isActive = route.status === true || route.status === "active" || route.status === "hoat_dong"
              
              return (
                <Card key={route.id} className="border-border/50 hover:border-primary/50 transition-all">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg line-clamp-1">{route.name}</CardTitle>
                          <Badge
                            variant="outline"
                            className={
                              isActive
                                ? "border-success text-success bg-success/10"
                                : "border-muted-foreground text-muted-foreground bg-muted/10"
                            }
                          >
                            {isActive ? "Hoạt động" : "Tạm ngừng"}
                          </Badge>
                        </div>
                        
                        {/* Route Endpoints */}
                        {(endpoints.origin || endpoints.destination) && (
                          <div className="flex items-center gap-4 mb-2 text-sm text-muted-foreground">
                            {endpoints.origin && (
                              <div className="flex items-center gap-1.5">
                                <Navigation className="w-3.5 h-3.5 text-primary" />
                                <span className="line-clamp-1">{endpoints.origin}</span>
                              </div>
                            )}
                            {endpoints.origin && endpoints.destination && (
                              <ArrowRight className="w-4 h-4 shrink-0" />
                            )}
                            {endpoints.destination && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-destructive" />
                                <span className="line-clamp-1">{endpoints.destination}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
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
                          {route.distance && (
                            <span>Khoảng cách: {route.distance}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/routes/${route.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1.5" />
                          Chi tiết
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
                          onClick={() => {
                            if (!confirm(`Bạn có chắc chắn muốn xóa tuyến "${route.name}"?`)) return
                            deleteRoute(route.id, {
                              onSuccess: () => {
                                toast({ title: "Thành công", description: "Đã xóa tuyến đường." })
                              },
                              onError: (err: Error) => {
                                toast({ title: "Lỗi", description: err.message || 'Xóa thất bại', variant: "destructive" })
                              },
                            })
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
