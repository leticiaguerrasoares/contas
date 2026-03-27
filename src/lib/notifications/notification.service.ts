import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { EmailChannel } from "./channels/email.channel"
import { WhatsAppChannel } from "./channels/whatsapp.channel"
import { InAppChannel } from "./channels/in-app.channel"
import type { INotificationChannel } from "./channels/base"
import type { NotificationPayload, DispatchResult } from "./notification.types"
import type { NotificationChannel, NotificationType } from "@prisma/client"

// Registry de canais
const channels: INotificationChannel[] = [
  new EmailChannel(),
  new WhatsAppChannel(),
  new InAppChannel(),
]

function getEnabledChannels(): INotificationChannel[] {
  return channels.filter((c) => c.isEnabled())
}

function buildIdempotencyKey(
  type: NotificationType,
  billOccurrenceId: string | undefined,
  channel: NotificationChannel,
  date: Date = new Date()
): string {
  const dateStr = format(date, "yyyy-MM-dd")
  const occId = billOccurrenceId ?? "global"
  return `${type}:${occId}:${channel}:${dateStr}`
}

export async function dispatchNotification(params: {
  type: NotificationType
  billOccurrenceId?: string
  recipient: string
  data: Record<string, unknown>
  channels?: NotificationChannel[]
  idempotencyDate?: Date
}): Promise<DispatchResult> {
  const { type, billOccurrenceId, recipient, data, idempotencyDate } = params

  const targetChannels = params.channels
    ? getEnabledChannels().filter((c) => params.channels!.includes(c.channelType))
    : getEnabledChannels()

  const result: DispatchResult = {
    dispatched: 0,
    failed: 0,
    skipped: 0,
    results: [],
  }

  for (const channel of targetChannels) {
    const idempotencyKey = buildIdempotencyKey(type, billOccurrenceId, channel.channelType, idempotencyDate)

    // Verificar deduplicação
    const existing = await prisma.notificationLog.findUnique({
      where: { idempotencyKey },
    })

    if (existing?.success) {
      result.skipped++
      result.results.push({
        channel: channel.channelType,
        success: true,
        skipped: true,
        reason: "Já enviado (idempotência)",
      })
      continue
    }

    // Enviar
    const payload: NotificationPayload = {
      type,
      channel: channel.channelType,
      recipient,
      billOccurrenceId,
      data,
    }

    const sendResult = await channel.send(payload)

    // Persistir log
    await prisma.notificationLog.upsert({
      where: { idempotencyKey },
      create: {
        billOccurrenceId: billOccurrenceId ?? null,
        channel: channel.channelType,
        type,
        recipient,
        success: sendResult.success,
        errorMessage: sendResult.errorMessage ?? null,
        idempotencyKey,
        metadata: {
          externalId: sendResult.externalId,
          dataKeys: Object.keys(data),
        },
      },
      update: {
        success: sendResult.success,
        errorMessage: sendResult.errorMessage ?? null,
        sentAt: new Date(),
      },
    })

    if (sendResult.success) {
      result.dispatched++
      result.results.push({ channel: channel.channelType, success: true })
    } else {
      result.failed++
      result.results.push({
        channel: channel.channelType,
        success: false,
        reason: sendResult.errorMessage,
      })
    }
  }

  return result
}
