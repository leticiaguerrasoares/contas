import { Metadata } from "next"
import { OccurrenceRow } from "@/components/occurrences/occurrence-row"
import { EmptyState } from "@/components/shared/empty-state"
import { prisma } from "@/lib/prisma"
import { serialize } from "@/lib/utils"
import { CalendarDays } from "lucide-react"
import { startOfDay } from "date-fns"
import type { OccurrenceStatus } from "@prisma/client"

export const metadata: Metadata = { title: "Vencimentos" }
export const dynamic = "force-dynamic"

async function getOccurrences(status?: string) {
  await prisma.billOccurrence.updateMany({
    where: { dueDate: { lt: startOfDay(new Date()) }, status: "PENDING" },
    data: { status: "OVERDUE" },
  })

  return prisma.billOccurrence.findMany({
    where: status ? { status: status as OccurrenceStatus } : {},
    include: {
      bill: true,
      attachments: true,
      notificationLogs: { orderBy: { sentAt: "desc" }, take: 1 },
    },
    orderBy: [{ dueDate: "asc" }],
    take: 100,
  })
}

export default async function OccurrencesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const occurrences = serialize(await getOccurrences(status))

  const overdue = occurrences.filter((o) => o.status === "OVERDUE")
  const pending = occurrences.filter((o) => o.status === "PENDING")
  const paid = occurrences.filter((o) => o.status === "PAID")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vencimentos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Todos os vencimentos das suas contas
        </p>
      </div>

      {occurrences.length === 0 && (
        <div className="rounded-2xl border bg-card">
          <EmptyState
            icon={CalendarDays}
            title="Nenhum vencimento encontrado"
            description="Crie uma conta para ver os vencimentos aqui."
          />
        </div>
      )}

      {overdue.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-red-600 uppercase tracking-wider">
            Em atraso ({overdue.length})
          </h2>
          <div className="space-y-1.5">
            {overdue.map((occ) => (
              <OccurrenceRow key={occ.id} occurrence={occ} />
            ))}
          </div>
        </section>
      )}

      {pending.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Pendentes ({pending.length})
          </h2>
          <div className="space-y-1.5">
            {pending.map((occ) => (
              <OccurrenceRow key={occ.id} occurrence={occ} />
            ))}
          </div>
        </section>
      )}

      {paid.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Pagos ({paid.length})
          </h2>
          <div className="space-y-1.5">
            {paid.map((occ) => (
              <OccurrenceRow key={occ.id} occurrence={occ} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
