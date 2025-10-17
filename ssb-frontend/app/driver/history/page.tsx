"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DriverSidebar } from "@/components/driver/driver-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, CheckCircle, Clock, AlertTriangle } from "lucide-react"

const tripHistory = [
  {
    id: "1",
    date: "15/01/2024",
    route: "Tuyến 1 - Quận 1",
    time: "06:30 - 07:25",
    students: 28,
    status: "completed",
    onTime: true,
  },
  {
    id: "2",
    date: "15/01/2024",
    route: "Tuyến 1 - Quận 1 (Chiều)",
    time: "15:00 - 15:58",
    students: 28,
    status: "completed",
    onTime: true,
  },
  {
    id: "3",
    date: "14/01/2024",
    route: "Tuyến 1 - Quận 1",
    time: "06:30 - 07:35",
    students: 27,
    status: "completed",
    onTime: false,
  },
  {
    id: "4",
    date: "14/01/2024",
    route: "Tuyến 1 - Quận 1 (Chiều)",
    time: "15:00 - 16:05",
    students: 27,
    status: "incident",
    onTime: false,
  },
]

export default function DriverHistoryPage() {
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
              <div className="text-2xl font-bold text-foreground">156</div>
              <p className="text-sm text-muted-foreground">Tổng chuyến</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">148</div>
              <p className="text-sm text-muted-foreground">Đúng giờ</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-warning">7</div>
              <p className="text-sm text-muted-foreground">Trễ</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">1</div>
              <p className="text-sm text-muted-foreground">Sự cố</p>
            </CardContent>
          </Card>
        </div>

        {/* History Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Lịch sử 7 ngày gần đây</CardTitle>
          </CardHeader>
          <CardContent>
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
                {tripHistory.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell className="font-medium">{trip.date}</TableCell>
                    <TableCell>{trip.route}</TableCell>
                    <TableCell>{trip.time}</TableCell>
                    <TableCell>{trip.students}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {trip.status === "completed" && trip.onTime && (
                          <>
                            <CheckCircle className="w-4 h-4 text-success" />
                            <Badge variant="outline" className="border-success text-success">
                              Hoàn thành
                            </Badge>
                          </>
                        )}
                        {trip.status === "completed" && !trip.onTime && (
                          <>
                            <Clock className="w-4 h-4 text-warning" />
                            <Badge variant="outline" className="border-warning text-warning">
                              Trễ
                            </Badge>
                          </>
                        )}
                        {trip.status === "incident" && (
                          <>
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                            <Badge variant="outline" className="border-destructive text-destructive">
                              Sự cố
                            </Badge>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Chi tiết
                      </Button>
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
