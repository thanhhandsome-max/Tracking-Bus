"use client"

import { useState, type ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Search, LogOut, Settings, User } from "lucide-react"
import { Input } from "@/components/ui/input"



interface DashboardLayoutProps {
  children: ReactNode
  sidebar: ReactNode
}

export function DashboardLayout({ children, sidebar }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const router = useRouter()


  return (
    <div className="flex h-screen bg-muted">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex-shrink-0">
        {sidebar}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header / Top Bar */}
        <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between flex-shrink-0 shadow-sm">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm..."
                className="pl-10 h-9 bg-background border-input"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative hover:bg-accent">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-warning rounded-full" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 h-10 px-3 hover:bg-accent"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium">{user?.name || "Người dùng"}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email || "Chưa có email"}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => router.push(`/${user?.role}/profile`)}>
                  <User className="w-4 h-4 mr-2" />
                  Hồ sơ cá nhân
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => router.push(`/${user?.role}/settings`)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Cài đặt
                </DropdownMenuItem>


                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Page Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>


    </div>
  )
}
