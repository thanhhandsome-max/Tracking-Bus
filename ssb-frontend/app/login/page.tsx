"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Mail, Loader2, Bus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { login, loading, user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (user && user.role && !loading) {
      const userRole = user.role.toLowerCase()
      router.push(`/${userRole}`)
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      
      const userRole = loggedInUser.role?.toLowerCase()
      if (userRole === "parent") {
        try {
          const studentsRes = await apiClient.getStudentsByParent()
          const studentsData = ((studentsRes as any).data || []) as any[]
          
          if (studentsData.length > 1) {
            router.push("/parent/select-student")
          } else if (studentsData.length === 1) {
            if (typeof window !== "undefined") {
              localStorage.setItem("selected_student_id", String(studentsData[0].maHocSinh))
            }
            router.push("/parent")
          } else {
            toast({
              title: "Thông báo",
              description: "Bạn chưa có học sinh nào được liên kết",
              variant: "destructive",
            })
            router.push("/parent")
          }
        } catch (err) {
          console.error("Error checking students:", err)
          router.push("/parent")
        }
      } else if (userRole === "admin" || userRole === "driver") {
        router.push(`/${userRole}`)
      } else {
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-400/30 to-blue-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/30 to-blue-700/30 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-2xl">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Bus className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  SSB 1.0
                </h1>
              </div>
              <CardTitle className="text-xl">Đăng nhập vào hệ thống</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@schoolbus.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>

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
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Đăng nhập"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
