import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthenticated } from "@/lib/auth"
import { updateOccurrenceSchema } from "@/lib/validations/occurrence.schema"

type Params = { params: Promise<{ id: string }> }

// GET /api/occurrences/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { id } = await params

  try {
    const occurrence = await prisma.billOccurrence.findUnique({
      where: { id },
      include: {
        bill: true,
        attachments: true,
        notificationLogs: { orderBy: { sentAt: "desc" } },
      },
    })

    if (!occurrence) {
      return NextResponse.json({ error: "Ocorrência não encontrada" }, { status: 404 })
    }

    return NextResponse.json(occurrence)
  } catch (error) {
    console.error("GET /api/occurrences/[id] error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// PUT /api/occurrences/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const parsed = updateOccurrenceSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    const occurrence = await prisma.billOccurrence.update({
      where: { id },
      data: {
        ...(data.dueDate !== undefined && { dueDate: new Date(data.dueDate) }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.barcodeNumber !== undefined && { barcodeNumber: data.barcodeNumber }),
        ...(data.pixKey !== undefined && { pixKey: data.pixKey }),
        ...(data.pixQrCode !== undefined && { pixQrCode: data.pixQrCode }),
        ...(data.boletoUrl !== undefined && { boletoUrl: data.boletoUrl }),
        ...(data.paymentInstructions !== undefined && { paymentInstructions: data.paymentInstructions }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: {
        bill: true,
        attachments: true,
      },
    })

    return NextResponse.json(occurrence)
  } catch (error) {
    console.error("PUT /api/occurrences/[id] error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
