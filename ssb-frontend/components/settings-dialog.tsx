"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"

export function SettingsDialog() {
  const { user } = useAuth()

  const [displayName, setDisplayName] = useState(user?.name || "")
  const [password, setPassword] = useState("")
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState("vi")
  const [notifyDelay, setNotifyDelay] = useState(true)
  const [notifyIncident, setNotifyIncident] = useState(false)
  const [gpsInterval, setGpsInterval] = useState(10)
  const [maxSpeed, setMaxSpeed] = useState(60)

  const handleSave = (section: string) => {
    toast({
      title: "Lưu thành công",
      description: `Cài đặt ${section} đã được cập nhật.`,
    })
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Quản lý cài đặt tài khoản, giao diện, thông báo và thông số hệ thống.
      </p>

      <Separator />

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="account">Tài khoản</TabsTrigger>
          <TabsTrigger value="appearance">Giao diện</TabsTrigger>
          <TabsTrigger value="notifications">Thông báo</TabsTrigger>
          <TabsTrigger value="system">Hệ thống</TabsTrigger>
        </TabsList>

        {/* Nội dung các tab giữ nguyên */}
        {/*Tài khoản */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tài khoản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Tên hiển thị"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <Input placeholder="Email" value={user?.email || ""} disabled />
              <Input
                placeholder="Mật khẩu mới"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSave("tài khoản")}>Lưu thay đổi</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Giao diện */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Tùy chỉnh giao diện</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p>Chế độ tối</p>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ngôn ngữ</label>
                <select
                  className="border border-border rounded-md p-2 text-sm w-full bg-background"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSave("giao diện")}>Lưu thay đổi</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/*Thông báo */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt thông báo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p>Thông báo khi xe trễ</p>
                <Switch checked={notifyDelay} onCheckedChange={setNotifyDelay} />
              </div>
              <div className="flex items-center justify-between">
                <p>Thông báo khi có sự cố</p>
                <Switch checked={notifyIncident} onCheckedChange={setNotifyIncident} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSave("thông báo")}>Lưu thay đổi</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/*Hệ thống */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Thông số hệ thống (Admin)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tần suất cập nhật GPS (giây)
                </label>
                <Input
                  type="number"
                  value={gpsInterval}
                  onChange={(e) => setGpsInterval(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Giới hạn tốc độ cảnh báo (km/h)
                </label>
                <Input
                  type="number"
                  value={maxSpeed}
                  onChange={(e) => setMaxSpeed(Number(e.target.value))}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSave("hệ thống")}>Lưu cấu hình</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
