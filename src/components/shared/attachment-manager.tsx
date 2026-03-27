"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, FileText, FileImage, Trash2, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn, formatFileSize } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type AttachmentType = "DOCUMENT" | "BOLETO" | "COMPROVANTE"

export interface AttachmentItem {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  storageKey: string
  type: AttachmentType
  createdAt: string | Date
}

interface AttachmentSectionProps {
  attachments: AttachmentItem[]
  type: AttachmentType
  billId?: string
  occurrenceId?: string
  readonly?: boolean
  icon: string
  title: string
  description: string
  emptyLabel: string
  accentClass: string
}

function FileTypeIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith("image/")) return <FileImage className={cn("text-blue-500", className)} />
  return <FileText className={cn("text-rose-500", className)} />
}

function AttachmentCard({
  attachment,
  onDelete,
  readonly,
}: {
  attachment: AttachmentItem
  onDelete: (id: string) => Promise<void>
  readonly?: boolean
}) {
  const [opening, setOpening] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isImage = attachment.mimeType.startsWith("image/")

  const handleOpen = async () => {
    setOpening(true)
    try {
      const res = await fetch(`/api/attachments/${attachment.id}/download`)
      if (!res.ok) throw new Error()
      const { url } = await res.json()
      window.open(url, "_blank", "noopener,noreferrer")
    } catch {
      toast.error("Não foi possível abrir o arquivo")
    } finally {
      setOpening(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Remover "${attachment.fileName}"?`)) return
    setDeleting(true)
    try {
      await onDelete(attachment.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="group relative flex flex-col rounded-xl border bg-muted/40 hover:bg-muted/70 transition-colors overflow-hidden">
      {/* Área clicável */}
      <button
        onClick={handleOpen}
        disabled={opening}
        className="flex flex-col items-center justify-center gap-2 p-4 flex-1 min-h-[90px] w-full"
      >
        {opening ? (
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        ) : (
          <FileTypeIcon mimeType={attachment.mimeType} className="w-8 h-8" />
        )}
        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2" />
      </button>

      {/* Rodapé com nome e ações */}
      <div className="border-t bg-background/60 px-3 py-2 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate text-foreground">{attachment.fileName}</p>
          <p className="text-[10px] text-muted-foreground">
            {formatFileSize(attachment.fileSize)} · {isImage ? "Imagem" : "PDF"}
          </p>
        </div>
        {!readonly && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-shrink-0 p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  )
}

function DropZone({
  onFile,
  uploading,
  compact = false,
}: {
  onFile: (file: File) => void
  uploading: boolean
  compact?: boolean
}) {
  const [dragging, setDragging] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }

  return (
    <>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => ref.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-xl cursor-pointer transition-all",
          compact ? "min-h-[90px] p-3" : "p-5",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : (
          <Upload className={cn("w-5 h-5", dragging ? "text-primary" : "text-muted-foreground")} />
        )}
        <p className="text-xs text-muted-foreground text-center">
          {uploading ? "Enviando…" : dragging ? "Solte aqui" : "Arraste ou clique"}
        </p>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = "" }}
      />
    </>
  )
}

export function AttachmentSection({
  attachments: initial,
  type,
  billId,
  occurrenceId,
  readonly = false,
  icon,
  title,
  description,
  emptyLabel,
  accentClass,
}: AttachmentSectionProps) {
  const [attachments, setAttachments] = useState<AttachmentItem[]>(
    initial.filter((a) => a.type === type)
  )
  const [uploading, setUploading] = useState(false)

  const uploadFile = useCallback(
    async (file: File) => {
      const MAX = 10 * 1024 * 1024
      const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]
      if (file.size > MAX) { toast.error("Arquivo muito grande. Máximo 10 MB."); return }
      if (!ALLOWED.includes(file.type)) { toast.error("Use JPG, PNG, WEBP ou PDF."); return }

      setUploading(true)
      try {
        const fd = new FormData()
        fd.append("file", file)
        fd.append("type", type)
        if (billId) fd.append("billId", billId)
        if (occurrenceId) fd.append("occurrenceId", occurrenceId)

        const res = await fetch("/api/attachments", { method: "POST", body: fd })
        if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? "Erro") }

        const att: AttachmentItem = await res.json()
        setAttachments((prev) => [...prev, att])
        toast.success(`"${file.name}" anexado`)
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Erro no upload")
      } finally {
        setUploading(false)
      }
    },
    [billId, occurrenceId, type]
  )

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" })
    if (!res.ok) { toast.error("Erro ao remover"); return }
    setAttachments((prev) => prev.filter((a) => a.id !== id))
    toast.success("Arquivo removido")
  }

  return (
    <div className={cn("rounded-2xl border-2 bg-card overflow-hidden", accentClass)}>
      {/* Cabeçalho */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{icon}</span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        {!readonly && attachments.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5"
            onClick={() => {
              const input = document.createElement("input")
              input.type = "file"
              input.accept = "image/jpeg,image/png,image/webp,image/gif,application/pdf"
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) uploadFile(file)
              }
              input.click()
            }}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            Adicionar
          </Button>
        )}
      </div>

      {/* Grid de arquivos + drop zone */}
      <div className="px-5 pb-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {attachments.map((att) => (
            <AttachmentCard key={att.id} attachment={att} onDelete={handleDelete} readonly={readonly} />
          ))}

          {!readonly && (
            <DropZone onFile={uploadFile} uploading={uploading} compact />
          )}

          {readonly && attachments.length === 0 && (
            <div className="col-span-3 py-4 text-center text-xs text-muted-foreground">
              {emptyLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Atalhos prontos para os dois contextos ───────────────────────────────────

export function BoletoSection(props: Omit<AttachmentSectionProps, "type" | "icon" | "title" | "description" | "emptyLabel" | "accentClass">) {
  return (
    <AttachmentSection
      {...props}
      type="BOLETO"
      icon="📄"
      title="Boleto"
      description="PDF ou imagem do boleto deste mês"
      emptyLabel="Nenhum boleto anexado"
      accentClass="border-amber-200 dark:border-amber-900/50"
    />
  )
}

export function ComprovanteSection(props: Omit<AttachmentSectionProps, "type" | "icon" | "title" | "description" | "emptyLabel" | "accentClass">) {
  return (
    <AttachmentSection
      {...props}
      type="COMPROVANTE"
      icon="✅"
      title="Comprovante de pagamento"
      description="Comprovante, extrato ou recibo"
      emptyLabel="Nenhum comprovante anexado"
      accentClass="border-emerald-200 dark:border-emerald-900/50"
    />
  )
}

export function DocumentSection(props: Omit<AttachmentSectionProps, "type" | "icon" | "title" | "description" | "emptyLabel" | "accentClass">) {
  return (
    <AttachmentSection
      {...props}
      type="DOCUMENT"
      icon="📎"
      title="Documentos da conta"
      description="Contrato, CNPJ ou qualquer documento fixo"
      emptyLabel="Nenhum documento anexado"
      accentClass="border-border"
    />
  )
}

// ─── Seletor de arquivos pendentes (para o formulário de criação) ─────────────

export interface PendingFile {
  file: File
  preview: string
  id: string
}

interface PendingAttachmentsProps {
  files: PendingFile[]
  onChange: (files: PendingFile[]) => void
}

export function PendingAttachments({ files, onChange }: PendingAttachmentsProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const addFile = (file: File) => {
    const MAX = 10 * 1024 * 1024
    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]
    if (file.size > MAX) { toast.error("Arquivo muito grande. Máximo 10 MB."); return }
    if (!ALLOWED.includes(file.type)) { toast.error("Use JPG, PNG, WEBP ou PDF."); return }
    onChange([...files, { file, preview: file.name, id: `${Date.now()}-${Math.random()}` }])
  }

  const removeFile = (id: string) => onChange(files.filter((f) => f.id !== id))

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <span className="text-xl">📎</span>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Documentos</h3>
          <p className="text-xs text-muted-foreground">Anexe boleto fixo, contrato ou outro documento</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50">
              <FileTypeIcon mimeType={f.file.type} className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{f.file.name}</p>
                <p className="text-[10px] text-muted-foreground">{formatFileSize(f.file.size)}</p>
              </div>
              <button onClick={() => removeFile(f.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) addFile(f) }}
        onClick={() => fileRef.current?.click()}
        className={cn(
          "flex flex-col items-center gap-2 border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"
        )}
      >
        <Upload className={cn("w-5 h-5", dragging ? "text-primary" : "text-muted-foreground")} />
        <p className="text-xs text-muted-foreground text-center">
          {dragging ? "Solte aqui" : "Arraste ou clique · JPG, PNG ou PDF · Máx. 10 MB"}
        </p>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) addFile(f); e.target.value = "" }}
      />
    </div>
  )
}
