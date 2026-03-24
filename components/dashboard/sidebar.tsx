"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  FileText,
  MessageSquare,
  Table,
  FormInput,
  ChevronRight,
  Search
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const sidebarItems = [
  {
    title: "DASHBOARDS",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, active: true },
      { name: "Dashboard1", href: "/dashboard/analytics", icon: BarChart3, badge: "Pro" },
      { name: "Dashboard2", href: "/dashboard/sales", icon: TrendingUp, badge: "Pro" },
      { name: "Dashboard3", href: "/dashboard/reports", icon: PieChart, badge: "Pro" },
      { name: "Front Pages", href: "#", icon: FileText, expandable: true },
    ]
  },
  {
    title: "AI",
    items: [
      { name: "Ai Table Builder", href: "/dashboard/ai-table", icon: Table },
      { name: "Ai Form Builder", href: "/dashboard/ai-form", icon: FormInput },
    ]
  }
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">M</span>
          </div>
          <span className="text-xl font-bold text-sidebar-foreground">MatDash</span>
        </Link>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar..." 
            className="pl-9 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4 overflow-y-auto">
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
