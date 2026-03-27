import { Resend } from "resend"
import { render } from "@react-email/components"
import type { INotificationChannel } from "./base"
import type { NotificationPayload, NotificationResult } from "../notification.types"
import { DueDateReminderEmail } from "../templates/due-date-reminder"
import { WeeklySummaryEmail } from "../templates/weekly-summary"
import type { NotificationChannel } from "@prisma/client"

export class EmailChannel implements INotificationChannel {
  readonly channelType: NotificationChannel = "EMAIL"
  private resend: Resend

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY)
  }

  isEnabled(): boolean {
    return Boolean(process.env.RESEND_API_KEY && process.env.NOTIFICATION_EMAIL_TO)
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.isEnabled()) {
      return { success: false, errorMessage: "Email não configurado (RESEND_API_KEY ou NOTIFICATION_EMAIL_TO ausente)" }
    }

    try {
      const { subject, html } = await this.renderTemplate(payload)

      const from = process.env.NOTIFICATION_EMAIL_FROM || "Minhas Contas <noreply@example.com>"
      const to = payload.recipient

      const result = await this.resend.emails.send({ from, to, subject, html })

      if (result.error) {
        return { success: false, errorMessage: result.error.message }
      }

      return { success: true, externalId: result.data?.id }
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
      }
    }
  }

  private async renderTemplate(payload: NotificationPayload): Promise<{ subject: string; html: string }> {
    switch (payload.type) {
      case "DUE_DATE_REMINDER": {
        const data = payload.data as unknown as Parameters<typeof DueDateReminderEmail>[0]["data"]
        const html = await render(DueDateReminderEmail({ data }))
        return {
          subject: `⚠️ ${data.billTitle} vence hoje — ${this.formatCurrency(data.amount, data.currency)}`,
          html,
        }
      }
      case "WEEKLY_SUMMARY": {
        const data = payload.data as unknown as Parameters<typeof WeeklySummaryEmail>[0]["data"]
        const html = await render(WeeklySummaryEmail({ data }))
        return {
          subject: `📋 Resumo semanal — ${data.occurrences.length} conta${data.occurrences.length !== 1 ? "s" : ""} esta semana`,
          html,
        }
      }
      default:
        throw new Error(`Template não implementado para tipo: ${payload.type}`)
    }
  }

  private formatCurrency(amount: number, currency = "BRL"): string {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(amount)
  }
}
