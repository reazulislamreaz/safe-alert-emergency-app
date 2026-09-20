import {
  AlertMode,
  AlertSource,
  AlertStatus,
  NotificationType,
  SafetyCountdownStatus,
  ScheduledJobStatus,
  ScheduledJobType,
} from "@prisma/client";
import { Inject, Injectable, Logger, forwardRef } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationService } from "../notifications/notification.service";
import { AlertService } from "../alerts/alert.service";
import { RealtimeService } from "../../realtime/realtime.service";

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    @Inject(forwardRef(() => AlertService))
    private readonly alerts: AlertService,
    private readonly realtime: RealtimeService,
  ) {}

  async enqueue(
    type: ScheduledJobType,
    refId: string,
    runAt: Date,
  ): Promise<void> {
    await this.prisma.scheduledJob.upsert({
      where: { type_refId: { type, refId } },
      create: { type, refId, runAt, status: ScheduledJobStatus.PENDING },
      update: {
        runAt,
        status: ScheduledJobStatus.PENDING,
        lastError: null,
        processedAt: null,
      },
    });
  }

  async cancel(type: ScheduledJobType, refId: string): Promise<void> {
    await this.prisma.scheduledJob.updateMany({
      where: {
        type,
        refId,
        status: { in: [ScheduledJobStatus.PENDING, ScheduledJobStatus.PROCESSING] },
      },
      data: { status: ScheduledJobStatus.CANCELLED, processedAt: new Date() },
    });
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processDueJobs(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      const due = await this.prisma.scheduledJob.findMany({
        where: {
          status: ScheduledJobStatus.PENDING,
          runAt: { lte: new Date() },
        },
        orderBy: { runAt: "asc" },
        take: 25,
      });

      for (const job of due) {
        const claimed = await this.prisma.scheduledJob.updateMany({
          where: { id: job.id, status: ScheduledJobStatus.PENDING },
          data: {
            status: ScheduledJobStatus.PROCESSING,
            attempts: { increment: 1 },
          },
        });
        if (!claimed.count) {
          continue;
        }

        try {
          if (job.type === ScheduledJobType.ALERT_FOLLOW_UP) {
            await this.handleAlertFollowUp(job.refId);
          } else if (job.type === ScheduledJobType.COUNTDOWN_EXPIRE) {
            await this.handleCountdownExpire(job.refId);
          }

          await this.prisma.scheduledJob.update({
            where: { id: job.id },
            data: {
              status: ScheduledJobStatus.DONE,
              processedAt: new Date(),
              lastError: null,
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.error(`Job ${job.type}/${job.refId} failed: ${message}`);
          await this.prisma.scheduledJob.update({
            where: { id: job.id },
            data: {
              status: ScheduledJobStatus.FAILED,
              lastError: message.slice(0, 1000),
              processedAt: new Date(),
            },
          });
        }
      }
    } finally {
      this.running = false;
    }
  }

  private async handleAlertFollowUp(alertId: string): Promise<void> {
    const alert = await this.prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert) {
      return;
    }
    if (alert.status !== AlertStatus.BROADCASTING || alert.followUpSentAt) {
      return;
    }

    const firstName = alert.userName.split(" ")[0];
    const pronoun = "themselves";
    const body = `Emergency still active. ${firstName} has not marked ${pronoun} safe.`;

    const notified = await this.prisma.alertNotifiedGroup.findMany({
      where: { alertId },
    });
    const groups = await this.prisma.contactGroup.findMany({
      where: { id: { in: notified.map((item) => item.groupId) } },
      include: { members: true },
    });
    const phones = groups.flatMap((group) => group.members.map((member) => member.phone));

    await this.notifications.notifyFollowUpAlert({
      ownerId: alert.userId,
      ownerName: firstName,
      alertId,
      body,
      memberPhones: phones,
    });

    const updated = await this.prisma.alert.updateMany({
      where: {
        id: alertId,
        status: AlertStatus.BROADCASTING,
        followUpSentAt: null,
      },
      data: { followUpSentAt: new Date() },
    });

    if (updated.count) {
      this.realtime.emitToRoom(`room:${alertId}`, "alert:follow_up", {
        alertId,
        body,
      });
    }
  }

  private async handleCountdownExpire(countdownId: string): Promise<void> {
    const countdown = await this.prisma.safetyCountdown.findUnique({
      where: { id: countdownId },
    });
    if (!countdown || countdown.status !== SafetyCountdownStatus.ACTIVE) {
      return;
    }
    if (countdown.expiresAt.getTime() > Date.now()) {
      return;
    }

    const result = await this.alerts.triggerAlert({
      userId: countdown.userId,
      source: AlertSource.SOS,
      mode: AlertMode.EMERGENCY,
      alertAllGroups: true,
      emergencyTypeId: "et-unsafe",
      address: "Safety countdown expired — user did not confirm safe",
    });

    const alertId = result.id as string;
    await this.prisma.safetyCountdown.updateMany({
      where: { id: countdownId, status: SafetyCountdownStatus.ACTIVE },
      data: {
        status: SafetyCountdownStatus.ESCALATED,
        escalatedAt: new Date(),
        alertId,
      },
    });

    await this.notifications.createForUser({
      userId: countdown.userId,
      type: NotificationType.COUNTDOWN_ESCALATED,
      title: "Safety countdown expired",
      body: "Your 30-minute safety check expired. An emergency alert was sent to your Safety Circle.",
      refLabel: "Escalated",
      alertId,
    });
  }
}
