import { addWeeks, addMonths, addYears, addDays, isBefore, startOfDay } from "date-fns"
import type { RecurrenceType } from "@prisma/client"

export interface OccurrenceTemplate {
  dueDate: Date
  amount: number
  occurrenceIndex: number
}

/** Algoritmo de Meeus/Jones/Butcher para calcular a Páscoa */
function getEasterDate(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1 // 0-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month, day)
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

const holidayCache = new Map<number, Set<string>>()

/**
 * Retorna os feriados do ano para o Estado do Rio de Janeiro.
 * Inclui feriados nacionais + estaduais + Carnaval.
 */
function getHolidaysForYear(year: number): Set<string> {
  if (holidayCache.has(year)) return holidayCache.get(year)!

  const h = new Set<string>()
  const add = (month: number, day: number) => h.add(dateKey(new Date(year, month - 1, day)))
  const addDate = (d: Date) => h.add(dateKey(d))
  const shift = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000)

  // Feriados nacionais fixos
  add(1, 1)   // Ano Novo
  add(4, 21)  // Tiradentes
  add(5, 1)   // Dia do Trabalho
  add(9, 7)   // Independência do Brasil
  add(10, 12) // Nossa Senhora Aparecida
  add(11, 2)  // Finados
  add(11, 15) // Proclamação da República
  add(11, 20) // Consciência Negra (Lei 14.759/2023)
  add(12, 25) // Natal

  // Feriados estaduais — Estado do Rio de Janeiro
  add(4, 23)  // Dia de São Jorge

  // Feriados móveis baseados na Páscoa
  const easter = getEasterDate(year)
  addDate(shift(easter, -48)) // Segunda de Carnaval
  addDate(shift(easter, -47)) // Terça de Carnaval
  addDate(shift(easter, -2))  // Sexta-feira Santa
  addDate(shift(easter, 60))  // Corpus Christi

  holidayCache.set(year, h)
  return h
}

/**
 * Retorna o N-ésimo dia útil do mês considerando finais de semana e
 * feriados nacionais + estaduais do Rio de Janeiro.
 * Se o mês tiver menos dias úteis que N, retorna o último dia útil.
 */
function getNthBusinessDay(year: number, month: number, n: number): Date {
  const holidays = getHolidaysForYear(year)
  let count = 0
  let lastBusinessDay: Date | null = null
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dow = date.getDay() // 0=Dom, 6=Sab
    if (dow !== 0 && dow !== 6 && !holidays.has(dateKey(date))) {
      count++
      lastBusinessDay = date
      if (count === n) return startOfDay(date)
    }
  }
  return startOfDay(lastBusinessDay ?? new Date(year, month, 1))
}

/**
 * Gera as datas de vencimento para uma conta recorrente.
 * Gera um horizonte de 12 meses à frente.
 */
export function generateOccurrenceDates(params: {
  startDate: Date
  recurrence: RecurrenceType
  amount: number
  endDate?: Date | null
  customIntervalDays?: number | null
  horizonMonths?: number
}): OccurrenceTemplate[] {
  const { startDate, recurrence, amount, endDate, customIntervalDays, horizonMonths = 12 } = params

  if (recurrence === "NONE") {
    return [{ dueDate: startOfDay(startDate), amount, occurrenceIndex: 0 }]
  }

  const horizon = addMonths(new Date(), horizonMonths)
  const effectiveEnd = endDate ? (isBefore(endDate, horizon) ? endDate : horizon) : horizon

  // ── BUSINESS_DAY: Nth dia útil de cada mês ────────────────────────────────
  if (recurrence === "BUSINESS_DAY") {
    const n = customIntervalDays ?? 5
    const pastLimit = addMonths(new Date(), -2)
    const occurrences: OccurrenceTemplate[] = []

    let year = startDate.getFullYear()
    let month = startDate.getMonth()
    let index = 0

    while (true) {
      const date = getNthBusinessDay(year, month, n)

      if (isBefore(effectiveEnd, date)) break

      if (!isBefore(date, pastLimit)) {
        occurrences.push({ dueDate: date, amount, occurrenceIndex: index })
      }

      month++
      if (month > 11) { month = 0; year++ }
      index++
      if (index > 500) break
    }

    return occurrences
  }

  // ── Demais recorrências ───────────────────────────────────────────────────
  const occurrences: OccurrenceTemplate[] = []
  let currentDate = startOfDay(startDate)
  let index = 0

  const maxPastDate = getMaxPastDate(startDate, recurrence, customIntervalDays)

  while (isBefore(currentDate, effectiveEnd) || currentDate.getTime() === effectiveEnd.getTime()) {
    if (!isBefore(currentDate, maxPastDate)) {
      occurrences.push({ dueDate: new Date(currentDate), amount, occurrenceIndex: index })
    }
    index++
    currentDate = getNextDate(currentDate, recurrence, customIntervalDays)
    if (index > 500) break
  }

  return occurrences
}

function getNextDate(current: Date, recurrence: RecurrenceType, customIntervalDays?: number | null): Date {
  switch (recurrence) {
    case "WEEKLY":  return addWeeks(current, 1)
    case "MONTHLY": return addMonths(current, 1)
    case "YEARLY":  return addYears(current, 1)
    case "CUSTOM":  return addDays(current, customIntervalDays ?? 30)
    default:        return addMonths(current, 1)
  }
}

function getMaxPastDate(startDate: Date, recurrence: RecurrenceType, customIntervalDays?: number | null): Date {
  const now = new Date()
  switch (recurrence) {
    case "WEEKLY":  return addWeeks(now, -2)
    case "MONTHLY": return addMonths(now, -2)
    case "YEARLY":  return addYears(now, -1)
    case "CUSTOM":  return addDays(now, -(customIntervalDays ?? 30) * 2)
    default:        return startDate
  }
}

/**
 * Preview das próximas N datas (para o formulário).
 */
export function previewNextDates(params: {
  startDate: Date
  recurrence: RecurrenceType
  customIntervalDays?: number | null
  count?: number
}): Date[] {
  const { startDate, recurrence, customIntervalDays, count = 4 } = params

  if (recurrence === "NONE") return [startOfDay(startDate)]

  const today = startOfDay(new Date())

  // ── BUSINESS_DAY ──────────────────────────────────────────────────────────
  if (recurrence === "BUSINESS_DAY") {
    const n = customIntervalDays ?? 5
    const dates: Date[] = []
    let year = startDate.getFullYear()
    let month = startDate.getMonth()

    while (dates.length < count) {
      const date = getNthBusinessDay(year, month, n)
      if (!isBefore(date, today)) dates.push(date)
      month++
      if (month > 11) { month = 0; year++ }
      if (year > today.getFullYear() + 5) break
    }
    return dates
  }

  // ── Demais ────────────────────────────────────────────────────────────────
  const dates: Date[] = []
  let current = startOfDay(startDate)
  let safety = 0

  while (dates.length < count && safety < 200) {
    if (!isBefore(current, today)) dates.push(new Date(current))
    current = getNextDate(current, recurrence, customIntervalDays)
    safety++
  }

  if (dates.length === 0) dates.push(startOfDay(startDate))
  return dates.slice(0, count)
}
