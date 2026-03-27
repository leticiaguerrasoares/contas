import { prisma } from "@/lib/prisma"
import { dispatchNotification } from "@/lib/notifications/notification.service"
import { startOfDay, endOfDay, format } from "date-fns"
import { ptBR } from "date-fns/locale"

export async function runDueDateReminderJob(): Promise<{
  processed: number
  dispatched: number
  errors: string[]
}> {
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)

  const recipient = process.env.NOTIFICATION_EMAIL_TO
  if (!recipient) {
    return { processed: 0, dispatched: 0, errors: ["NOTIFICATION_EMAIL_TO não configurado"] }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  // Buscar ocorrências vencendo hoje ainda pendentes
  const occurrences = await prisma.billOccurrence.findMany({
    where: {
      dueDate: { gte: todayStart, lte: todayEnd },
      status: "PENDING",
      bill: { notifyOnDueDate: true, isActive: true },
    },
    include: { bill: true },
  })

  let dispatched = 0
  const errors: string[] = []

  for (const occ of occurrences) {
    try {
      const result = await dispatchNotification({
        type: "DUE_DATE_REMINDER",
        billOccurrenceId: occ.id,
        recipient,
        idempotencyDate: todayStart,
        data: {
          billTitle: occ.bill.title,
          dueDate: format(occ.dueDate, "yyyy-MM-dd"),
          amount: Number(occ.amount),
          currency: occ.bill.currency,
          category: occ.bill.category,
          barcodeNumber: occ.barcodeNumber ?? occ.bill.barcodeNumber ?? undefined,
          pixKey: occ.pixKey ?? occ.bill.pixKey ?? undefined,
          pixQrCode: occ.pixQrCode ?? occ.bill.pixQrCode ?? undefined,
          paymentInstructions: occ.paymentInstructions ?? occ.bill.paymentInstructions ?? undefined,
          boletoUrl: occ.boletoUrl ?? undefined,
          occurrenceId: occ.id,
          appUrl,
        },
      })

      dispatched += result.dispatched
      if (result.failed > 0) {
        errors.push(...result.results.filter((r) => !r.success).map((r) => r.reason ?? "Erro desconhecido"))
      }
    } catch (err) {
      errors.push(`Erro ao processar ocorrência ${occ.id}: ${err instanceof Error ? err.message : "Desconhecido"}`)
    }
  }

  return { processed: occurrences.length, dispatched, errors }
}
