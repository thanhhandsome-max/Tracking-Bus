"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
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
import { Plus, Edit, Trash2, Eye, MapPin, Clock } from "lucide-react"
import { RouteForm } from "@/components/admin/route-form"
import { RouteDetail } from "@/components/admin/route-detail"

const mockRoutes = [
  {
    id: "1",
    name: "Tuyến 1 - Quận 1",
    stops: 8,
    distance: "12.5 km",
    duration: "45 phút",
    status: "active",
    assignedBus: "51A-12345",
  },
  {
    id: "2",
    name: "Tuyến 3 - Quận 3",
    stops: 6,
    distance: "9.2 km",
    duration: "35 phút",
    status: "active",
    assignedBus: "51B-67890",
  },
  {
    id: "3",
    name: "Tuyến 5 - Quận 5",
    stops: 10,
    distance: "15.8 km",
    duration: "55 phút",
    status: "active",
    assignedBus: "51D-22222",
  },
  {
    id: "4",
    name: "Tuyến 7 - Quận 7",
    stops: 7,
    distance: "11.3 km",
    duration: "40 phút",
    status: "inactive",
    assignedBus: "-",
  },
]

export default function RoutesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)

  const filteredRoutes = mockRoutes.filter((route) => route.name.toLowerCase().includes(searchQuery.toLowerCase()))

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
              <RouteForm onClose={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">8</div>
              <p className="text-sm text-muted-foreground">Tổng tuyến</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">6</div>
              <p className="text-sm text-muted-foreground">Đang hoạt động</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">58</div>
              <p className="text-sm text-muted-foreground">Tổng điểm dừng</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">42 phút</div>
              <p className="text-sm text-muted-foreground">Thời gian TB</p>
            </CardContent>
          </Card>
        </div>

        {/* Routes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRoutes.map((route) => (
            <Card key={route.id} className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{route.name}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {route.stops} điểm dừng
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {route.duration}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      route.status === "active"
                        ? "border-success text-success"
                        : "border-muted-foreground text-muted-foreground"
                    }
                  >
                    {route.status === "active" ? "Hoạt động" : "Không hoạt động"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Khoảng cách</p>
                    <p className="font-medium">{route.distance}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Xe được gán</p>
                    <p className="font-medium">{route.assignedBus}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => setSelectedRoute(route.id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Xem chi tiết
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive bg-transparent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
