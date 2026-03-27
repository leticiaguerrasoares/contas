import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, isToday, isTomorrow, isPast, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

export function formatCurrency(
  amount: number | string,
  currency = "BRL"
): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

function toDate(date: Date | string): Date {
  if (date instanceof Date) return date
  // ISO strings (from Prisma/JSON): "2026-03-10T00:00:00.000Z"
  // Plain date strings: "2026-03-10"
  return new Date(date.includes("T") ? date : date + "T12:00:00")
}

export function formatDate(date: Date | string, pattern = "dd/MM/yyyy"): string {
  const d = toDate(date)
  if (isNaN(d.getTime())) return "—"
  return format(d, pattern, { locale: ptBR })
}

export function formatDateRelative(date: Date | string): string {
  const d = toDate(date)
  if (isNaN(d.getTime())) return "—"

  if (isToday(d)) return "Hoje"
  if (isTomorrow(d)) return "Amanhã"

  const diff = differenceInDays(d, new Date())
  if (diff < 0) {
    const absDiff = Math.abs(diff)
    if (absDiff === 1) return "Atrasado há 1 dia"
    return `Atrasado há ${absDiff} dias`
  }
  if (diff <= 7) return `Em ${diff} dias`

  return format(d, "dd MMM", { locale: ptBR })
}

export function formatDateLong(date: Date | string): string {
  const d = toDate(date)
  if (isNaN(d.getTime())) return "—"
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function isDueSoon(date: Date | string, days = 3): boolean {
  const d = typeof date === "string" ? new Date(date + "T12:00:00") : date
  const diff = differenceInDays(d, new Date())
  return diff >= 0 && diff <= days
}

export function isOverdue(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date + "T12:00:00") : date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d < today
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + "…"
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
