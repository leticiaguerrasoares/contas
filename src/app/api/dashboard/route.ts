import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthenticated } from "@/lib/auth"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from "date-fns"

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const upcomingEnd = addDays(now, 30)

    const includeRelations = {
      bill: {
        select: {
          id: true,
          title: true,
          category: true,
          currency: true,
          recurrence: true,
        },
      },
      attachments: true,
    }

    // Executar queries em paralelo
    const [
      dueToday,
      dueThisWeek,
      overdue,
      upcoming,
      recentlyPaid,
      weekTotal,
      monthTotal,
    ] = await Promise.all([
      // Vence hoje
      prisma.billOccurrence.findMany({
        where: {
          dueDate: { gte: todayStart, lte: todayEnd },
          status: "PENDING",
        },
        include: includeRelations,
        orderBy: { dueDate: "asc" },
      }),

      // Vence esta semana (excluindo hoje)
      prisma.billOccurrence.findMany({
        where: {
          dueDate: { gte: weekStart, lte: weekEnd },
          status: "PENDING",
        },
        include: includeRelations,
        orderBy: { dueDate: "asc" },
      }),

      // Atrasadas
      prisma.billOccurrence.findMany({
        where: {
          dueDate: { lt: todayStart },
          status: { in: ["PENDING", "OVERDUE"] },
        },
        include: includeRelations,
        orderBy: { dueDate: "asc" },
        take: 20,
      }),

      // Próximos 30 dias (além desta semana)
      prisma.billOccurrence.findMany({
        where: {
          dueDate: { gt: weekEnd, lte: upcomingEnd },
          status: "PENDING",
        },
        include: includeRelations,
        orderBy: { dueDate: "asc" },
        take: 20,
      }),

      // Pagos recentemente (últimos 7 dias)
      prisma.billOccurrence.findMany({
        where: {
          status: "PAID",
          paidAt: { gte: addDays(now, -7) },
        },
        include: includeRelations,
        orderBy: { paidAt: "desc" },
        take: 5,
      }),

      // Total desta semana
      prisma.billOccurrence.aggregate({
        where: {
          dueDate: { gte: weekStart, lte: weekEnd },
          status: { in: ["PENDING", "OVERDUE"] },
        },
        _sum: { amount: true },
      }),

      // Total deste mês
      prisma.billOccurrence.aggregate({
        where: {
          dueDate: { gte: monthStart, lte: monthEnd },
          status: { in: ["PENDING", "OVERDUE"] },
        },
        _sum: { amount: true },
      }),
    ])

    // Atualizar status OVERDUE automaticamente
    await prisma.billOccurrence.updateMany({
      where: {
        dueDate: { lt: todayStart },
        status: "PENDING",
      },
      data: { status: "OVERDUE" },
    })

    return NextResponse.json({
      dueToday,
      dueThisWeek,
      overdue,
      upcoming,
      recentlyPaid,
      totalDueThisWeek: Number(weekTotal._sum.amount ?? 0),
      totalDueThisMonth: Number(monthTotal._sum.amount ?? 0),
      totalOverdue: overdue.reduce((sum, o) => sum + Number(o.amount), 0),
      countDueToday: dueToday.length,
      countDueThisWeek: dueThisWeek.length,
      countOverdue: overdue.length,
    })
  } catch (error) {
    console.error("GET /api/dashboard error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
