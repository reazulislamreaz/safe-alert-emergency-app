import { Injectable, Logger } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { soundForNotificationType } from "../../common/mappers/notification.mapper";

/**
 * Push delivery pipeline.
 * When FCM_SERVER_KEY (or APNs) is not configured, tokens are stored and
 * delivery is logged — mobile still receives in-app + Socket.IO notifications.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registerToken(userId: string, token: string, platform = "unknown") {
    const cleaned = token.trim();
    if (!cleaned) {
      return { registered: false };
    }
    await this.prisma.devicePushToken.upsert({
      where: { userId_token: { userId, token: cleaned } },
      create: { userId, token: cleaned, platform },
      update: { platform, updatedAt: new Date() },
    });
    return { registered: true };
  }

  async unregisterToken(userId: string, token: string) {
    await this.prisma.devicePushToken.deleteMany({
      where: { userId, token: token.trim() },
    });
    return { unregistered: true };
  }

  async sendToUser(params: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    alertId?: string;
    data?: Record<string, string>;
  }): Promise<void> {
    const tokens = await this.prisma.devicePushToken.findMany({
      where: { userId: params.userId },
    });
    if (!tokens.length) {
      return;
    }

    const sound = soundForNotificationType(params.type);
    const fcmKey = process.env.FCM_SERVER_KEY?.trim();

    if (!fcmKey) {
      this.logger.debug(
        `Push skipped (no FCM_SERVER_KEY): user=${params.userId} type=${params.type} tokens=${tokens.length} sound=${sound.soundKey}`,
      );
      return;
    }

    // Minimal FCM HTTP legacy send — keep payload aligned with mobile sound keys
    await Promise.all(
      tokens.map(async (row) => {
        try {
          const response = await fetch("https://fcm.googleapis.com/fcm/send", {
            method: "POST",
            headers: {
              Authorization: `key=${fcmKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: row.token,
              notification: {
                title: params.title,
                body: params.body,
                sound: sound.soundKey,
                android_channel_id:
                  sound.soundKey === "emergency_alert" ? "emergency_alerts" : "circle_notify",
              },
              data: {
                type: params.type,
                soundKey: sound.soundKey,
                soundUrl: sound.soundUrl,
                ...(params.alertId ? { alertId: params.alertId } : {}),
                ...(params.data ?? {}),
              },
              priority: sound.soundKey === "emergency_alert" ? "high" : "normal",
            }),
          });
          if (!response.ok) {
            const text = await response.text();
            this.logger.warn(`FCM send failed for token …${row.token.slice(-6)}: ${text.slice(0, 200)}`);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.warn(`FCM send error: ${message}`);
        }
      }),
    );
  }
}
