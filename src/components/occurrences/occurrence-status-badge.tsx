import { cn } from "@/lib/utils"
import type { OccurrenceStatus } from "@prisma/client"

const statusConfig: Record<
  OccurrenceStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pendente",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  },
  PAID: {
    label: "Pago",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  },
  OVERDUE: {
    label: "Atrasado",
    className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-muted text-muted-foreground border-border",
  },
}

interface OccurrenceStatusBadgeProps {
  status: OccurrenceStatus
  className?: string
  size?: "sm" | "md"
}

export function OccurrenceStatusBadge({
  status,
  className,
  size = "md",
}: OccurrenceStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border rounded-full",
        size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
