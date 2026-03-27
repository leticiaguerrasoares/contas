"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PendingAttachments, type PendingFile } from "@/components/shared/attachment-manager"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RecurrenceSelector } from "./recurrence-selector"
import { createBillSchema, type CreateBillInput } from "@/lib/validations/bill.schema"
import { BILL_CATEGORIES } from "@/types"
import { format } from "date-fns"
import type { Bill } from "@prisma/client"

interface BillFormProps {
  bill?: Bill
  mode?: "create" | "edit"
}

export function BillForm({ bill, mode = "create" }: BillFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])

  const defaultValues: Partial<CreateBillInput> = bill
    ? {
        title: bill.title,
        description: bill.description ?? "",
        category: bill.category,
        amount: Number(bill.amount),
        currency: bill.currency,
        recurrence: bill.recurrence,
        startDate: format(new Date(bill.startDate), "yyyy-MM-dd"),
        endDate: bill.endDate ? format(new Date(bill.endDate), "yyyy-MM-dd") : "",
        barcodeNumber: bill.barcodeNumber ?? "",
        pixKey: bill.pixKey ?? "",
        pixQrCode: bill.pixQrCode ?? "",
        paymentInstructions: bill.paymentInstructions ?? "",
        notes: bill.notes ?? "",
        notifyOnDueDate: bill.notifyOnDueDate,
        isActive: bill.isActive,
      }
    : {
        currency: "BRL",
        recurrence: "MONTHLY",
        startDate: format(new Date(), "yyyy-MM-dd"),
        notifyOnDueDate: true,
        notifyDaysBefore: [1],
        isActive: true,
      }

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createBillSchema) as any,
    defaultValues,
  })

  const watchedRecurrence = watch("recurrence")
  const watchedStartDate = watch("startDate")
  const watchedCustomDays = watch("customIntervalDays")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(data: any) {
    setLoading(true)
    try {
      const url = mode === "edit" && bill ? `/api/bills/${bill.id}` : "/api/bills"
      const method = mode === "edit" ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }

      const saved = await res.json()

      // Upload de arquivos pendentes (só na criação)
      if (mode === "create" && pendingFiles.length > 0) {
        await Promise.allSettled(
          pendingFiles.map(({ file }) => {
            const fd = new FormData()
            fd.append("file", file)
            fd.append("billId", saved.id)
            fd.append("type", "DOCUMENT")
            return fetch("/api/attachments", { method: "POST", body: fd })
          })
        )
      }

      toast.success(mode === "edit" ? "Conta atualizada!" : "Conta criada com sucesso!")
      router.push(`/bills/${saved.id}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar a conta")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Seção 1: Informações básicas */}
      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Informações básicas</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Nome, categoria e descrição da conta</p>
        </div>
        <Separator />

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Nome da conta <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Ex: Internet Vivo, Aluguel, Netflix…"
              className="h-11"
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Categoria <span className="text-destructive">*</span></Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <SelectTrigger className="h-11 w-full">
                      {field.value ? (
                        <span className="flex items-center gap-1.5 text-sm">
                          {BILL_CATEGORIES.find(c => c.value === field.value)?.icon}
                          {" "}
                          {BILL_CATEGORIES.find(c => c.value === field.value)?.label}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Selecione a categoria</span>
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {BILL_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <span className="mr-2">{cat.icon}</span>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                {...register("description")}
                placeholder="Opcional"
                className="h-11"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seção 2: Valor e recorrência */}
      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Valor e vencimento</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Quanto custa e quando vence</p>
        </div>
        <Separator />

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Valor <span className="text-destructive">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  R$
                </span>
                <Input
                  id="amount"
                  {...register("amount")}
                  placeholder="0,00"
                  className="h-11 pl-9"
                />
              </div>
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message as string}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="startDate">Data de início <span className="text-destructive">*</span></Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
                className="h-11"
              />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
            </div>
          </div>

          <Controller
            name="recurrence"
            control={control}
            render={({ field }) => (
              <RecurrenceSelector
                value={field.value ?? "NONE"}
                onChange={(v) => {
                  field.onChange(v)
                  if (v === "BUSINESS_DAY" && !watchedCustomDays) {
                    setValue("customIntervalDays", 5)
                  }
                }}
                customIntervalDays={watchedCustomDays}
                onCustomIntervalDaysChange={(n) => setValue("customIntervalDays", n)}
                startDate={watchedStartDate}
              />
            )}
          />

          {watchedRecurrence !== "NONE" && (
            <div className="space-y-1.5">
              <Label htmlFor="endDate">Data de encerramento</Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">Deixe vazio para recorrência indefinida</p>
            </div>
          )}
        </div>
      </div>

      {/* Seção 3: Dados de pagamento */}
      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Dados de pagamento</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Código de barras, PIX ou outras informações</p>
        </div>
        <Separator />

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="barcodeNumber">Linha digitável / Código de barras</Label>
            <Input
              id="barcodeNumber"
              {...register("barcodeNumber")}
              placeholder="00000.00000 00000.000000 00000.000000 0 00000000000000"
              className="h-11 font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pixKey">Chave PIX</Label>
              <Input
                id="pixKey"
                {...register("pixKey")}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pixQrCode">Código PIX (copia e cola)</Label>
              <Input
                id="pixQrCode"
                {...register("pixQrCode")}
                placeholder="00020126…"
                className="h-11 font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="paymentInstructions">Instruções de pagamento</Label>
            <Textarea
              id="paymentInstructions"
              {...register("paymentInstructions")}
              placeholder="Instruções específicas, onde pagar, referências…"
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
      </div>

      {/* Seção 4: Notas */}
      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Notas</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Observações pessoais sobre esta conta</p>
        </div>
        <Separator />

        <div className="space-y-1.5">
          <Textarea
            {...register("notes")}
            placeholder="Anotações, contratos, referências…"
            rows={3}
            className="resize-none"
          />
        </div>
      </div>

      {/* Seção 5: Documentos (só na criação) */}
      {mode === "create" && (
        <PendingAttachments files={pendingFiles} onChange={setPendingFiles} />
      )}

      {/* Ações */}
      <div className="flex items-center justify-end gap-3 pb-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="min-w-32">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando…
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {mode === "edit" ? "Salvar alterações" : "Criar conta"}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
