import type { INotificationChannel } from "./base"
import type { NotificationPayload, NotificationResult } from "../notification.types"
import type { NotificationChannel } from "@prisma/client"

/**
 * Stub — Canal In-App (Fase 2)
 * Persiste notificações na tabela in_app_notifications.
 * O modelo já existe no schema Prisma.
 */
export class InAppChannel implements INotificationChannel {
  readonly channelType: NotificationChannel = "IN_APP"

  isEnabled(): boolean {
    // Habilitar quando IN_APP_NOTIFICATIONS=true estiver configurado
    return process.env.IN_APP_NOTIFICATIONS === "true"
  }

  async send(_payload: NotificationPayload): Promise<NotificationResult> {
    return {
      success: false,
      errorMessage: "Notificações in-app não implementadas (Fase 2)",
    }
  }
}
