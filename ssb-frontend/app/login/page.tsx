"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, type UserRole } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bus, Lock, Mail, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("admin")
  const { login, loading, user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (user && user.role && !loading) {
      const userRole = user.role.toLowerCase()
      if (userRole === "admin" || userRole === "driver" || userRole === "parent") {
        router.push(`/${userRole}`)
      }
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ thông tin",
        variant: "destructive",
      })
      return
    }

    try {
      const loggedInUser = await login(email, password)
      toast({
        title: "Đăng nhập thành công",
        description: `Chào mừng bạn đến với SSB 1.0`,
      })
      
      // Redirect based on user role
      const userRole = loggedInUser.role?.toLowerCase()
      if (userRole === "admin" || userRole === "driver" || userRole === "parent") {
        router.push(`/${userRole}`)
      } else {
        // Fallback redirect
        router.push("/")
      }
    } catch (error: any) {
      toast({
        title: "Đăng nhập thất bại",
        description: error?.message || "Email hoặc mật khẩu không đúng",
        variant: "destructive",
      })
    }
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: `url('/schoolbus-bg.jpg')`,
        /* make the image slightly smaller and anchor it to the right so left text is clearer */
        backgroundSize: "100% auto",
        backgroundPosition: "right center",
        backgroundRepeat: "no-repeat",
      }}
    >
  {/* Overlay to mute the background so content is readable (slightly less opaque) */}
  <div className="absolute inset-0 bg-[rgba(255,255,255,0.15)] backdrop-blur-sm" />

      <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left promotional text */}
          <div className="px-6 py-12 text-center lg:text-left">
            <div className="max-w-lg mx-auto lg:mx-0 p-0">
              <h2 className="text-7xl lg:text-8xl font-extrabold text-foreground mb-3">SSB 1.0</h2>
              <p className="text-xl lg:text-2xl text-muted-foreground mb-6 leading-relaxed">
                Hệ thống theo dõi xe buýt trường học thông minh — <strong className="text-primary">giám sát lộ trình</strong>, <strong className="text-primary">an toàn học sinh</strong> và quản lý vận hành.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground max-w-md mx-auto lg:mx-0">
                <li className="flex items-start gap-2"><span className="text-primary">●</span> Theo dõi thời gian thực</li>
                <li className="flex items-start gap-2"><span className="text-primary">●</span> Quản lý lịch trình và phân công</li>
                <li className="flex items-start gap-2"><span className="text-primary">●</span> Báo cáo và cảnh báo tức thì</li>
              </ul>
            </div>
          </div>

          {/* Right: login form */}
          <div className="px-6 py-8">
            <div className="w-full max-w-md mx-auto">
              <Card className="border-border/50 shadow-xl">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-bold">Đăng nhập</CardTitle>
                  <CardDescription>Nhập thông tin để truy cập hệ thống</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Role Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="role" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Vai trò
                      </Label>
                      <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Chọn vai trò" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Quản lý Nhà trường</SelectItem>
                          <SelectItem value="driver">Tài xế</SelectItem>
                          <SelectItem value="parent">Phụ huynh</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email / Số điện thoại
                      </Label>
                      <Input
                        id="email"
                        type="text"
                        placeholder="admin@school.edu.vn"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Mật khẩu
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11"
                      />
                    </div>

                    {/* Forgot Password Link */}
                    <div className="flex justify-end">
                      <Button variant="link" className="px-0 text-primary hover:text-primary/80" type="button">
                        Quên mật khẩu?
                      </Button>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                      disabled={loading}
                    >
                      {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                    </Button>

                    {/* Demo Credentials */}
                    <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Demo credentials:</p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>Admin: admin@school.edu.vn / admin123</p>
                        <p>Driver: driver@school.edu.vn / driver123</p>
                        <p>Parent: parent@school.edu.vn / parent123</p>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Register Link for Parents */}
              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground">
                  Phụ huynh chưa có tài khoản?{" "}
                  <Button variant="link" className="px-1 text-primary hover:text-primary/80">
                    Đăng ký ngay
                  </Button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
