"use client"

import { useState, useEffect, useCallback } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
  addMonths,
  subMonths,
  isSameMonth,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"

type DayEntry = {
  status: string
  amount: number
  title: string
  category: string
}

type CalendarData = {
  days: Record<string, DayEntry[]>
}

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

function DaySkeleton() {
  return (
    <div className="flex flex-col items-center rounded-lg py-1.5 min-h-[52px] animate-pulse">
      <div className="w-5 h-3 bg-muted rounded mb-1.5" />
      <div className="w-3 h-1.5 bg-muted rounded" />
    </div>
  )
}

export function DashboardCalendar() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [data, setData] = useState<CalendarData>({ days: {} })
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const fetchData = useCallback(async (date: Date) => {
    setLoading(true)
    try {
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const res = await fetch(`/api/calendar?year=${year}&month=${month}`)
      const json = await res.json()
      setData(json)
    } catch {
      setData({ days: {} })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(currentMonth)
    setSelectedDay(null)
  }, [currentMonth, fetchData])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Segunda = 0 offset (getDay retorna 0=Dom, convertemos para Seg=0)
  const startOffset = (getDay(monthStart) + 6) % 7

  const selectedDayData = selectedDay ? (data.days[selectedDay] ?? []) : []
  const totalSelectedAmount = selectedDayData.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className={cn(
              "px-2 py-1 text-xs rounded-lg transition-colors font-medium",
              isSameMonth(currentMonth, new Date())
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Hoje
          </button>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Dias da semana */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1.5">
              {d}
            </div>
          ))}
        </div>

        {/* Grade */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Células vazias antes do início do mês */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[52px]" />
          ))}

          {loading
            ? days.map((_, i) => <DaySkeleton key={i} />)
            : days.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd")
                const dayData = data.days[dateKey] ?? []
                const hasOverdue = dayData.some((d) => d.status === "OVERDUE")
                const hasPending = dayData.some((d) => d.status === "PENDING")
                const hasPaid = dayData.some((d) => d.status === "PAID")
                const today = isToday(day)
                const isSelected = selectedDay === dateKey
                const hasBills = dayData.length > 0

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDay(isSelected ? null : dateKey)}
                    className={cn(
                      "relative flex flex-col items-center rounded-xl py-1.5 px-1 min-h-[52px] transition-all text-left",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                      today && !isSelected && "ring-1 ring-primary/40 bg-primary/5",
                      isSelected && "bg-primary/15 ring-1 ring-primary/50",
                      !today && !isSelected && hasBills && "hover:bg-muted/70 cursor-pointer",
                      !hasBills && "cursor-default"
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs font-medium leading-none w-6 h-6 flex items-center justify-center rounded-full",
                        today && "bg-primary text-primary-foreground font-bold",
                        !today && hasBills && "text-foreground",
                        !today && !hasBills && "text-muted-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>

                    {hasBills && (
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                        {hasOverdue && (
                          <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                        )}
                        {hasPending && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                        {hasPaid && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </div>
                    )}

                    {hasBills && dayData.length > 1 && (
                      <span className="text-[9px] text-muted-foreground leading-none mt-0.5">
                        {dayData.length}
                      </span>
                    )}
                  </button>
                )
              })}
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
            Em atraso
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            Pendente
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            Pago
          </div>
        </div>
      </div>

      {/* Painel de detalhes do dia selecionado */}
      {selectedDay && selectedDayData.length > 0 && (
        <div className="border-t bg-muted/30 px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground capitalize">
              {format(new Date(selectedDay + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
            <p className="text-xs font-semibold text-foreground">
              {formatCurrency(totalSelectedAmount)}
            </p>
          </div>
          <div className="space-y-1.5">
            {selectedDayData.map((entry, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full flex-shrink-0",
                      entry.status === "OVERDUE" && "bg-destructive",
                      entry.status === "PENDING" && "bg-primary",
                      entry.status === "PAID" && "bg-emerald-500"
                    )}
                  />
                  <span className="text-xs text-foreground truncate">{entry.title}</span>
                </div>
                <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                  {formatCurrency(entry.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
