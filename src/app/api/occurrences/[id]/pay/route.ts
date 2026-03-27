import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthenticated } from "@/lib/auth"
import { markAsPaidSchema } from "@/lib/validations/occurrence.schema"

type Params = { params: Promise<{ id: string }> }

// POST /api/occurrences/[id]/pay
export async function POST(request: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const parsed = markAsPaidSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Verificar se a ocorrência existe e está pendente/atrasada
    const existing = await prisma.billOccurrence.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Ocorrência não encontrada" }, { status: 404 })
    }

    if (existing.status === "PAID") {
      return NextResponse.json({ error: "Esta ocorrência já foi paga" }, { status: 400 })
    }

    const occurrence = await prisma.billOccurrence.update({
      where: { id },
      data: {
        status: "PAID",
        paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
        paidAmount: data.paidAmount ?? existing.amount,
        paymentMethod: data.paymentMethod ?? null,
        paymentNotes: data.paymentNotes ?? null,
      },
      include: {
        bill: true,
        attachments: true,
      },
    })

    return NextResponse.json(occurrence)
  } catch (error) {
    console.error("POST /api/occurrences/[id]/pay error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// DELETE /api/occurrences/[id]/pay — desfazer pagamento
export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { id } = await params

  try {
    const occurrence = await prisma.billOccurrence.update({
      where: { id },
      data: {
        status: "PENDING",
        paidAt: null,
        paidAmount: null,
        paymentMethod: null,
        paymentNotes: null,
      },
    })

    return NextResponse.json(occurrence)
  } catch (error) {
    console.error("DELETE /api/occurrences/[id]/pay error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
