"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Search, LogOut, Settings, User, Menu, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LanguageToggle } from "@/components/ui/language-toggle"

interface DashboardLayoutProps {
  children: ReactNode
  sidebar: ReactNode
}

export function DashboardLayout({ children, sidebar }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const toggleSidebar = () => setIsSidebarOpen((v) => !v)
  const closeSidebar = () => setIsSidebarOpen(false)

  useEffect(() => {
    // Auto-close drawer on route change
    setIsSidebarOpen(false)
  }, [pathname])

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100/30 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-shrink-0 lg:border-r lg:border-blue-200/50 lg:bg-white/80 lg:backdrop-blur-xl lg:shadow-xl">
        {sidebar}
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-blue-200/50 bg-white/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!isSidebarOpen}
      >
        <div className="h-full overflow-y-auto">{sidebar}</div>
      </div>

      {/* Overlay for Mobile Drawer */}
      {isSidebarOpen && (
        <button
          type="button"
          onClick={closeSidebar}
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm lg:hidden"
          aria-label={t("header.closeMenu")}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header / Top Bar */}
        <header className="h-16 border-b border-blue-200/50 bg-white/80 backdrop-blur-xl px-6 flex items-center justify-between flex-shrink-0 shadow-lg">
          {/* Left: Menu + Search */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-blue-50 transition-all duration-300"
              onClick={toggleSidebar}
              aria-label={t("header.openMenu")}
            >
              <Menu className="w-5 h-5 text-blue-600" />
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
              <Input
                type="search"
                placeholder={t("common.search")}
                className="pl-10 h-10 bg-gradient-to-r from-gray-50 to-blue-50/30 border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-xl transition-all duration-300"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
            <Button variant="ghost" size="icon" className="relative hover:bg-blue-50 rounded-xl transition-all duration-300 group">
              <Bell className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-full animate-pulse" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 h-11 px-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 rounded-xl transition-all duration-300 border-2 border-transparent hover:border-blue-200"
                >
                  <Avatar className="w-9 h-9 ring-2 ring-blue-200 ring-offset-2">
                    <AvatarImage src={"/placeholder.svg"} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white text-sm font-bold">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-semibold text-gray-800">{user?.name || t("header.user")}</p>
                    <p className="text-xs text-blue-600 font-medium">
                      {user?.email || t("header.noEmail")}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-xl border-blue-200 shadow-xl">
                <DropdownMenuLabel className="font-bold text-gray-700">{t("header.myAccount")}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-blue-100" />

                <DropdownMenuItem onClick={() => router.push(`/${user?.role}/profile`)} className="cursor-pointer hover:bg-blue-50 rounded-lg transition-colors">
                  <User className="w-4 h-4 mr-2 text-blue-600" />
                  {t("header.profile")}
                </DropdownMenuItem>

                {user?.role?.toLowerCase() === "parent" && (
                  <DropdownMenuItem onClick={() => router.push("/parent/select-student")}>
                    <Users className="w-4 h-4 mr-2" />
                    {t("header.switchStudent")}
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={() => router.push(`/${user?.role}/settings`)}>
                  <Settings className="w-4 h-4 mr-2" />
                  {t("header.settings")}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-blue-100" />

                <DropdownMenuItem onClick={logout} className="text-red-600 hover:bg-red-50 cursor-pointer rounded-lg font-semibold transition-colors">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t("header.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Page Content */}
        <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-white via-blue-50/20 to-blue-100/30">{children}</main>
      </div>
    </div>
  )
}