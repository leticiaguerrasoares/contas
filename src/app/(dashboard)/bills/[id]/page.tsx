import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Pencil, RefreshCw, Minus } from "lucide-react"
import { buttonVariants } from "@/components/ui/button-variants"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { OccurrenceRow } from "@/components/occurrences/occurrence-row"
import { EmptyState } from "@/components/shared/empty-state"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { CopyButton } from "@/components/shared/copy-button"
import { DocumentSection } from "@/components/shared/attachment-manager"
import { RegenerateOccurrencesButton } from "@/components/bills/regenerate-occurrences-button"
import { prisma } from "@/lib/prisma"
import { BILL_CATEGORIES, RECURRENCE_LABELS } from "@/types"
import { cn, serialize } from "@/lib/utils"
import type { RecurrenceType } from "@prisma/client"
import { CalendarDays } from "lucide-react"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const bill = await prisma.bill.findUnique({ where: { id } })
  return { title: bill?.title ?? "Conta" }
}

export const dynamic = "force-dynamic"

export default async function BillDetailPage({ params }: Props) {
  const { id } = await params

  const bill = await prisma.bill.findUnique({
    where: { id },
    include: {
      occurrences: {
        orderBy: { dueDate: "desc" },
        include: { attachments: true, notificationLogs: true },
      },
      attachments: true,
    },
  })

  if (!bill) notFound()

  const sBill = serialize(bill)
  const category = BILL_CATEGORIES.find((c) => c.value === sBill.category)
  const pendingOccurrences = sBill.occurrences.filter((o: { status: string }) => o.status === "PENDING" || o.status === "OVERDUE")
  const paidOccurrences = sBill.occurrences.filter((o: { status: string }) => o.status === "PAID")

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Link href="/bills" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Contas
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-muted text-3xl flex-shrink-0">
            {category?.icon ?? "📋"}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">{sBill.title}</h1>
              {!sBill.isActive && (
                <Badge variant="secondary" className="text-xs">Inativa</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
              <span>{category?.label ?? sBill.category}</span>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1">
                {sBill.recurrence !== "NONE" ? (
                  <RefreshCw className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {RECURRENCE_LABELS[sBill.recurrence as RecurrenceType]}
              </span>
              <span className="text-border">·</span>
              <CurrencyDisplay amount={Number(sBill.amount)} currency={sBill.currency} className="font-semibold text-foreground" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sBill.recurrence === "BUSINESS_DAY" && (
            <RegenerateOccurrencesButton billId={sBill.id} />
          )}
          <Link href={`/bills/${sBill.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Editar
          </Link>
        </div>
      </div>

      {(sBill.barcodeNumber || sBill.pixKey || sBill.pixQrCode || sBill.paymentInstructions) && (
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Dados de pagamento
          </h2>

          {sBill.barcodeNumber && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Linha digitável</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2.5 py-1.5 rounded-lg font-mono flex-1 break-all">
                  {sBill.barcodeNumber}
                </code>
                <CopyButton text={sBill.barcodeNumber} />
              </div>
            </div>
          )}

          {sBill.pixKey && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Chave PIX</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2.5 py-1.5 rounded-lg font-mono flex-1">
                  {sBill.pixKey}
                </code>
                <CopyButton text={sBill.pixKey} />
              </div>
            </div>
          )}

          {sBill.pixQrCode && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">PIX Copia e Cola</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2.5 py-1.5 rounded-lg font-mono flex-1 break-all line-clamp-2">
                  {sBill.pixQrCode}
                </code>
                <CopyButton text={sBill.pixQrCode} />
              </div>
            </div>
          )}

          {sBill.paymentInstructions && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Instruções</p>
              <p className="text-sm text-foreground bg-muted px-3 py-2 rounded-lg">
                {sBill.paymentInstructions}
              </p>
            </div>
          )}
        </div>
      )}

      {sBill.notes && (
        <div className="rounded-2xl border bg-card p-5 space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Notas</h2>
          <p className="text-sm text-foreground">{sBill.notes}</p>
        </div>
      )}

      {/* Documentos da conta (contrato, CNPJ, boleto fixo) */}
      <DocumentSection
        attachments={sBill.attachments}
        billId={sBill.id}
      />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Pendentes ({pendingOccurrences.length})
        </h2>

        {pendingOccurrences.length === 0 ? (
          <div className="rounded-xl border bg-card py-8">
            <EmptyState
              icon={CalendarDays}
              title="Nenhum vencimento pendente"
              description="Todos os vencimentos desta conta estão pagos."
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            {pendingOccurrences.map((occ: any) => (
              <OccurrenceRow
                key={occ.id}
                occurrence={{ ...occ, bill: sBill }}
                showBillLink={false}
              />
            ))}
          </div>
        )}
      </div>

      {paidOccurrences.length > 0 && (
        <div className="space-y-3">
          <Separator />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Histórico ({paidOccurrences.length})
          </h2>
          <div className="space-y-1.5">
            {paidOccurrences.map((occ: any) => (
              <OccurrenceRow
                key={occ.id}
                occurrence={{ ...occ, bill: sBill }}
                showBillLink={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
