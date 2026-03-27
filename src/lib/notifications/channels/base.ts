import type { NotificationChannel } from "@prisma/client"
import type { NotificationPayload, NotificationResult } from "../notification.types"

export interface INotificationChannel {
  readonly channelType: NotificationChannel
  isEnabled(): boolean
  send(payload: NotificationPayload): Promise<NotificationResult>
}
