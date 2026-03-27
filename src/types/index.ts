import type {
  Bill,
  BillOccurrence,
  Attachment,
  NotificationLog,
  InAppNotification,
  RecurrenceType,
  OccurrenceStatus,
  NotificationChannel,
  NotificationType,
} from "@prisma/client"

// Re-exports
export type {
  Bill,
  BillOccurrence,
  Attachment,
  NotificationLog,
  InAppNotification,
  RecurrenceType,
  OccurrenceStatus,
  NotificationChannel,
  NotificationType,
}

// Bill com relações
export type BillWithOccurrences = Bill & {
  occurrences: BillOccurrence[]
  attachments: Attachment[]
}

export type BillWithNextOccurrence = Bill & {
  occurrences: BillOccurrence[]
  _nextOccurrence?: BillOccurrence | null
}

// Occurrence com relações
export type OccurrenceWithBill = BillOccurrence & {
  bill: Bill
  attachments: Attachment[]
  notificationLogs: NotificationLog[]
}

// Dashboard types
export type DashboardMetrics = {
  dueToday: OccurrenceWithBill[]
  dueThisWeek: OccurrenceWithBill[]
  overdue: OccurrenceWithBill[]
  upcoming: OccurrenceWithBill[]
  recentlyPaid: OccurrenceWithBill[]
  totalDueThisWeek: number
  totalDueThisMonth: number
  totalOverdue: number
  countDueToday: number
  countDueThisWeek: number
  countOverdue: number
}

// Categories
export const BILL_CATEGORIES = [
  { value: "utilities", label: "Utilidades", icon: "⚡" },
  { value: "housing", label: "Moradia", icon: "🏠" },
  { value: "subscription", label: "Assinatura", icon: "📱" },
  { value: "insurance", label: "Seguro", icon: "🛡️" },
  { value: "health", label: "Saúde", icon: "❤️" },
  { value: "education", label: "Educação", icon: "📚" },
  { value: "transport", label: "Transporte", icon: "🚗" },
  { value: "food", label: "Alimentação", icon: "🍽️" },
  { value: "entertainment", label: "Entretenimento", icon: "🎬" },
  { value: "finance", label: "Financeiro", icon: "💰" },
  { value: "taxes", label: "Impostos", icon: "🏛️" },
  { value: "other", label: "Outros", icon: "📋" },
] as const

export type BillCategory = (typeof BILL_CATEGORIES)[number]["value"]

export const PAYMENT_METHODS = [
  { value: "pix", label: "PIX" },
  { value: "boleto", label: "Boleto" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "debit_card", label: "Cartão de Débito" },
  { value: "ted", label: "TED/DOC" },
  { value: "cash", label: "Dinheiro" },
  { value: "other", label: "Outro" },
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"]

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  NONE: "Sem recorrência",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  YEARLY: "Anual",
  CUSTOM: "Personalizado",
  BUSINESS_DAY: "Dia útil mensal",
}

export function getBusinessDayLabel(n: number): string {
  const ordinals: Record<number, string> = {
    1: "1º", 2: "2º", 3: "3º", 4: "4º", 5: "5º",
    6: "6º", 7: "7º", 8: "8º", 9: "9º", 10: "10º",
  }
  return `${ordinals[n] ?? `${n}º`} dia útil de cada mês`
}

export const STATUS_LABELS: Record<OccurrenceStatus, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  OVERDUE: "Atrasado",
  CANCELLED: "Cancelado",
}
