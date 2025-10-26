"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ParentSidebar } from "@/components/parent/parent-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, MapPin, Bell, Shield, Save } from "lucide-react"
import { toast } from "@/hooks/use-toast"

import { Switch } from "@/components/ui/switch"

export default function ParentProfile() {
  const { user } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false)

  useEffect(() => {
    if (user && user.role !== "parent") {
      router.push(`/${user.role}`)
    }
  }, [user, router])

  if (!user || user.role !== "parent") {
    return null
  }

  // Mock parent profile data
  const profile = {
    name: "Nguyễn Văn A",
    email: "nguyenvana@email.com",
    phone: "0987654321",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    children: [
      {
        name: "Nguyễn Minh An",
        grade: "Lớp 3A",
        busNumber: "29B-12345",
        pickupPoint: "Điểm đón 3",
      },
    ],
    notifications: {
      pickup: true,
      dropoff: true,
      delay: true,
      incident: true,
      schedule: false,
    },
  }

  return (
    <DashboardLayout sidebar={<ParentSidebar />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hồ sơ cá nhân</h1>
          <p className="text-muted-foreground mt-1">Quản lý thông tin cá nhân và cài đặt</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-2 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Thông tin cá nhân</CardTitle>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="gap-2"
                >
                  {isEditing ? (
                    <>
                      <Save className="w-4 h-4" />
                      Lưu thay đổi
                    </>
                  ) : (
                    "Chỉnh sửa"
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src="/placeholder.svg?height=96&width=96" />
                  <AvatarFallback className="text-2xl">NA</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button variant="outline" size="sm">
                    Thay đổi ảnh
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Họ và tên</Label>
                  <Input id="name" defaultValue={profile.name} disabled={!isEditing} className="disabled:opacity-100" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={profile.email}
                    disabled={!isEditing}
                    className="disabled:opacity-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    defaultValue={profile.phone}
                    disabled={!isEditing}
                    className="disabled:opacity-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input
                    id="address"
                    defaultValue={profile.address}
                    disabled={!isEditing}
                    className="disabled:opacity-100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Thông tin nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vai trò</p>
                    <p className="font-medium text-foreground">Phụ huynh</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Điện thoại</p>
                    <p className="font-medium text-foreground">{profile.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Bảo mật</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={() => setOpenPasswordDialog(true)}>
                  <Shield className="w-4 h-4" />
                  Đổi mật khẩu
                </Button>
              </CardContent>
            </Card>

            
          </div>

          
        </div>

        {/* Popup đổi mật khẩu */}
        <Dialog open={openPasswordDialog} onOpenChange={setOpenPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Đổi mật khẩu</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <Input type="password" placeholder="Mật khẩu hiện tại" />
              <Input type="password" placeholder="Mật khẩu mới" />
              <Input type="password" placeholder="Xác nhận mật khẩu mới" />
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  toast({ title: "Thành công", description: "Mật khẩu đã được thay đổi." })
                  setOpenPasswordDialog(false)
                }}
              >
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        {/* Children Information */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Thông tin con em</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profile.children.map((child, index) => (
                <div key={index} className="p-4 rounded-lg border border-border/50 bg-muted/20">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src="/placeholder.svg?height=48&width=48" />
                          <AvatarFallback>MA</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-foreground">{child.name}</h4>
                          <p className="text-sm text-muted-foreground">{child.grade}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Điểm đón:</span>
                          <span className="font-medium text-foreground">{child.pickupPoint}</span>
                        </div>
                        <div>
                          <Badge variant="outline">{child.busNumber}</Badge>
                        </div>
                      </div>
                    </div>
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
