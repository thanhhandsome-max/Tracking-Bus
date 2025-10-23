"use client"

import {  Dialog as ProfileDialog,
          DialogContent as ProfileDialogContent,
          DialogHeader as ProfileDialogHeader, 
          DialogTitle as ProfileDialogTitle,
          DialogDescription as ProfileDialogDescription,
          DialogFooter as ProfileDialogFooter
        } from "@/components/ui/dialog"

// Import thêm cho dialog hồ sơ
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useState, type ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"
import { SettingsDialog } from "@/components/settings-dialog"
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
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)


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

                <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                  <User className="w-4 h-4 mr-2" />
                  Hồ sơ cá nhân
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
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

      {/* Hồ sơ cá nhân (Dialog) */}
      <ProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <ProfileDialogContent className="max-w-md">
          <ProfileDialogHeader>
            <ProfileDialogTitle>Hồ sơ cá nhân</ProfileDialogTitle>
            <ProfileDialogDescription>
              Thông tin tài khoản hiện tại của bạn.
            </ProfileDialogDescription>
          </ProfileDialogHeader>

          {user ? (
            <div className="space-y-3 mt-2 text-sm">
              <p>
                <b>Tên:</b> {user.name || "Chưa có"}
              </p>
              <p>
                <b>Email:</b> {user.email || "Chưa có"}
              </p>
              <p>
                <b>Vai trò:</b> {user.role || "Chưa xác định"}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Không tìm thấy thông tin người dùng.
            </p>
          )}

          <ProfileDialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setIsProfileOpen(false)}>
              Đóng
            </Button>
          </ProfileDialogFooter>
        </ProfileDialogContent>
      </ProfileDialog>

      {/* Cài đặt hệ thống (Dialog) */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cài đặt hệ thống</DialogTitle>
          </DialogHeader>
          <SettingsDialog />
        </DialogContent>
      </Dialog>

    </div>
  )
}
