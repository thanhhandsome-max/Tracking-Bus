"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Search, Edit, Trash2, Eye, Phone } from "lucide-react"
import { DriverForm } from "@/components/admin/driver-form"

const mockDrivers = [
  {
    id: "1",
    name: "Nguyễn Văn A",
    phone: "0901234567",
    license: "B2",
    assignedRoute: "Tuyến 1",
    status: "active",
    trips: 156,
  },
  {
    id: "2",
    name: "Trần Văn B",
    phone: "0912345678",
    license: "B2",
    assignedRoute: "Tuyến 3",
    status: "active",
    trips: 142,
  },
  {
    id: "3",
    name: "Lê Thị C",
    phone: "0923456789",
    license: "B2",
    assignedRoute: "Tuyến 5",
    status: "off",
    trips: 98,
  },
  {
    id: "4",
    name: "Phạm Văn D",
    phone: "0934567890",
    license: "C",
    assignedRoute: "Tuyến 7",
    status: "active",
    trips: 187,
  },
]

export default function DriversPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const filteredDrivers = mockDrivers.filter((driver) => driver.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quản lý Tài xế</h1>
            <p className="text-muted-foreground mt-1">Quản lý thông tin và phân công tài xế</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Thêm tài xế
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Thêm tài xế mới</DialogTitle>
                <DialogDescription>Nhập thông tin tài xế để thêm vào hệ thống</DialogDescription>
              </DialogHeader>
              <DriverForm onClose={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">32</div>
              <p className="text-sm text-muted-foreground">Tổng tài xế</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">28</div>
              <p className="text-sm text-muted-foreground">Đang làm việc</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">12</div>
              <p className="text-sm text-muted-foreground">Đang lái xe</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-muted-foreground">4</div>
              <p className="text-sm text-muted-foreground">Nghỉ phép</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Danh sách tài xế</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tài xế</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Bằng lái</TableHead>
                  <TableHead>Tuyến gán</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Số chuyến</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={`/.jpg?height=32&width=32&query=${driver.name}`} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {driver.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{driver.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        {driver.phone}
                      </div>
                    </TableCell>
                    <TableCell>{driver.license}</TableCell>
                    <TableCell>{driver.assignedRoute}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          driver.status === "active"
                            ? "border-success text-success"
                            : "border-muted-foreground text-muted-foreground"
                        }
                      >
                        {driver.status === "active" ? "Đang làm việc" : "Nghỉ phép"}
                      </Badge>
                    </TableCell>
                    <TableCell>{driver.trips}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
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
