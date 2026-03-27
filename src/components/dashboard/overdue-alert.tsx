"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import { OccurrenceRow } from "@/components/occurrences/occurrence-row"
import type { BillOccurrence, Bill } from "@prisma/client"

type OccurrenceWithBill = BillOccurrence & { bill: Bill }

interface OverdueAlertProps {
  occurrences: OccurrenceWithBill[]
}

export function OverdueAlert({ occurrences }: OverdueAlertProps) {
  const router = useRouter()

  if (occurrences.length === 0) return null

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/50 p-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/50">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
            {occurrences.length === 1
              ? "1 conta em atraso"
              : `${occurrences.length} contas em atraso`}
          </h3>
          <p className="text-xs text-red-600/80 dark:text-red-400/70">
            Pague o quanto antes para evitar juros e multas
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        {occurrences.map((occ) => (
          <OccurrenceRow
            key={occ.id}
            occurrence={occ}
            onPaid={() => router.refresh()}
          />
        ))}
      </div>
    </div>
  )
}
