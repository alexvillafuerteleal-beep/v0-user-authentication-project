"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Droplet,
  FileText,
  History,
  HelpCircle,
  ChevronRight,
  Search,
  User,
  Settings,
  BarChart3
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { LucideIcon } from "lucide-react"

interface SidebarItem {
  name: string
  href: string
  icon: LucideIcon
  badge?: string
  expandable?: boolean
}

interface SidebarSection {
  title: string
  items: SidebarItem[]
}

const sidebarItems: SidebarSection[] = [
  {
    title: "PRINCIPAL",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ]
  },
  {
    title: "GESTIÓN",
    items: [
      { name: "Mis Pagos", href: "/dashboard/servicios", icon: Droplet },
      { name: "Estados de Cuenta", href: "/dashboard/estados", icon: FileText },
      { name: "Historial", href: "/dashboard/historial", icon: History },
      { name: "Comparativo", href: "/dashboard/comparativo", icon: BarChart3 },
      { name: "Soporte", href: "/dashboard/soporte", icon: HelpCircle },
    ]
  },
  {
    title: "USUARIO",
    items: [
      { name: "Mi Perfil", href: "/dashboard/perfil", icon: User },
      { name: "Configuración", href: "/dashboard/configuracion", icon: Settings },
    ]
  }
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [search, setSearch] = useState("")

  const filteredSections = sidebarItems.map(section => ({
    ...section,
    items: section.items.filter(item =>
      !search.trim() || item.name.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(section => section.items.length > 0)

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-all duration-300">
          <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="sphereGradient2" cx="35%" cy="35%">
                <stop offset="0%" stopColor="#00D9FF" />
                <stop offset="70%" stopColor="#00A8FF" />
                <stop offset="100%" stopColor="#0066FF" />
              </radialGradient>
              <filter id="neonGlow2" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="strongGlow2" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle cx="32" cy="32" r="28" fill="url(#sphereGradient2)" opacity="0.12" />
            <circle cx="32" cy="32" r="26" fill="none" stroke="url(#sphereGradient2)" strokeWidth="1" opacity="0.25" />
            <circle cx="32" cy="32" r="24" fill="none" stroke="#00FF88" strokeWidth="0.8" opacity="0.15" strokeDasharray="3,2" />
            <text x="32" y="38" fontSize="18" fontWeight="bold" textAnchor="middle" fill="#00D9FF" opacity="0.9" filter="url(#strongGlow2)" fontFamily="system-ui, -apple-system, sans-serif">Pg</text>
            <circle cx="32" cy="18" r="1.8" fill="#00FF88" filter="url(#neonGlow2)" />
            <circle cx="42" cy="22" r="1.6" fill="#00D9FF" filter="url(#neonGlow2)" />
            <circle cx="48" cy="30" r="1.5" fill="#00FF88" filter="url(#neonGlow2)" />
            <circle cx="16" cy="30" r="1.5" fill="#00FF88" filter="url(#neonGlow2)" />
            <circle cx="22" cy="46" r="1.6" fill="#00D9FF" filter="url(#neonGlow2)" />
            <circle cx="42" cy="46" r="1.6" fill="#00D9FF" filter="url(#neonGlow2)" />
            <line x1="32" y1="18" x2="42" y2="22" stroke="#00D9FF" strokeWidth="0.8" opacity="0.4" />
            <line x1="42" y1="22" x2="48" y2="30" stroke="#00FF88" strokeWidth="0.8" opacity="0.4" />
            <line x1="48" y1="30" x2="42" y2="46" stroke="#00D9FF" strokeWidth="0.8" opacity="0.4" />
            <line x1="42" y1="46" x2="22" y2="46" stroke="#00FF88" strokeWidth="0.8" opacity="0.4" />
            <line x1="22" y1="46" x2="16" y2="30" stroke="#00D9FF" strokeWidth="0.8" opacity="0.4" />
            <line x1="16" y1="30" x2="32" y2="18" stroke="#00FF88" strokeWidth="0.8" opacity="0.4" />
          </svg>
          <span className="text-xl font-bold text-sidebar-foreground">PagoIA</span>
        </Link>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4 overflow-y-auto">
        {filteredSections.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                        isActive 
                          ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <Badge className="bg-primary/20 text-primary text-xs px-2 py-0.5">
                          {item.badge}
                        </Badge>
                      )}
                      {item.expandable && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
