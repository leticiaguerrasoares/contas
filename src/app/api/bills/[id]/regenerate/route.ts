import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthenticated } from "@/lib/auth"
import { generateOccurrenceDates } from "@/lib/occurrences/generator"

type Params = { params: Promise<{ id: string }> }

// POST /api/bills/[id]/regenerate
// Deletes all PENDING occurrences and regenerates them with the corrected generator.
export async function POST(_req: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { id } = await params

  try {
    const bill = await prisma.bill.findUnique({ where: { id } })
    if (!bill) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 })
    }

    // Delete all PENDING and OVERDUE occurrences (keep PAID history intact)
    const deleted = await prisma.billOccurrence.deleteMany({
      where: {
        billId: id,
        status: { in: ["PENDING", "OVERDUE"] },
      },
    })

    // Regenerate using the corrected generator
    const newOccurrences = generateOccurrenceDates({
      startDate: new Date(bill.startDate),
      recurrence: bill.recurrence,
      amount: Number(bill.amount),
      endDate: bill.endDate ? new Date(bill.endDate) : null,
      customIntervalDays: bill.customIntervalDays,
      horizonMonths: 13,
    })

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
    }

    return NextResponse.json({
      success: true,
      deleted: deleted.count,
      created: newOccurrences.length,
    })
  } catch (error) {
    console.error("POST /api/bills/[id]/regenerate error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
