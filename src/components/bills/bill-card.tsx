"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
  Minus,
} from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { OccurrenceStatusBadge } from "@/components/occurrences/occurrence-status-badge"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { formatDate, cn } from "@/lib/utils"
import { BILL_CATEGORIES, RECURRENCE_LABELS } from "@/types"
import type { Bill, BillOccurrence } from "@prisma/client"

type BillWithOccurrence = Bill & {
  occurrences: BillOccurrence[]
}

interface BillCardProps {
  bill: BillWithOccurrence
  onDeleted?: () => void
}

export function BillCard({ bill, onDeleted }: BillCardProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const category = BILL_CATEGORIES.find((c) => c.value === bill.category)
  const nextOccurrence = bill.occurrences[0]

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/bills/${bill.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao deletar")
      toast.success(`"${bill.title}" removida`)
      setDeleteDialogOpen(false)
      onDeleted?.()
      router.refresh()
    } catch {
      toast.error("Erro ao remover a conta")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div
        className={cn(
          "group relative flex items-start gap-4 p-4 rounded-2xl border bg-card",
          "hover:shadow-sm transition-all",
          !bill.isActive && "opacity-60"
        )}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted text-2xl flex-shrink-0 mt-0.5">
          {category?.icon ?? "📋"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/bills/${bill.id}`}
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
              >
                {bill.title}
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5">
                {category?.label ?? bill.category}
                {bill.recurrence !== "NONE" && (
                  <>
                    <span className="mx-1.5 text-border">·</span>
                    <span className="inline-flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5" />
                      {RECURRENCE_LABELS[bill.recurrence]}
                    </span>
                  </>
                )}
                {bill.recurrence === "NONE" && (
                  <>
                    <span className="mx-1.5 text-border">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Minus className="w-2.5 h-2.5" />
                      Avulsa
                    </span>
                  </>
                )}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "inline-flex items-center justify-center h-8 w-8 rounded-lg",
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                  "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <MoreHorizontal className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => router.push(`/bills/${bill.id}/edit`)}>
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div>
              {nextOccurrence ? (
                <div className="flex items-center gap-2">
                  <OccurrenceStatusBadge status={nextOccurrence.status} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(nextOccurrence.dueDate.toString().split("T")[0])}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Sem vencimentos pendentes</span>
              )}
            </div>
            <CurrencyDisplay
              amount={Number(bill.amount)}
              currency={bill.currency}
              className="text-sm font-semibold"
            />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Remover "${bill.title}"?`}
        description="Esta ação não pode ser desfeita. Todos os vencimentos associados também serão removidos."
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}
