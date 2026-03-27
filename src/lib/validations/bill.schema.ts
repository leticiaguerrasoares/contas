import { z } from "zod"

export const createBillSchema = z.object({
  title: z.string().min(1, "Título obrigatório").max(100),
  description: z.string().max(500).optional().nullable(),
  category: z.string().min(1, "Categoria obrigatória"),
  amount: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === "string" ? parseFloat(val.replace(",", ".")) : val
      return num
    })
    .refine((val) => !isNaN(val) && val > 0, "Valor deve ser maior que zero"),
  currency: z.string().default("BRL"),
  recurrence: z.enum(["NONE", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM", "BUSINESS_DAY"]).default("NONE"),
  customIntervalDays: z.number().int().positive().optional().nullable(),
  startDate: z.string().min(1, "Data de início obrigatória"),
  endDate: z.string().optional().nullable(),
  barcodeNumber: z.string().max(200).optional().nullable(),
  pixKey: z.string().max(200).optional().nullable(),
  pixQrCode: z.string().optional().nullable(),
  paymentInstructions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  notifyDaysBefore: z.array(z.number().int().min(0)).default([1]),
  notifyOnDueDate: z.boolean().default(true),
  isActive: z.boolean().default(true),
})

export const updateBillSchema = createBillSchema.partial()

export type CreateBillInput = z.infer<typeof createBillSchema>
export type UpdateBillInput = z.infer<typeof updateBillSchema>
