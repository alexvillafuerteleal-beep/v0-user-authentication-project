"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Settings, LogOut, User as UserIcon } from "lucide-react"
import { NotificationsDropdown } from "@/components/dashboard/notifications-dropdown"
import type { User } from "@supabase/supabase-js"
import { Logo } from "@/components/brand/logo"

interface DashboardHeaderProps {
  user: User
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const userInitials = user.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : user.email?.charAt(0).toUpperCase() || "U"

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-all duration-300">
          <Logo markClassName="h-10 w-10" wordmarkClassName="text-lg hidden sm:inline" />
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Settings - Hidden on very small screens */}
        <Link href="/dashboard/configuracion" className="hidden sm:block">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-lg">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>

        {/* Notifications */}
        <div className="hidden sm:block">
          <NotificationsDropdown />
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-lg p-0">
              <Avatar className="h-9 w-9 border-2 border-primary">
                <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || ""} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-card border-border" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-foreground flex items-center gap-1">
                  👤 {user.user_metadata?.full_name || "Usuario"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem asChild className="text-foreground hover:bg-secondary cursor-pointer p-0">
              <Link href="/dashboard/perfil" className="flex items-center w-full px-2 py-1.5 gap-2">
                <span className="text-lg">👤</span>
                <span>Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-foreground hover:bg-secondary cursor-pointer p-0">
              <Link href="/dashboard/configuracion" className="flex items-center w-full px-2 py-1.5 gap-2">
                <span className="text-lg">⚙️</span>
                <span>Configuración</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem 
              onClick={handleLogout}
              disabled={loading}
              className="text-red-600 hover:bg-red-500/10 cursor-pointer gap-2"
            >
              <span className="text-lg">🚪</span>
              <span>{loading ? "Cerrando sesión..." : "Cerrar Sesión"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
