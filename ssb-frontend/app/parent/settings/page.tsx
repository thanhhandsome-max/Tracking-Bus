"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ParentSidebar } from "@/components/parent/parent-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import { Users } from "lucide-react"

export default function ParentSettings() {
  const { user } = useAuth()
  const router = useRouter()
  const [studentsCount, setStudentsCount] = useState(0)

  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState("vi")
  const [notifyDelay, setNotifyDelay] = useState(true)
  const [notifyIncident, setNotifyIncident] = useState(false)

  useEffect(() => {
    async function checkStudents() {
      try {
        const res = await apiClient.getStudentsByParent()
        const data = (res as any).data || []
        setStudentsCount(data.length)
      } catch (error) {
        console.error("Error checking students:", error)
      }
    }
    checkStudents()
  }, [])

  const handleSave = (section: string) => {
    toast({
      title: "Lưu thành công",
      description: `Cài đặt ${section} đã được cập nhật.`,
    })
  }

  const handleSwitchStudent = () => {
    router.push("/parent/select-student")
  }

  return (
    <DashboardLayout sidebar={<ParentSidebar />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cài đặt</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý cài đặt giao diện và thông báo của ứng dụng.
          </p>
        </div>

        {/* Chuyển học sinh - chỉ hiển thị nếu có nhiều hơn 1 học sinh */}
        {studentsCount > 1 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Chuyển học sinh
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Bạn có {studentsCount} học sinh. Bấm vào nút bên dưới để chuyển đổi giữa các học sinh.
              </p>
              <Button onClick={handleSwitchStudent} className="bg-primary hover:bg-primary/90">
                <Users className="w-4 h-4 mr-2" />
                Chọn học sinh khác
              </Button>
            </CardContent>
          </Card>
        )}

        <Separator />

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="appearance">Giao diện</TabsTrigger>
            <TabsTrigger value="notifications">Thông báo</TabsTrigger>
          </TabsList>

          {/* --- Giao diện --- */}
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

          {/* --- Thông báo --- */}
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
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
