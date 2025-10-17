"use client"

import type React from "react"

import { useState } from "react"
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
  const { login, isLoading } = useAuth()
  const { toast } = useToast()

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
      await login(email, password, role)
      toast({
        title: "Đăng nhập thành công",
        description: `Chào mừng bạn đến với SSB 1.0`,
      })
    } catch (error) {
      toast({
        title: "Đăng nhập thất bại",
        description: "Email hoặc mật khẩu không đúng",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Bus className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">SSB 1.0</h1>
          <p className="text-muted-foreground">Smart School Bus Tracking System</p>
        </div>

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
                disabled={isLoading}
              >
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
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
  )
}
