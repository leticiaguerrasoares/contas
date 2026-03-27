import { Metadata } from "next"
import Link from "next/link"
import { Plus, FileText } from "lucide-react"
import { buttonVariants } from "@/components/ui/button-variants"
import { BillCard } from "@/components/bills/bill-card"
import { EmptyState } from "@/components/shared/empty-state"
import { prisma } from "@/lib/prisma"
import { serialize } from "@/lib/utils"
import { startOfDay } from "date-fns"

export const metadata: Metadata = { title: "Contas" }
export const dynamic = "force-dynamic"

async function getBills() {
  return prisma.bill.findMany({
    include: {
      occurrences: {
        where: { status: { in: ["PENDING", "OVERDUE"] }, dueDate: { gte: startOfDay(new Date()) } },
        orderBy: { dueDate: "asc" },
        take: 1,
      },
      attachments: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

export default async function BillsPage() {
  const bills = serialize(await getBills())
  const active = bills.filter((b) => b.isActive)
  const inactive = bills.filter((b) => !b.isActive)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {bills.length === 0
              ? "Nenhuma conta cadastrada"
              : `${bills.length} conta${bills.length !== 1 ? "s" : ""} cadastrada${bills.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/bills/new" className={buttonVariants()}>
          <Plus className="w-4 h-4 mr-2" />
          Nova conta
        </Link>
      </div>

      {bills.length === 0 && (
        <div className="rounded-2xl border bg-card">
          <EmptyState
            icon={FileText}
            title="Nenhuma conta cadastrada"
            description="Adicione sua primeira conta para começar a gerenciar seus pagamentos."
            action={
              <Link href="/bills/new" className={buttonVariants()}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar conta
              </Link>
            }
          />
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Ativas ({active.length})
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {active.map((bill) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
        </div>
      )}

      {inactive.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Inativas ({inactive.length})
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {inactive.map((bill) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
