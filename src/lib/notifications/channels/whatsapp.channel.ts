import type { INotificationChannel } from "./base"
import type { NotificationPayload, NotificationResult } from "../notification.types"
import type { NotificationChannel } from "@prisma/client"

/**
 * Stub — Canal WhatsApp (Fase 2)
 * Implementar via Twilio ou WhatsApp Business API.
 */
export class WhatsAppChannel implements INotificationChannel {
  readonly channelType: NotificationChannel = "WHATSAPP"

  isEnabled(): boolean {
    // Habilitar quando WHATSAPP_PHONE e WHATSAPP_API_KEY estiverem configurados
    return Boolean(process.env.WHATSAPP_PHONE && process.env.WHATSAPP_API_KEY)
  }

  async send(_payload: NotificationPayload): Promise<NotificationResult> {
    return {
      success: false,
      errorMessage: "WhatsApp não implementado (Fase 2)",
    }
  }
}
