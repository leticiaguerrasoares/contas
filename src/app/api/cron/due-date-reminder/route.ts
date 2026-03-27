import { NextRequest, NextResponse } from "next/server"
import { runDueDateReminderJob } from "@/lib/jobs/due-date-reminder.job"

export async function POST(request: NextRequest) {
  // Verificar CRON_SECRET (enviado pelo Vercel Cron no header Authorization)
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const result = await runDueDateReminderJob()

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Cron due-date-reminder error:", error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    )
  }
}

// Permite GET para teste manual no browser
export async function GET(request: NextRequest) {
  return POST(request)
}
