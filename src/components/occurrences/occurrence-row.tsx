"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OccurrenceStatusBadge } from "./occurrence-status-badge"
import { PayDialog } from "./pay-dialog"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { formatDate, formatDateRelative, cn } from "@/lib/utils"
import { BILL_CATEGORIES } from "@/types"
import type { BillOccurrence, Bill } from "@prisma/client"

type OccurrenceWithBill = BillOccurrence & {
  bill: Bill
}

interface OccurrenceRowProps {
  occurrence: OccurrenceWithBill
  onPaid?: () => void
  showBillLink?: boolean
}

export function OccurrenceRow({ occurrence, onPaid, showBillLink = true }: OccurrenceRowProps) {
  const [payDialogOpen, setPayDialogOpen] = useState(false)

  const category = BILL_CATEGORIES.find((c) => c.value === occurrence.bill.category)
  const isPaid = occurrence.status === "PAID"
  const isOverdue = occurrence.status === "OVERDUE"

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-4 px-4 py-3.5 rounded-xl border bg-card",
          "hover:bg-accent/40 transition-colors group",
          isOverdue && "border-red-200 dark:border-red-900/50"
        )}
      >
        {/* Ícone da categoria */}
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-xl text-lg flex-shrink-0",
            isPaid ? "bg-emerald-50 dark:bg-emerald-950" : isOverdue ? "bg-red-50 dark:bg-red-950" : "bg-muted"
          )}
        >
          {category?.icon ?? "📋"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {showBillLink ? (
              <Link
                href={`/bills/${occurrence.billId}`}
                className="text-sm font-medium text-foreground hover:text-primary truncate"
              >
                {occurrence.bill.title}
              </Link>
            ) : (
              <span className="text-sm font-medium text-foreground truncate">
                {occurrence.bill.title}
              </span>
            )}
          </div>
          <p
            className={cn(
              "text-xs mt-0.5",
              isOverdue ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"
            )}
          >
            {isPaid && occurrence.paidAt
              ? `Pago em ${formatDate(occurrence.paidAt)}`
              : formatDateRelative(occurrence.dueDate)}
          </p>
        </div>

        {/* Status Badge */}
        <OccurrenceStatusBadge status={occurrence.status} size="sm" />

        {/* Valor */}
        <CurrencyDisplay
          amount={Number(occurrence.amount)}
          currency={occurrence.bill.currency}
          className={cn(
            "text-sm font-semibold tabular-nums",
            isPaid ? "text-muted-foreground line-through" : isOverdue ? "text-red-600 dark:text-red-400" : ""
          )}
        />

        {/* Ação */}
        {!isPaid && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-3 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
            onClick={(e) => {
              e.preventDefault()
              setPayDialogOpen(true)
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Pagar
          </Button>
        )}

        <Link
          href={`/occurrences/${occurrence.id}`}
          className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {!isPaid && (
        <PayDialog
          occurrence={{ ...occurrence, bill: { title: occurrence.bill.title, currency: occurrence.bill.currency } }}
          open={payDialogOpen}
          onOpenChange={setPayDialogOpen}
          onSuccess={onPaid}
        />
      )}
    </>
  )
}
