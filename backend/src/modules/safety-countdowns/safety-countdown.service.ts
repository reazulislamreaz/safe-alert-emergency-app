import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  NotificationType,
  SafetyCountdownStatus,
  ScheduledJobType,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { JobsService } from "../jobs/jobs.service";
import { NotificationService } from "../notifications/notification.service";
import { StartSafetyCountdownDto } from "./dto/safety-countdown.dto";

const DURATION_MS = 30 * 60 * 1000;

@Injectable()
export class SafetyCountdownService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: JobsService,
    private readonly notifications: NotificationService,
  ) {}

  async start(userId: string, dto: StartSafetyCountdownDto) {
    const existing = await this.prisma.safetyCountdown.findFirst({
      where: { userId, status: SafetyCountdownStatus.ACTIVE },
    });
    if (existing) {
      return this.toDto(existing);
    }

    const expiresAt = new Date(Date.now() + DURATION_MS);
    const countdown = await this.prisma.safetyCountdown.create({
      data: {
        userId,
        expiresAt,
        notes: dto.notes?.trim() || null,
        status: SafetyCountdownStatus.ACTIVE,
      },
    });

    await this.jobs.enqueue(ScheduledJobType.COUNTDOWN_EXPIRE, countdown.id, expiresAt);
    await this.notifications.createForUser({
      userId,
      type: NotificationType.SAFETY_COUNTDOWN,
      title: "Safety countdown started",
      body: "Confirm you are safe within 30 minutes, or your Safety Circle will be alerted.",
      refLabel: "30 min",
    });

    return this.toDto(countdown);
  }

  async current(userId: string) {
    const countdown = await this.prisma.safetyCountdown.findFirst({
      where: { userId, status: SafetyCountdownStatus.ACTIVE },
      orderBy: { startedAt: "desc" },
    });
    return countdown ? this.toDto(countdown) : null;
  }

  async confirmSafe(userId: string, id: string) {
    const countdown = await this.requireOwnedActive(userId, id);
    const updated = await this.prisma.safetyCountdown.update({
      where: { id: countdown.id },
      data: {
        status: SafetyCountdownStatus.CONFIRMED_SAFE,
        confirmedAt: new Date(),
      },
    });
    await this.jobs.cancel(ScheduledJobType.COUNTDOWN_EXPIRE, countdown.id);
    return this.toDto(updated);
  }

  async cancel(userId: string, id: string) {
    const countdown = await this.requireOwnedActive(userId, id);
    const updated = await this.prisma.safetyCountdown.update({
      where: { id: countdown.id },
      data: {
        status: SafetyCountdownStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
    await this.jobs.cancel(ScheduledJobType.COUNTDOWN_EXPIRE, countdown.id);
    return this.toDto(updated);
  }

  private async requireOwnedActive(userId: string, id: string) {
    const countdown = await this.prisma.safetyCountdown.findFirst({
      where: { id, userId },
    });
    if (!countdown) {
      throw new NotFoundException("Safety countdown not found.");
    }
    if (countdown.status !== SafetyCountdownStatus.ACTIVE) {
      throw new BadRequestException("This countdown is no longer active.");
    }
    return countdown;
  }

  private toDto(countdown: {
    id: string;
    userId: string;
    status: SafetyCountdownStatus;
    startedAt: Date;
    expiresAt: Date;
    confirmedAt: Date | null;
    cancelledAt: Date | null;
    escalatedAt: Date | null;
    alertId: string | null;
    notes: string | null;
  }) {
    const remainingMs = Math.max(0, countdown.expiresAt.getTime() - Date.now());
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return {
      id: countdown.id,
      userId: countdown.userId,
      status: countdown.status,
      durationMinutes: 30,
      startedAt: countdown.startedAt.toISOString(),
      expiresAt: countdown.expiresAt.toISOString(),
      remainingSeconds,
      remainingLabel: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      confirmedAt: countdown.confirmedAt?.toISOString() ?? null,
      cancelledAt: countdown.cancelledAt?.toISOString() ?? null,
      escalatedAt: countdown.escalatedAt?.toISOString() ?? null,
      alertId: countdown.alertId,
      notes: countdown.notes,
      serverTime: new Date().toISOString(),
    };
  }
}
