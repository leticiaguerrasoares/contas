"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Settings,
  Receipt,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bills", label: "Contas", icon: FileText },
  { href: "/occurrences", label: "Vencimentos", icon: CalendarDays },
  { href: "/settings", label: "Configurações", icon: Settings },
]

interface MobileNavProps {
  overdueCount?: number
}

export function MobileNav({ overdueCount = 0 }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    toast.success("Você saiu com sucesso")
  }

  return (
    <>
      {/* Header Mobile */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary text-primary-foreground">
            <Receipt className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <span className="text-sm font-semibold">Minhas Contas</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Drawer Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-sidebar border-r border-sidebar-border",
          "transform transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary text-primary-foreground">
              <Receipt className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <span className="text-sm font-semibold text-sidebar-foreground">Minhas Contas</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon
            const showBadge = item.href === "/occurrences" && overdueCount > 0

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                    {overdueCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 px-3 pb-6 border-t border-sidebar-border pt-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            Sair
          </button>
        </div>
      </div>
    </>
  )
}
