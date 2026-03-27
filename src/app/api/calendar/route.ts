import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthenticated } from "@/lib/auth"
import { startOfMonth, endOfMonth, format } from "date-fns"

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()))
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1))

    const date = new Date(year, month - 1, 1)
    const monthStart = startOfMonth(date)
    const monthEnd = endOfMonth(date)

    const occurrences = await prisma.billOccurrence.findMany({
      where: {
        dueDate: { gte: monthStart, lte: monthEnd },
        status: { not: "CANCELLED" },
      },
      select: {
        dueDate: true,
        status: true,
        amount: true,
        bill: { select: { title: true, category: true } },
      },
      orderBy: { dueDate: "asc" },
    })

    // Agrupar por data
    const grouped: Record<string, { status: string; amount: number; title: string; category: string }[]> = {}

    for (const occ of occurrences) {
      const dateKey = format(new Date(occ.dueDate), "yyyy-MM-dd")
      if (!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey].push({
        status: occ.status,
        amount: Number(occ.amount),
        title: occ.bill.title,
        category: occ.bill.category,
      })
    }

    return NextResponse.json({ days: grouped })
  } catch (error) {
    console.error("GET /api/calendar error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
