import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthenticated } from "@/lib/auth"
import { getSupabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase"

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const billId = formData.get("billId") as string | null
    const occurrenceId = formData.get("occurrenceId") as string | null

    if (!file) {
      return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 })
    }
    if (!billId && !occurrenceId) {
      return NextResponse.json(
        { error: "billId ou occurrenceId é obrigatório" },
        { status: 400 }
      )
    }
    const type = (formData.get("type") as string | null) ?? "DOCUMENT"
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande (máximo 10 MB)" },
        { status: 400 }
      )
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido. Use JPG, PNG, WEBP ou PDF." },
        { status: 400 }
      )
    }

    // Gerar caminho único no Storage
    const ext = file.name.split(".").pop() ?? "bin"
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const folder = billId ? `bills/${billId}` : `occurrences/${occurrenceId}`
    const storageKey = `${folder}/${uniqueId}.${ext}`

    // Upload para o Supabase Storage
    const supabase = getSupabaseAdmin()
    const bytes = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storageKey, bytes, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({ error: "Falha no upload do arquivo" }, { status: 500 })
    }

    // Salvar metadados no banco
    const attachment = await prisma.attachment.create({
      data: {
        billId: billId ?? null,
        billOccurrenceId: occurrenceId ?? null,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storageKey,
        storageUrl: storageKey,
        type: type as "DOCUMENT" | "BOLETO" | "COMPROVANTE",
      },
    })

    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    console.error("POST /api/attachments error:", error)
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 })
  }
}
