import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthenticated } from "@/lib/auth"
import { getSupabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase"

type Props = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: Props) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { id } = await params

    const attachment = await prisma.attachment.findUnique({ where: { id } })
    if (!attachment) {
      return NextResponse.json({ error: "Anexo não encontrado" }, { status: 404 })
    }

    // Remover do Storage
    const supabase = getSupabaseAdmin()
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([attachment.storageKey])

    if (storageError) {
      console.error("Storage delete error:", storageError)
      // Continua e remove do banco mesmo se o storage falhar
    }

    // Remover do banco
    await prisma.attachment.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/attachments/[id] error:", error)
    return NextResponse.json({ error: "Erro ao remover anexo" }, { status: 500 })
  }
}
