import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"

interface CurrencyDisplayProps {
  amount: number | string
  currency?: string
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

const sizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl font-semibold",
  xl: "text-3xl font-bold tracking-tight",
}

export function CurrencyDisplay({
  amount,
  currency = "BRL",
  className,
  size = "md",
}: CurrencyDisplayProps) {
  return (
    <span className={cn("tabular-nums", sizeClasses[size], className)}>
      {formatCurrency(amount, currency)}
    </span>
  )
}
