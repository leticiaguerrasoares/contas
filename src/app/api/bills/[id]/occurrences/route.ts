import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthenticated } from "@/lib/auth"

type Params = { params: Promise<{ id: string }> }

// GET /api/bills/[id]/occurrences
export async function GET(request: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")

  try {
    const occurrences = await prisma.billOccurrence.findMany({
      where: {
        billId: id,
        ...(status ? { status: status as never } : {}),
      },
      include: {
        attachments: true,
        notificationLogs: { orderBy: { sentAt: "desc" } },
      },
      orderBy: { dueDate: "asc" },
    })

    return NextResponse.json(occurrences)
  } catch (error) {
    console.error("GET /api/bills/[id]/occurrences error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
