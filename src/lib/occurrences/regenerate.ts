import { prisma } from "@/lib/prisma"
import { generateOccurrenceDates } from "./generator"
import type { Bill } from "@prisma/client"

/**
 * Compares the expected occurrence dates (from the generator) with what's in the DB.
 * If any PENDING/OVERDUE date doesn't match, deletes them all and recreates with correct dates.
 * Returns true if regeneration happened.
 */
export async function ensureCorrectOccurrences(bill: Bill): Promise<boolean> {
  if (bill.recurrence === "NONE") return false

  const expectedOccs = generateOccurrenceDates({
    startDate: new Date(bill.startDate),
    recurrence: bill.recurrence,
    amount: Number(bill.amount),
    endDate: bill.endDate ? new Date(bill.endDate) : null,
    customIntervalDays: bill.customIntervalDays,
    horizonMonths: 13,
  })

  const storedPending = await prisma.billOccurrence.findMany({
    where: { billId: bill.id, status: { in: ["PENDING", "OVERDUE"] } },
    select: { dueDate: true },
  })

  const storedDatesSet = new Set(
    storedPending.map((o) => new Date(o.dueDate).toISOString().split("T")[0])
  )
  const expectedDatesSet = new Set(
    expectedOccs.map((o) => o.dueDate.toISOString().split("T")[0])
  )

  // Need to regenerate if any expected date is missing from stored dates
  const needsRegen = [...expectedDatesSet].some((d) => !storedDatesSet.has(d))
  if (!needsRegen) return false

  await prisma.billOccurrence.deleteMany({
    where: { billId: bill.id, status: { in: ["PENDING", "OVERDUE"] } },
  })

  if (expectedOccs.length > 0) {
    await prisma.billOccurrence.createMany({
      data: expectedOccs.map((occ) => ({
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
  }

  return true
}
