import type { NotificationChannel, NotificationType } from "@prisma/client"

export interface NotificationPayload {
  type: NotificationType
  channel: NotificationChannel
  recipient: string
  billOccurrenceId?: string
  subject?: string
  data: Record<string, unknown>
}

export interface NotificationResult {
  success: boolean
  externalId?: string
  errorMessage?: string
}

export interface DispatchResult {
  dispatched: number
  failed: number
  skipped: number
  results: {
    channel: NotificationChannel
    success: boolean
    skipped?: boolean
    reason?: string
  }[]
}

// Payload tipado para templates de email
export interface DueDateReminderData {
  billTitle: string
  dueDate: string
  amount: number
  currency: string
  category: string
  barcodeNumber?: string
  pixKey?: string
  pixQrCode?: string
  paymentInstructions?: string
  boletoUrl?: string
  occurrenceId: string
  appUrl: string
}

export interface WeeklySummaryData {
  weekStart: string
  weekEnd: string
  occurrences: {
    id: string
    billTitle: string
    dueDate: string
    amount: number
    currency: string
    category: string
    status: string
  }[]
  totalAmount: number
  overdueCount: number
  overdueAmount: number
  appUrl: string
}
