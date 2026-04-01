import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthenticated } from "@/lib/auth"
import { ensureCorrectOccurrences } from "@/lib/occurrences/regenerate"

type Params = { params: Promise<{ id: string }> }

// POST /api/bills/[id]/regenerate
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

    const regenerated = await ensureCorrectOccurrences(bill)
    return NextResponse.json({ success: true, regenerated })
  } catch (error) {
    console.error("POST /api/bills/[id]/regenerate error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
