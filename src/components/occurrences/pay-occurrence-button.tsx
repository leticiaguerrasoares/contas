"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PayDialog } from "./pay-dialog"
import type { BillOccurrence, Bill } from "@prisma/client"

interface PayOccurrenceButtonProps {
  occurrence: BillOccurrence & { bill: Bill }
}

export function PayOccurrenceButton({ occurrence }: PayOccurrenceButtonProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <CheckCircle2 className="w-4 h-4 mr-1.5" />
        Marcar como pago
      </Button>

      <PayDialog
        occurrence={{
          ...occurrence,
          bill: { title: occurrence.bill.title, currency: occurrence.bill.currency },
        }}
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => router.refresh()}
      />
    </>
  )
}
