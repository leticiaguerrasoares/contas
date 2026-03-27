"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Settings,
  Receipt,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bills", label: "Contas", icon: FileText },
  { href: "/occurrences", label: "Vencimentos", icon: CalendarDays },
  { href: "/settings", label: "Configurações", icon: Settings },
]

interface SidebarProps {
  overdueCount?: number
}

export function Sidebar({ overdueCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    toast.success("Você saiu com sucesso")
  }

  return (
    <aside className="hidden lg:flex flex-col w-60 h-full bg-sidebar border-r border-sidebar-border shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground">
          <Receipt className="w-4.5 h-4.5" strokeWidth={1.75} />
        </div>
        <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">
          Minhas Contas
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon
          const showBadge = item.href === "/occurrences" && overdueCount > 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300">
                  {overdueCount > 99 ? "99+" : overdueCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-sidebar-border pt-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.75} />
          Sair
        </button>
      </div>
    </aside>
  )
}
