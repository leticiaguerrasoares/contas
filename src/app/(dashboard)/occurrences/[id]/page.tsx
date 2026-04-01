import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { buttonVariants } from "@/components/ui/button-variants"
import { OccurrenceStatusBadge } from "@/components/occurrences/occurrence-status-badge"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { CopyButton } from "@/components/shared/copy-button"
import { PayOccurrenceButton } from "@/components/occurrences/pay-occurrence-button"
import { BoletoSection, ComprovanteSection } from "@/components/shared/attachment-manager"
import { prisma } from "@/lib/prisma"
import { BILL_CATEGORIES, PAYMENT_METHODS } from "@/types"
import { cn, formatDate, formatDateLong, serialize } from "@/lib/utils"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const occ = await prisma.billOccurrence.findUnique({
    where: { id },
    include: { bill: true },
  })
  return { title: occ ? `${occ.bill.title} — ${formatDate(occ.dueDate.toString())}` : "Vencimento" }
}

export const dynamic = "force-dynamic"

export default async function OccurrenceDetailPage({ params }: Props) {
  const { id } = await params

  const occurrence = await prisma.billOccurrence.findUnique({
    where: { id },
    include: {
      bill: true,
      attachments: true,
      notificationLogs: { orderBy: { sentAt: "desc" } },
    },
  })

  if (!occurrence) notFound()

  const occurrence_ = serialize(occurrence)
  const category = BILL_CATEGORIES.find((c) => c.value === occurrence_.bill.category)
  const paymentMethod = PAYMENT_METHODS.find((m) => m.value === occurrence_.paymentMethod)

  const barcodeNumber = occurrence_.barcodeNumber || occurrence_.bill.barcodeNumber
  const pixKey = occurrence_.pixKey || occurrence_.bill.pixKey
  const pixQrCode = occurrence_.pixQrCode || occurrence_.bill.pixQrCode
  const paymentInstructions = occurrence_.paymentInstructions || occurrence_.bill.paymentInstructions

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Link href={`/bills/${occurrence_.billId}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {occurrence_.bill.title}
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-muted text-3xl flex-shrink-0">
            {category?.icon ?? "📋"}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{occurrence_.bill.title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatDateLong(occurrence_.dueDate.toString().split("T")[0])}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <OccurrenceStatusBadge status={occurrence_.status} />
              <CurrencyDisplay amount={Number(occurrence_.amount)} currency={occurrence_.bill.currency} className="font-semibold" />
            </div>
          </div>
        </div>

        {occurrence_.status !== "PAID" && (
          <PayOccurrenceButton occurrence={occurrence_} />
        )}
      </div>

      {occurrence_.status === "PAID" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Pagamento confirmado
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {occurrence_.paidAt && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Data do pagamento</p>
                <p className="font-medium">{formatDate(occurrence_.paidAt)}</p>
              </div>
            )}
            {occurrence_.paidAmount && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Valor pago</p>
                <CurrencyDisplay amount={Number(occurrence_.paidAmount)} className="font-medium" />
              </div>
            )}
            {paymentMethod && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Método</p>
                <p className="font-medium">{paymentMethod.label}</p>
              </div>
            )}
            {occurrence_.paymentNotes && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-0.5">Observações</p>
                <p className="font-medium">{occurrence_.paymentNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {(barcodeNumber || pixKey || pixQrCode || paymentInstructions) && (
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Dados de pagamento
          </h2>

          {barcodeNumber && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Linha digitável</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2.5 py-1.5 rounded-lg font-mono flex-1 break-all">
                  {barcodeNumber}
                </code>
                <CopyButton text={barcodeNumber} />
              </div>
            </div>
          )}

          {pixKey && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Chave PIX</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2.5 py-1.5 rounded-lg font-mono flex-1">
                  {pixKey}
                </code>
                <CopyButton text={pixKey} />
              </div>
            </div>
          )}

          {pixQrCode && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">PIX Copia e Cola</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2.5 py-1.5 rounded-lg font-mono flex-1 break-all line-clamp-3">
                  {pixQrCode}
                </code>
                <CopyButton text={pixQrCode} />
              </div>
            </div>
          )}

          {paymentInstructions && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Instruções</p>
              <p className="text-sm bg-muted px-3 py-2 rounded-lg">{paymentInstructions}</p>
            </div>
          )}
        </div>
      )}

      {/* Boleto do mês */}
      <BoletoSection
        attachments={occurrence_.attachments}
        occurrenceId={occurrence_.id}
      />

      {/* Comprovante de pagamento */}
      <ComprovanteSection
        attachments={occurrence_.attachments}
        occurrenceId={occurrence_.id}
      />

      {occurrence_.notificationLogs.length > 0 && (
        <div className="rounded-2xl border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Notificações enviadas
          </h2>
          <div className="space-y-2">
            {occurrence_.notificationLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between text-sm py-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${log.success ? "bg-emerald-500" : "bg-red-500"}`} />
                  <span className="text-muted-foreground capitalize">{log.type.toLowerCase().replace("_", " ")}</span>
                  <span className="text-xs text-muted-foreground">via {log.channel}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(log.sentAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
