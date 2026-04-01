"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { previewNextDates } from "@/lib/occurrences/generator"
import { getBusinessDayLabel } from "@/types"
import type { RecurrenceType } from "@prisma/client"

const ORDINALS = ["1º", "2º", "3º", "4º", "5º", "6º", "7º", "8º", "9º", "10º"]

const options: { value: RecurrenceType; label: string; description: string }[] = [
  { value: "NONE",         label: "Avulsa",    description: "Único vencimento" },
  { value: "WEEKLY",       label: "Semanal",   description: "Toda semana" },
  { value: "MONTHLY",      label: "Mensal",    description: "Todo mês" },
  { value: "BUSINESS_DAY", label: "Dia útil",  description: "Nth dia útil/mês" },
]

interface RecurrenceSelectorProps {
  value: RecurrenceType
  onChange: (value: RecurrenceType) => void
  customIntervalDays?: number | null
  onCustomIntervalDaysChange?: (days: number) => void
  startDate?: string
}

export function RecurrenceSelector({
  value,
  onChange,
  customIntervalDays,
  onCustomIntervalDaysChange,
  startDate,
}: RecurrenceSelectorProps) {
  const businessDay = customIntervalDays ?? 5

  const previewDates = useMemo(() => {
    if (!startDate || value === "NONE") return []
    try {
      return previewNextDates({
        startDate: new Date(startDate),
        recurrence: value,
        customIntervalDays: value === "BUSINESS_DAY" ? businessDay : customIntervalDays,
        count: 4,
      })
    } catch {
      return []
    }
  }, [value, startDate, businessDay, customIntervalDays])

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Recorrência</Label>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-col items-start px-3.5 py-3 rounded-xl border text-left transition-all",
              value === option.value
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/50"
            )}
          >
            <span className="text-sm font-medium">{option.label}</span>
            <span className="text-xs text-muted-foreground mt-0.5">
              {option.value === "BUSINESS_DAY" && value === "BUSINESS_DAY"
                ? `${ORDINALS[(businessDay ?? 1) - 1] ?? businessDay + "º"} dia útil`
                : option.description}
            </span>
          </button>
        ))}
      </div>

      {/* Picker do dia útil — só aparece quando BUSINESS_DAY selecionado */}
      {value === "BUSINESS_DAY" && (
        <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">Qual dia útil do mês?</p>
            <span className="text-xs text-muted-foreground">
              {getBusinessDayLabel(businessDay)}
            </span>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {ORDINALS.map((label, i) => {
              const n = i + 1
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onCustomIntervalDaysChange?.(n)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg py-2 text-xs font-medium transition-all border",
                    businessDay === n
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted"
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            💡 Finais de semana e feriados do Estado do Rio de Janeiro são pulados automaticamente.
          </p>
        </div>
      )}

      {/* Preview das próximas datas */}
      {value !== "NONE" && previewDates.length > 0 && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          Próximos vencimentos:{" "}
          {previewDates.map((d, i) => (
            <span key={i}>
              {format(d, "dd/MM/yyyy", { locale: ptBR })}
              {i < previewDates.length - 1 ? ", " : "…"}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
