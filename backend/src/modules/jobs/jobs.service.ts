import {
  AlertMode,
  AlertSource,
  AlertStatus,
  LocationRequestStatus,
  NotificationType,
  PromoCodeStatus,
  SafetyCountdownStatus,
  ScheduledJobStatus,
  ScheduledJobType,
  SubscriptionTier,
} from "@prisma/client";
import { Inject, Injectable, Logger, forwardRef } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationService } from "../notifications/notification.service";
import { AlertService } from "../alerts/alert.service";
import { RealtimeService } from "../../realtime/realtime.service";

/** Handler outcome — never mark DONE when work was deferred. */
type JobOutcome = "done" | "noop" | "defer";

const MAX_ATTEMPTS = 5;

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
      create: { type, refId, runAt, status: ScheduledJobStatus.PENDING, attempts: 0 },
      update: {
        runAt,
        status: ScheduledJobStatus.PENDING,
        lastError: null,
        processedAt: null,
        attempts: 0,
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
      // Re-queue eligible FAILED jobs for retry
      await this.prisma.scheduledJob.updateMany({
        where: {
          status: ScheduledJobStatus.FAILED,
          attempts: { lt: MAX_ATTEMPTS },
          runAt: { lte: new Date() },
        },
        data: { status: ScheduledJobStatus.PENDING },
      });

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

        const attemptNumber = job.attempts + 1;

        try {
          let outcome: JobOutcome = "done";
          if (job.type === ScheduledJobType.ALERT_FOLLOW_UP) {
            outcome = await this.handleAlertFollowUp(job.refId);
          } else if (job.type === ScheduledJobType.COUNTDOWN_EXPIRE) {
            outcome = await this.handleCountdownExpire(job.refId);
          } else if (job.type === ScheduledJobType.PROMO_EXPIRE) {
            outcome = await this.handlePromoExpire(job.refId);
          } else if (job.type === ScheduledJobType.PREMIUM_EXPIRE) {
            outcome = await this.handlePremiumExpire(job.refId);
          } else if (job.type === ScheduledJobType.LOCATION_REQUEST_EXPIRE) {
            outcome = await this.handleLocationRequestExpire(job.refId);
          }

          if (outcome === "defer") {
            // Not ready yet — put back to PENDING without counting as success
            await this.prisma.scheduledJob.update({
              where: { id: job.id },
              data: {
                status: ScheduledJobStatus.PENDING,
                // keep original runAt; cron will pick up when due again
                attempts: Math.max(0, attemptNumber - 1),
                lastError: null,
                processedAt: null,
              },
            });
          } else {
            await this.prisma.scheduledJob.update({
              where: { id: job.id },
              data: {
                status: ScheduledJobStatus.DONE,
                processedAt: new Date(),
                lastError: null,
              },
            });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.error(`Job ${job.type}/${job.refId} failed (attempt ${attemptNumber}): ${message}`);

          if (attemptNumber >= MAX_ATTEMPTS) {
            await this.prisma.scheduledJob.update({
              where: { id: job.id },
              data: {
                status: ScheduledJobStatus.FAILED,
                lastError: message.slice(0, 1000),
                processedAt: new Date(),
              },
            });
          } else {
            const backoffSec = Math.min(300, 15 * attemptNumber);
            await this.prisma.scheduledJob.update({
              where: { id: job.id },
              data: {
                status: ScheduledJobStatus.PENDING,
                runAt: new Date(Date.now() + backoffSec * 1000),
                lastError: message.slice(0, 1000),
                processedAt: null,
              },
            });
          }
        }
      }
    } finally {
      this.running = false;
    }
  }

  /** Sweep expired promo codes and pending location requests every minute. */
  @Cron(CronExpression.EVERY_MINUTE)
  async sweepLifecycle(): Promise<void> {
    const now = new Date();
    await this.prisma.promoCode.updateMany({
      where: {
        status: PromoCodeStatus.ACTIVE,
        expiresAt: { lte: now },
      },
      data: { status: PromoCodeStatus.EXPIRED },
    });

    await this.prisma.locationRequest.updateMany({
      where: {
        status: LocationRequestStatus.PENDING,
        expiresAt: { lte: now },
      },
      data: { status: LocationRequestStatus.EXPIRED, respondedAt: now },
    });

    // Demote premium users whose grant/renewal date has passed
    const expiredUsers = await this.prisma.user.findMany({
      where: {
        subscriptionTier: SubscriptionTier.PREMIUM,
        subscriptionRenewsAt: { lte: now },
        subscriptionCancelledAt: null,
      },
      select: { id: true },
      take: 50,
    });
    for (const user of expiredUsers) {
      await this.handlePremiumExpire(user.id);
    }
  }

  private async handleAlertFollowUp(alertId: string): Promise<JobOutcome> {
    const alert = await this.prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert) {
      return "noop";
    }
    if (alert.status !== AlertStatus.BROADCASTING || alert.followUpSentAt) {
      return "noop";
    }
    // Do not send emergency-style follow-ups for TEST alerts
    if (alert.mode === AlertMode.TEST) {
      return "noop";
    }

    const firstName = alert.userName.split(" ")[0];
    const body = `Emergency still active. ${firstName} has not marked themselves safe.`;

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
    return "done";
  }

  private async handleCountdownExpire(countdownId: string): Promise<JobOutcome> {
    const countdown = await this.prisma.safetyCountdown.findUnique({
      where: { id: countdownId },
    });
    if (!countdown || countdown.status !== SafetyCountdownStatus.ACTIVE) {
      return "noop";
    }
    if (countdown.expiresAt.getTime() > Date.now()) {
      // Clock skew / early claim — defer, do NOT mark DONE
      return "defer";
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
    return "done";
  }

  private async handlePromoExpire(promoId: string): Promise<JobOutcome> {
    const promo = await this.prisma.promoCode.findUnique({ where: { id: promoId } });
    if (!promo) {
      return "noop";
    }
    if (promo.status !== PromoCodeStatus.ACTIVE) {
      return "noop";
    }
    if (promo.expiresAt && promo.expiresAt.getTime() > Date.now()) {
      return "defer";
    }
    if (!promo.expiresAt) {
      return "noop";
    }
    await this.prisma.promoCode.update({
      where: { id: promoId },
      data: { status: PromoCodeStatus.EXPIRED },
    });
    return "done";
  }

  private async handlePremiumExpire(userId: string): Promise<JobOutcome> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.subscriptionTier !== SubscriptionTier.PREMIUM) {
      return "noop";
    }
    if (user.subscriptionRenewsAt && user.subscriptionRenewsAt.getTime() > Date.now()) {
      return "defer";
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: SubscriptionTier.FREE,
          subscriptionCancelledAt: new Date(),
          subscriptionCancelReason: "Premium access expired",
        },
      });
      await tx.subscriptionPlan.update({
        where: { id: "plan-pro" },
        data: { subscriberCount: { decrement: 1 } },
      }).catch(() => undefined);
      await tx.subscriptionPlan.update({
        where: { id: "plan-free" },
        data: { subscriberCount: { increment: 1 } },
      }).catch(() => undefined);
    });

    await this.notifications.createForUser({
      userId,
      type: NotificationType.SUBSCRIPTION,
      title: "Premium expired",
      body: "Your premium access has ended. Redeem a promo code or subscribe to continue.",
      refLabel: "Expired",
    });
    return "done";
  }

  private async handleLocationRequestExpire(requestId: string): Promise<JobOutcome> {
    const request = await this.prisma.locationRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return "noop";
    }
    if (request.status !== LocationRequestStatus.PENDING) {
      return "noop";
    }
    if (request.expiresAt && request.expiresAt.getTime() > Date.now()) {
      return "defer";
    }
    await this.prisma.locationRequest.update({
      where: { id: requestId },
      data: { status: LocationRequestStatus.EXPIRED, respondedAt: new Date() },
    });
    return "done";
  }
}
