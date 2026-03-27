import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthenticated } from "@/lib/auth"
import { getSupabaseAdmin, STORAGE_BUCKET, SIGNED_URL_EXPIRY } from "@/lib/supabase"

type Props = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { id } = await params

    const attachment = await prisma.attachment.findUnique({ where: { id } })
    if (!attachment) {
      return NextResponse.json({ error: "Anexo não encontrado" }, { status: 404 })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(attachment.storageKey, SIGNED_URL_EXPIRY, {
        download: false, // false = abre no browser; true = força download
      })

    if (error || !data?.signedUrl) {
      console.error("Signed URL error:", error)
      return NextResponse.json({ error: "Erro ao gerar URL" }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl, fileName: attachment.fileName })
  } catch (error) {
    console.error("GET /api/attachments/[id]/download error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
