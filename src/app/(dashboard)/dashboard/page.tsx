import { Metadata } from "next"
import Link from "next/link"
import { AlertTriangle, CalendarClock, Clock, TrendingUp, Plus, CheckCircle2 } from "lucide-react"
import { buttonVariants } from "@/components/ui/button-variants"
import { MetricCard } from "@/components/dashboard/metric-card"
import { UpcomingList } from "@/components/dashboard/upcoming-list"
import { OverdueAlert } from "@/components/dashboard/overdue-alert"
import { DashboardCalendar } from "@/components/dashboard/dashboard-calendar"
import { OccurrenceRow } from "@/components/occurrences/occurrence-row"
import { EmptyState } from "@/components/shared/empty-state"
import { prisma } from "@/lib/prisma"
import { formatCurrency, serialize } from "@/lib/utils"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from "date-fns"

export const metadata: Metadata = { title: "Dashboard" }
export const dynamic = "force-dynamic"

async function getDashboardData() {
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const upcomingEnd = addDays(now, 30)

  // Marcar atrasadas primeiro
  await prisma.billOccurrence.updateMany({
    where: { dueDate: { lt: todayStart }, status: "PENDING" },
    data: { status: "OVERDUE" },
  })

  const [dueToday, dueThisWeek, overdue, upcoming, recentlyPaid, weekTotal, monthTotal] =
    await Promise.all([
      prisma.billOccurrence.findMany({
        where: { dueDate: { gte: todayStart, lte: todayEnd }, status: "PENDING" },
        include: { bill: true, attachments: true },
        orderBy: { dueDate: "asc" },
      }),
      prisma.billOccurrence.findMany({
        where: { dueDate: { gte: todayStart, lte: weekEnd }, status: "PENDING" },
        include: { bill: true, attachments: true },
        orderBy: { dueDate: "asc" },
        take: 10,
      }),
      prisma.billOccurrence.findMany({
        where: { dueDate: { lt: todayStart }, status: { in: ["PENDING", "OVERDUE"] } },
        include: { bill: true, attachments: true },
        orderBy: { dueDate: "asc" },
        take: 10,
      }),
      prisma.billOccurrence.findMany({
        where: { dueDate: { gt: weekEnd, lte: upcomingEnd }, status: "PENDING" },
        include: { bill: true, attachments: true },
        orderBy: { dueDate: "asc" },
        take: 8,
      }),
      prisma.billOccurrence.findMany({
        where: { status: "PAID", paidAt: { gte: addDays(now, -7) } },
        include: { bill: true, attachments: true },
        orderBy: { paidAt: "desc" },
        take: 5,
      }),
      prisma.billOccurrence.aggregate({
        where: { dueDate: { gte: weekStart, lte: weekEnd }, status: { in: ["PENDING", "OVERDUE"] } },
        _sum: { amount: true },
      }),
      prisma.billOccurrence.aggregate({
        where: { dueDate: { gte: monthStart, lte: monthEnd }, status: { in: ["PENDING", "OVERDUE"] } },
        _sum: { amount: true },
      }),
    ])

  return {
    dueToday,
    dueThisWeek,
    overdue,
    upcoming,
    recentlyPaid,
    totalDueThisWeek: Number(weekTotal._sum.amount ?? 0),
    totalDueThisMonth: Number(monthTotal._sum.amount ?? 0),
    totalOverdue: overdue.reduce((sum, o) => sum + Number(o.amount), 0),
  }
}

export default async function DashboardPage() {
  const data = serialize(await getDashboardData())

  const hasAnything =
    data.dueToday.length > 0 ||
    data.dueThisWeek.length > 0 ||
    data.overdue.length > 0 ||
    data.upcoming.length > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visão geral das suas contas</p>
        </div>
        <Link href="/bills/new" className={buttonVariants()}>
          <Plus className="w-4 h-4 mr-2" />
          Nova conta
        </Link>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Vence hoje"
          value={data.dueToday.length}
          subtitle={data.dueToday.length > 0 ? "Requer atenção agora" : "Nenhum hoje"}
          icon={Clock}
          variant={data.dueToday.length > 0 ? "warning" : "default"}
        />
        <MetricCard
          title="Em atraso"
          value={data.overdue.length}
          subtitle={data.totalOverdue > 0 ? formatCurrency(data.totalOverdue) : "Tudo em dia"}
          icon={AlertTriangle}
          variant={data.overdue.length > 0 ? "danger" : "success"}
        />
        <MetricCard
          title="Esta semana"
          value={formatCurrency(data.totalDueThisWeek)}
          subtitle={`${data.dueThisWeek.length} vencimento${data.dueThisWeek.length !== 1 ? "s" : ""}`}
          icon={CalendarClock}
          variant="info"
        />
        <MetricCard
          title="Este mês"
          value={formatCurrency(data.totalDueThisMonth)}
          subtitle="Pendente de pagamento"
          icon={TrendingUp}
          variant="default"
        />
      </div>

      {/* Layout principal: listas à esquerda, calendário à direita */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Coluna esquerda: alertas e listas */}
        <div className="space-y-6">
          {/* Vazio total */}
          {!hasAnything && (
            <div className="rounded-2xl border bg-card">
              <EmptyState
                icon={CheckCircle2}
                title="Tudo em dia!"
                description="Você não tem contas pendentes. Adicione uma nova conta para começar."
                action={
                  <Link href="/bills/new" className={buttonVariants()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar conta
                  </Link>
                }
              />
            </div>
          )}

          {data.overdue.length > 0 && <OverdueAlert occurrences={data.overdue} />}

          {data.dueToday.length > 0 && (
            <UpcomingList occurrences={data.dueToday} title="Vence hoje" emptyMessage="Nenhuma conta vence hoje" />
          )}

          {data.dueThisWeek.length > 0 && (
            <UpcomingList occurrences={data.dueThisWeek} title="Esta semana" emptyMessage="Nenhuma conta esta semana" />
          )}

          {data.upcoming.length > 0 && (
            <UpcomingList occurrences={data.upcoming} title="Próximos vencimentos" emptyMessage="Nenhum vencimento em breve" />
          )}

          {data.recentlyPaid.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Pagos recentemente
              </h3>
              <div className="space-y-1.5">
                {data.recentlyPaid.map((occ) => (
                  <OccurrenceRow key={occ.id} occurrence={occ} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Coluna direita: calendário fixo */}
        <div className="xl:sticky xl:top-6">
          <DashboardCalendar />
        </div>
      </div>
    </div>
  )
}
