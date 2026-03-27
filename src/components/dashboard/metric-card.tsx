import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  variant?: "default" | "danger" | "warning" | "success" | "info"
  className?: string
}

const variantStyles = {
  default: {
    card: "bg-card border-border",
    icon: "bg-muted text-muted-foreground",
    value: "text-foreground",
  },
  danger: {
    card: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50",
    icon: "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400",
    value: "text-red-700 dark:text-red-400",
  },
  warning: {
    card: "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900/50",
    icon: "bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400",
    value: "text-orange-700 dark:text-orange-400",
  },
  success: {
    card: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50",
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400",
    value: "text-emerald-700 dark:text-emerald-400",
  },
  info: {
    card: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/50",
    icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
    value: "text-blue-700 dark:text-blue-400",
  },
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  className,
}: MetricCardProps) {
  const styles = variantStyles[variant]

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 space-y-3 transition-all hover:shadow-sm",
        styles.card,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", styles.icon)}>
          <Icon className="w-4.5 h-4.5" strokeWidth={1.75} />
        </div>
      </div>
      <div>
        <p className={cn("text-2xl font-bold tracking-tight tabular-nums", styles.value)}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
