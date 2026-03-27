import { prisma } from "@/lib/prisma"
import { generateOccurrenceDates } from "@/lib/occurrences/generator"
import { addMonths, isBefore } from "date-fns"

export async function runExtendOccurrencesJob(): Promise<{
  billsProcessed: number
  occurrencesCreated: number
  errors: string[]
}> {
  const activeBills = await prisma.bill.findMany({
    where: {
      isActive: true,
      recurrence: { not: "NONE" },
    },
    include: {
      occurrences: {
        orderBy: { dueDate: "desc" },
        take: 1,
      },
    },
  })

  let occurrencesCreated = 0
  const errors: string[] = []
  const horizon = addMonths(new Date(), 12)

  for (const bill of activeBills) {
    try {
      // Verificar qual é a última ocorrência gerada
      const lastOccurrence = bill.occurrences[0]
      if (lastOccurrence && !isBefore(new Date(lastOccurrence.dueDate), horizon)) {
        // Já tem ocorrências até o horizonte, pular
        continue
      }

      // Gerar novas ocorrências
      const allDates = generateOccurrenceDates({
        startDate: new Date(bill.startDate),
        recurrence: bill.recurrence,
        amount: Number(bill.amount),
        endDate: bill.endDate ? new Date(bill.endDate) : null,
        customIntervalDays: bill.customIntervalDays,
        horizonMonths: 13, // 1 mês extra de margem
      })

      // Buscar ocorrências existentes para não duplicar
      const existingOccurrences = await prisma.billOccurrence.findMany({
        where: { billId: bill.id },
        select: { dueDate: true },
      })

      const existingDates = new Set(
        existingOccurrences.map((o) => new Date(o.dueDate).toISOString().split("T")[0])
      )

      const newOccurrences = allDates.filter(
        (occ) => !existingDates.has(occ.dueDate.toISOString().split("T")[0])
      )

      if (newOccurrences.length > 0) {
        await prisma.billOccurrence.createMany({
          data: newOccurrences.map((occ) => ({
            billId: bill.id,
            dueDate: occ.dueDate,
            amount: occ.amount,
            occurrenceIndex: occ.occurrenceIndex,
            barcodeNumber: bill.barcodeNumber,
            pixKey: bill.pixKey,
            pixQrCode: bill.pixQrCode,
            paymentInstructions: bill.paymentInstructions,
          })),
          skipDuplicates: true,
        })

        occurrencesCreated += newOccurrences.length
      }
    } catch (err) {
      errors.push(`Erro no bill ${bill.id}: ${err instanceof Error ? err.message : "Desconhecido"}`)
    }
  }

  return { billsProcessed: activeBills.length, occurrencesCreated, errors }
}
