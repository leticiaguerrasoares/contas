import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthenticated } from "@/lib/auth"
import { updateBillSchema } from "@/lib/validations/bill.schema"

type Params = { params: Promise<{ id: string }> }

// GET /api/bills/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { id } = await params

  try {
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        occurrences: { orderBy: { dueDate: "asc" } },
        attachments: true,
      },
    })

    if (!bill) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 })
    }

    return NextResponse.json(bill)
  } catch (error) {
    console.error("GET /api/bills/[id] error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// PUT /api/bills/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const parsed = updateBillSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    const bill = await prisma.bill.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.barcodeNumber !== undefined && { barcodeNumber: data.barcodeNumber }),
        ...(data.pixKey !== undefined && { pixKey: data.pixKey }),
        ...(data.pixQrCode !== undefined && { pixQrCode: data.pixQrCode }),
        ...(data.paymentInstructions !== undefined && { paymentInstructions: data.paymentInstructions }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.notifyDaysBefore !== undefined && { notifyDaysBefore: data.notifyDaysBefore }),
        ...(data.notifyOnDueDate !== undefined && { notifyOnDueDate: data.notifyOnDueDate }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
      },
      include: {
        occurrences: { orderBy: { dueDate: "asc" } },
        attachments: true,
      },
    })

    return NextResponse.json(bill)
  } catch (error) {
    console.error("PUT /api/bills/[id] error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// DELETE /api/bills/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { id } = await params

  try {
    await prisma.bill.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/bills/[id] error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
