"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/utils"
import { PAYMENT_METHODS } from "@/types"
import type { BillOccurrence } from "@prisma/client"

const schema = z.object({
  paidAt: z.string(),
  paidAmount: z.string().min(1, "Valor obrigatório"),
  paymentMethod: z.string().optional(),
  paymentNotes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface PayDialogProps {
  occurrence: BillOccurrence & { bill: { title: string; currency: string } }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function PayDialog({ occurrence, open, onOpenChange, onSuccess }: PayDialogProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      paidAt: format(new Date(), "yyyy-MM-dd"),
      paidAmount: String(Number(occurrence.amount).toFixed(2)),
      paymentMethod: "",
      paymentNotes: "",
    },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const res = await fetch(`/api/occurrences/${occurrence.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paidAt: data.paidAt,
          paidAmount: parseFloat(data.paidAmount.replace(",", ".")),
          paymentMethod: data.paymentMethod || undefined,
          paymentNotes: data.paymentNotes || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao registrar pagamento")
      }

      toast.success("Pagamento registrado com sucesso!")
      reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err) || "Erro ao registrar pagamento")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
          <DialogDescription>
            {occurrence.bill.title} —{" "}
            <span className="font-medium text-foreground">
              {formatCurrency(Number(occurrence.amount), occurrence.bill.currency)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="paidAt">Data do pagamento</Label>
              <Input
                id="paidAt"
                type="date"
                {...register("paidAt")}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="paidAmount">Valor pago</Label>
              <Input
                id="paidAmount"
                {...register("paidAmount")}
                placeholder="0,00"
                className="h-10"
              />
              {errors.paidAmount && (
                <p className="text-xs text-destructive">{errors.paidAmount.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Método de pagamento</Label>
            <Select
              value={watch("paymentMethod") ?? ""}
              onValueChange={(v) => setValue("paymentMethod", v as string)}
            >
              <SelectTrigger className="h-10">
                {watch("paymentMethod") ? (
                  <span className="text-sm">
                    {PAYMENT_METHODS.find(m => m.value === watch("paymentMethod"))?.label}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">Selecione (opcional)</span>
                )}
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="paymentNotes">Observações</Label>
            <Textarea
              id="paymentNotes"
              {...register("paymentNotes")}
              placeholder="Opcional — comprovante, referência, etc."
              rows={2}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando…" : "Confirmar pagamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
