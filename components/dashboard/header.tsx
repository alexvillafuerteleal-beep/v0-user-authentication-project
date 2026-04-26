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
          {/* Tech Futuristic Logo - Sphere with Neon Connection Dots */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="sphereGradient" cx="35%" cy="35%">
                  <stop offset="0%" stopColor="#00D9FF" />
                  <stop offset="70%" stopColor="#00A8FF" />
                  <stop offset="100%" stopColor="#0066FF" />
                </radialGradient>
                <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="strongGlow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle cx="32" cy="32" r="28" fill="url(#sphereGradient)" opacity="0.12" />
              <circle cx="32" cy="32" r="26" fill="none" stroke="url(#sphereGradient)" strokeWidth="1" opacity="0.25" />
              <circle cx="32" cy="32" r="24" fill="none" stroke="#00FF88" strokeWidth="0.8" opacity="0.15" strokeDasharray="3,2" />
              <text x="32" y="38" fontSize="18" fontWeight="bold" textAnchor="middle" fill="#00D9FF" opacity="0.9" filter="url(#strongGlow)" fontFamily="system-ui, -apple-system, sans-serif">Pg</text>
              <circle cx="32" cy="18" r="1.8" fill="#00FF88" filter="url(#neonGlow)" />
              <circle cx="42" cy="22" r="1.6" fill="#00D9FF" filter="url(#neonGlow)" />
              <circle cx="48" cy="30" r="1.5" fill="#00FF88" filter="url(#neonGlow)" />
              <circle cx="16" cy="30" r="1.5" fill="#00FF88" filter="url(#neonGlow)" />
              <circle cx="22" cy="46" r="1.6" fill="#00D9FF" filter="url(#neonGlow)" />
              <circle cx="42" cy="46" r="1.6" fill="#00D9FF" filter="url(#neonGlow)" />
              <line x1="32" y1="18" x2="42" y2="22" stroke="#00D9FF" strokeWidth="0.8" opacity="0.4" />
              <line x1="42" y1="22" x2="48" y2="30" stroke="#00FF88" strokeWidth="0.8" opacity="0.4" />
              <line x1="48" y1="30" x2="42" y2="46" stroke="#00D9FF" strokeWidth="0.8" opacity="0.4" />
              <line x1="42" y1="46" x2="22" y2="46" stroke="#00FF88" strokeWidth="0.8" opacity="0.4" />
              <line x1="22" y1="46" x2="16" y2="30" stroke="#00D9FF" strokeWidth="0.8" opacity="0.4" />
              <line x1="16" y1="30" x2="32" y2="18" stroke="#00FF88" strokeWidth="0.8" opacity="0.4" />
            </svg>
          </div>
          <span className="text-lg font-bold text-foreground hidden sm:inline">PagoIA</span>
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
