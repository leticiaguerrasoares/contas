import { prisma } from "@/lib/prisma"
import { dispatchNotification } from "@/lib/notifications/notification.service"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, format } from "date-fns"

export async function runWeeklySummaryJob(): Promise<{
  occurrencesFound: number
  dispatched: number
  errors: string[]
}> {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const recipient = process.env.NOTIFICATION_EMAIL_TO
  if (!recipient) {
    return { occurrencesFound: 0, dispatched: 0, errors: ["NOTIFICATION_EMAIL_TO não configurado"] }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  // Buscar ocorrências desta semana (pendentes) + atrasadas
  const [weekOccurrences, overdueOccurrences] = await Promise.all([
    prisma.billOccurrence.findMany({
      where: {
        dueDate: { gte: startOfDay(weekStart), lte: endOfDay(weekEnd) },
        status: "PENDING",
        bill: { isActive: true },
      },
      include: { bill: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.billOccurrence.findMany({
      where: {
        dueDate: { lt: startOfDay(now) },
        status: { in: ["PENDING", "OVERDUE"] },
        bill: { isActive: true },
      },
      include: { bill: true },
      orderBy: { dueDate: "asc" },
    }),
  ])

  const allOccurrences = [...overdueOccurrences, ...weekOccurrences]
  const totalAmount = weekOccurrences.reduce((sum, o) => sum + Number(o.amount), 0)
  const overdueAmount = overdueOccurrences.reduce((sum, o) => sum + Number(o.amount), 0)

  const errors: string[] = []

  try {
    const result = await dispatchNotification({
      type: "WEEKLY_SUMMARY",
      recipient,
      idempotencyDate: weekStart, // idempotente por semana
      data: {
        weekStart: format(weekStart, "yyyy-MM-dd"),
        weekEnd: format(weekEnd, "yyyy-MM-dd"),
        occurrences: allOccurrences.map((o) => ({
          id: o.id,
          billTitle: o.bill.title,
          dueDate: format(o.dueDate, "yyyy-MM-dd"),
          amount: Number(o.amount),
          currency: o.bill.currency,
          category: o.bill.category,
          status: o.status,
        })),
        totalAmount,
        overdueCount: overdueOccurrences.length,
        overdueAmount,
        appUrl,
      },
    })

    return {
      occurrencesFound: allOccurrences.length,
      dispatched: result.dispatched,
      errors: result.results.filter((r) => !r.success && !r.skipped).map((r) => r.reason ?? "Erro"),
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : "Erro desconhecido")
    return { occurrencesFound: allOccurrences.length, dispatched: 0, errors }
  }
}
