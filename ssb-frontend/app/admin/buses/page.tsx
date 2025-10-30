"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react"
import { BusForm } from "@/components/admin/bus-form"
import { apiClient } from "@/lib/api"
type BusType = { id: string; plateNumber: string; capacity?: number; status?: string; raw?: any }
// state for buses
// will be fetched from backend via busService.getBuses()

export default function BusesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingBus, setEditingBus] = useState<BusType | null>(null)
  const [buses, setBuses] = useState<BusType[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await apiClient.getBuses({ limit: 100 })
        if (mounted) {
          const data = (res as any).data || []
          const items = Array.isArray(data) ? data : data?.data || []
          const mapped: BusType[] = items.map((b: any) => ({
            id: String(b.maXe || b.id || b._id || ''),
            plateNumber: b.bienSoXe || b.plateNumber || '',
            capacity: b.sucChua || b.capacity,
            status: b.trangThai || b.status,
            raw: b,
          }))
          setBuses(mapped)
        }
      } catch (err: any) {
        console.error('Lỗi khi lấy danh sách xe:', err)
        if (mounted) setError(err?.message || 'Không lấy được danh sách xe')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const filteredBuses = buses.filter((bus) => (bus.plateNumber || '').toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quản lý Xe buýt</h1>
            <p className="text-muted-foreground mt-1">Quản lý thông tin và trạng thái xe buýt</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Thêm xe mới
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Thêm xe buýt mới</DialogTitle>
                <DialogDescription>Nhập thông tin xe buýt để thêm vào hệ thống</DialogDescription>
              </DialogHeader>
              <BusForm onClose={() => setIsAddDialogOpen(false)} onCreated={() => {
                // refresh list after creation
                (async () => {
                  try {
                    setLoading(true)
                    const res = await apiClient.getBuses({ limit: 100 })
                    const data = (res as any).data || []
                    const items = Array.isArray(data) ? data : data?.data || []
                    const mapped: BusType[] = items.map((b: any) => ({
                      id: String(b.maXe || b.id || b._id || ''),
                      plateNumber: b.bienSoXe || b.plateNumber || '',
                      capacity: b.sucChua || b.capacity,
                      status: b.trangThai || b.status,
                      raw: b,
                    }))
                    setBuses(mapped)
                  } finally {
                    setLoading(false)
                  }
                })()
              }} />
            </DialogContent>
          </Dialog>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Chỉnh sửa xe buýt</DialogTitle>
                <DialogDescription>Cập nhật thông tin xe buýt</DialogDescription>
              </DialogHeader>
              <BusForm
                mode="edit"
                initialBus={{
                  id: editingBus?.id,
                  bienSoXe: editingBus?.plateNumber,
                  sucChua: editingBus?.capacity,
                  trangThai: editingBus?.status,
                }}
                onClose={() => setIsEditDialogOpen(false)}
                onUpdated={async () => {
                  try {
                    setLoading(true)
                    const res = await apiClient.getBuses({ limit: 100 })
                    const data = (res as any).data || []
                    const items = Array.isArray(data) ? data : data?.data || []
                    const mapped: BusType[] = items.map((b: any) => ({
                      id: String(b.maXe || b.id || b._id || ''),
                      plateNumber: b.bienSoXe || b.plateNumber || '',
                      capacity: b.sucChua || b.capacity,
                      status: b.trangThai || b.status,
                      raw: b,
                    }))
                    setBuses(mapped)
                  } finally {
                    setLoading(false)
                  }
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
                <div className="text-2xl font-bold text-foreground">{buses.length}</div>
                <p className="text-sm text-muted-foreground">Tổng số xe</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
                <div className="text-2xl font-bold text-success">{buses.filter(b => b.status === 'hoat_dong' || b.status === 'active').length}</div>
                <p className="text-sm text-muted-foreground">Đang hoạt động</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
                <div className="text-2xl font-bold text-warning">{buses.filter(b => b.status === 'bao_tri' || b.status === 'maintenance').length}</div>
                <p className="text-sm text-muted-foreground">Đang bảo trì</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">{buses.filter(b => b.status === 'dang_chay' || b.status === 'running').length}</div>
                <p className="text-sm text-muted-foreground">Đang chạy</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Danh sách xe buýt</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo biển số..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading && <div className="py-4">Đang tải danh sách xe...</div>}
            {error && <div className="text-destructive py-4">{error}</div>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Biển số</TableHead>
                  <TableHead>Sức chứa</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Tuyến hiện tại</TableHead>
                  <TableHead>Số chuyến</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuses.map((bus) => (
                  <TableRow key={bus.id}>
                    <TableCell className="font-medium">{bus.plateNumber}</TableCell>
                    <TableCell>{bus.capacity ?? '-'} chỗ</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          bus.status === "hoat_dong" || bus.status === "active"
                            ? "border-success text-success"
                            : bus.status === "dang_chay" || bus.status === "running"
                              ? "border-primary text-primary"
                              : "border-warning text-warning"
                        }
                      >
                        {bus.status === "hoat_dong" || bus.status === "active" ? "Hoạt động" : bus.status === "dang_chay" || bus.status === "running" ? "Đang chạy" : "Bảo trì"}
                      </Badge>
                    </TableCell>
                    <TableCell>{bus.raw?.dongXe || bus.raw?.currentRoute || '-'}</TableCell>
                    <TableCell>{bus.raw?.trips ?? '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingBus(bus); setIsEditDialogOpen(true) }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={async () => {
                            if (!confirm('Xóa xe này?')) return
                            try {
                              await apiClient.deleteBus(bus.id)
                              // simple refresh
                              const res = await apiClient.getBuses({ limit: 100 })
                              const data = (res as any).data || []
                              const items = Array.isArray(data) ? data : data?.data || []
                              const mapped: BusType[] = items.map((b: any) => ({
                                id: String(b.maXe || b.id || b._id || ''),
                                plateNumber: b.bienSoXe || b.plateNumber || '',
                                capacity: b.sucChua || b.capacity,
                                status: b.trangThai || b.status,
                                raw: b,
                              }))
                              setBuses(mapped)
                            } catch (err: any) {
                              console.error(err)
                              alert(err?.message || 'Xóa thất bại')
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
