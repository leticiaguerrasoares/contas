import { NextRequest, NextResponse } from "next/server"
import { runWeeklySummaryJob } from "@/lib/jobs/weekly-summary.job"

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const result = await runWeeklySummaryJob()

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Cron weekly-summary error:", error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
