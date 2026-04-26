"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Droplet,
  FileText,
  History,
  HelpCircle,
  User,
  Settings,
  Menu,
  X,
  BarChart3
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"

const sidebarItems = [
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

export function MobileNavigation() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <nav className="bg-card border-t border-border w-full">
      <Sheet open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex-1" />
          
          <SheetTrigger asChild>
            <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <Menu className="w-6 h-6 text-foreground" />
            </button>
          </SheetTrigger>
        </div>

        <SheetContent side="left" className="w-64 bg-sidebar border-r border-border p-0">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-4 border-b border-sidebar-border">
              <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-all duration-300">
                <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="logoBg2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0ea5e9" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                    <filter id="logoGlow2">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <circle cx="32" cy="32" r="30" fill="url(#logoBg2)" opacity="0.15" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke="url(#logoBg2)" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.4" />
                  <g filter="url(#logoGlow2)">
                    <rect x="18" y="16" width="28" height="6" rx="2" fill="url(#logoBg2)" opacity="0.9" />
                    <circle cx="24" cy="34" r="2.5" fill="#10b981" />
                    <circle cx="32" cy="34" r="2.5" fill="#06b6d4" />
                    <circle cx="40" cy="34" r="2.5" fill="#10b981" />
                    <path d="M 20 44 Q 32 48 44 44" stroke="url(#logoBg2)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  </g>
                  <line x1="14" y1="14" x2="18" y2="14" stroke="#06b6d4" strokeWidth="1.5" opacity="0.6" />
                  <line x1="14" y1="14" x2="14" y2="18" stroke="#06b6d4" strokeWidth="1.5" opacity="0.6" />
                  <line x1="50" y1="50" x2="46" y2="50" stroke="#10b981" strokeWidth="1.5" opacity="0.6" />
                  <line x1="50" y1="50" x2="50" y2="46" stroke="#10b981" strokeWidth="1.5" opacity="0.6" />
                </svg>
                <span className="text-xl font-bold text-sidebar-foreground">PagoIA</span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto">
              {sidebarItems.map((section) => (
                <div key={section.title} className="mb-6">
                  <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </p>
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <li key={item.name}>
                          <SheetClose asChild>
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
                              <span>{item.name}</span>
                            </Link>
                          </SheetClose>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-sidebar-border text-xs text-muted-foreground text-center">
              <p>PagoIA v2.0</p>
              <p>© 2026 All rights reserved</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Bottom Navigation Bar */}
      <div className="flex items-center justify-around px-2 py-2 bg-card/50 backdrop-blur">
        {sidebarItems[1].items.slice(0, 4).map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs hidden sm:inline">{item.name.split(" ")[0]}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}