import { z } from "zod"

export const markAsPaidSchema = z.object({
  paidAt: z.string().optional(),
  paidAmount: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (!val) return undefined
      const num = typeof val === "string" ? parseFloat(val.replace(",", ".")) : val
      return isNaN(num) ? undefined : num
    }),
  paymentMethod: z.string().optional(),
  paymentNotes: z.string().optional(),
})

export const updateOccurrenceSchema = z.object({
  dueDate: z.string().optional(),
  amount: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (!val) return undefined
      const num = typeof val === "string" ? parseFloat(val.replace(",", ".")) : val
      return isNaN(num) ? undefined : num
    }),
  barcodeNumber: z.string().optional().nullable(),
  pixKey: z.string().optional().nullable(),
  pixQrCode: z.string().optional().nullable(),
  boletoUrl: z.string().url().optional().nullable(),
  paymentInstructions: z.string().optional().nullable(),
  status: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]).optional(),
})

export type MarkAsPaidInput = z.infer<typeof markAsPaidSchema>
export type UpdateOccurrenceInput = z.infer<typeof updateOccurrenceSchema>
