"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RegenerateOccurrencesButton({ billId }: { billId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!confirm("Isso vai recalcular todos os vencimentos pendentes com o calendário correto de feriados. Continuar?")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/bills/${billId}/regenerate`, { method: "POST" })
      if (!res.ok) throw new Error("Erro ao recalcular")
      router.refresh()
    } catch {
      alert("Erro ao recalcular vencimentos.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Recalculando…" : "Recalcular vencimentos"}
    </Button>
  )
}
