"use client"

import { useRouter } from "next/navigation"
import { OccurrenceRow } from "@/components/occurrences/occurrence-row"
import { EmptyState } from "@/components/shared/empty-state"
import { CalendarCheck } from "lucide-react"
import type { BillOccurrence, Bill } from "@prisma/client"

type OccurrenceWithBill = BillOccurrence & { bill: Bill }

interface UpcomingListProps {
  occurrences: OccurrenceWithBill[]
  title: string
  emptyMessage?: string
  onPaid?: () => void
}

export function UpcomingList({ occurrences, title, emptyMessage, onPaid }: UpcomingListProps) {
  const router = useRouter()

  function handlePaid() {
    router.refresh()
    onPaid?.()
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
        {title}
      </h3>
      {occurrences.length === 0 ? (
        <div className="rounded-xl border bg-card py-8">
          <EmptyState
            icon={CalendarCheck}
            title="Nenhum vencimento"
            description={emptyMessage}
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          {occurrences.map((occ) => (
            <OccurrenceRow
              key={occ.id}
              occurrence={occ}
              onPaid={handlePaid}
            />
          ))}
        </div>
      )}
    </div>
  )
}
