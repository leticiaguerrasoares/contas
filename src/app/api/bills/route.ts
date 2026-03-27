import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthenticated } from "@/lib/auth"
import { createBillSchema } from "@/lib/validations/bill.schema"
import { generateOccurrenceDates } from "@/lib/occurrences/generator"
import type { RecurrenceType } from "@prisma/client"

// GET /api/bills — listar todas as contas
export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const active = searchParams.get("active")
    const category = searchParams.get("category")
    const search = searchParams.get("q")

    const user = await getOrCreateUser()

    const bills = await prisma.bill.findMany({
      where: {
        userId: user.id,
        ...(active !== null ? { isActive: active === "true" } : {}),
        ...(category ? { category } : {}),
        ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      },
      include: {
        occurrences: {
          where: { status: { in: ["PENDING", "OVERDUE"] } },
          orderBy: { dueDate: "asc" },
          take: 1,
        },
        attachments: true,
        _count: { select: { occurrences: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(bills)
  } catch (error) {
    console.error("GET /api/bills error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// POST /api/bills — criar nova conta
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = createBillSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const user = await getOrCreateUser()

    const startDate = new Date(data.startDate)
    const endDate = data.endDate ? new Date(data.endDate) : null

    // Criar a conta
    const bill = await prisma.bill.create({
      data: {
        userId: user.id,
        title: data.title,
        description: data.description ?? null,
        category: data.category,
        amount: data.amount,
        currency: data.currency,
        recurrence: data.recurrence as RecurrenceType,
        customIntervalDays: data.customIntervalDays ?? null,
        startDate,
        endDate,
        barcodeNumber: data.barcodeNumber ?? null,
        pixKey: data.pixKey ?? null,
        pixQrCode: data.pixQrCode ?? null,
        paymentInstructions: data.paymentInstructions ?? null,
        notes: data.notes ?? null,
        notifyDaysBefore: data.notifyDaysBefore,
        notifyOnDueDate: data.notifyOnDueDate,
        isActive: data.isActive,
      },
    })

    // Gerar ocorrências
    const occurrenceDates = generateOccurrenceDates({
      startDate,
      recurrence: data.recurrence as RecurrenceType,
      amount: data.amount,
      endDate,
      customIntervalDays: data.customIntervalDays,
    })

    if (occurrenceDates.length > 0) {
      await prisma.billOccurrence.createMany({
        data: occurrenceDates.map((occ) => ({
          billId: bill.id,
          dueDate: occ.dueDate,
          amount: occ.amount,
          occurrenceIndex: occ.occurrenceIndex,
          barcodeNumber: data.barcodeNumber ?? null,
          pixKey: data.pixKey ?? null,
          pixQrCode: data.pixQrCode ?? null,
          paymentInstructions: data.paymentInstructions ?? null,
        })),
      })
    }

    const billWithOccurrences = await prisma.bill.findUnique({
      where: { id: bill.id },
      include: { occurrences: { orderBy: { dueDate: "asc" } }, attachments: true },
    })

    return NextResponse.json(billWithOccurrences, { status: 201 })
  } catch (error) {
    console.error("POST /api/bills error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// Helper: pega ou cria o usuário único da aplicação
async function getOrCreateUser() {
  const email = process.env.NOTIFICATION_EMAIL_TO || "admin@local"
  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    user = await prisma.user.create({ data: { email, name: "Admin" } })
  }
  return user
}
