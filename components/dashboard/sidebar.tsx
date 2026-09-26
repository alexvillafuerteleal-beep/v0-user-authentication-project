"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ScanLine, 
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
import { Logo } from "@/components/brand/logo"

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
      { name: "Recibos", href: "/dashboard/recibos", icon: ScanLine },
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
          <Logo markClassName="h-10 w-10" wordmarkClassName="text-sidebar-foreground" />
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
