import { Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { RealtimeService } from "../../realtime/realtime.service";
import { digitsOnly } from "../../common/utils/phone";
import {
  NOTIFICATION_EMPTY,
  notificationTitle,
  toNotificationDto,
} from "../../common/mappers/notification.mapper";

const PAGE_SIZE = 20;

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  async list(userId: string, query?: string, limit = PAGE_SIZE) {
    const take = Math.min(Math.max(limit, 1), 50);
    const q = query?.trim();
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { body: { contains: q, mode: "insensitive" } },
              { refLabel: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, unreadCount, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: take + 1,
      }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
      this.prisma.notification.count({ where }),
    ]);

    const hasMore = items.length > take;
    const page = hasMore ? items.slice(0, take) : items;

    return {
      ...NOTIFICATION_EMPTY,
      unreadCount,
      total,
      hasMore,
      items: page.map(toNotificationDto),
    };
  }

  async unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(userId: string, id: string) {
    const existing = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundException("Notification not found.");
    }
    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: existing.readAt ?? new Date() },
    });
    return toNotificationDto(updated);
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { read: true };
  }

  async notifyAlertOpened(params: {
    ownerId: string;
    ownerName: string;
    alertId: string;
    source: string;
    groupNames: string[];
    memberPhones: string[];
  }) {
    const groupsLabel = params.groupNames.length
      ? params.groupNames.join(" and ")
      : "your emergency contacts";
    const isDirect = params.source === "SOS" || params.source === "QUICK";
    const ownerType = isDirect ? NotificationType.DIRECT_ALERT : NotificationType.ALERT_RECEIVED;

    await this.createForUser({
      userId: params.ownerId,
      type: ownerType,
      title: isDirect ? "Direct Alert" : "Alert Sent",
      body: `Your emergency alert was sent to ${groupsLabel}.`,
      refLabel: params.groupNames[0] ?? params.alertId,
      alertId: params.alertId,
    });

    const phones = [...new Set(params.memberPhones.map(digitsOnly).filter((value) => value.length >= 7))];
    if (!phones.length) {
      return;
    }

    const recipients = await this.prisma.user.findMany({
      where: { phoneDigits: { in: phones }, NOT: { id: params.ownerId } },
      select: { id: true },
    });

    await Promise.all(
      recipients.map((recipient) =>
        this.createForUser({
          userId: recipient.id,
          type: NotificationType.ALERT_RECEIVED,
          title: notificationTitle(NotificationType.ALERT_RECEIVED),
          body: `${params.ownerName} triggered an emergency alert. Live location is sharing.`,
          refLabel: "Live now",
          alertId: params.alertId,
        }),
      ),
    );
  }

  async notifyAlertCancelled(params: {
    ownerId: string;
    ownerName: string;
    alertId: string;
    memberPhones: string[];
    reasonLabel: string;
  }) {
    const phones = [...new Set(params.memberPhones.map(digitsOnly).filter((value) => value.length >= 7))];
    if (!phones.length) {
      return;
    }

    const recipients = await this.prisma.user.findMany({
      where: { phoneDigits: { in: phones }, NOT: { id: params.ownerId } },
      select: { id: true },
    });

    await Promise.all(
      recipients.map((recipient) =>
        this.createForUser({
          userId: recipient.id,
          type: NotificationType.ALERT_CANCELLED,
          title: notificationTitle(NotificationType.ALERT_CANCELLED),
          body: `${params.ownerName} cancelled their emergency alert.`,
          refLabel: params.reasonLabel,
          alertId: params.alertId,
        }),
      ),
    );
  }

  async notifyContactAdded(adderName: string, phone: string, contactId: string, adderId: string) {
    const phoneDigits = digitsOnly(phone);
    const recipient = await this.prisma.user.findFirst({
      where: { phoneDigits, NOT: { id: adderId } },
      select: { id: true },
    });
    if (!recipient) {
      return;
    }

    await this.createForUser({
      userId: recipient.id,
      type: NotificationType.CONTACT_ADDED,
      title: notificationTitle(NotificationType.CONTACT_ADDED),
      body: `${adderName} added you as an emergency contact.`,
      refLabel: adderName,
      contactId,
    });
  }

  async notifyGroupInvite(params: {
    inviteeUserId: string;
    inviterName: string;
    groupName: string;
  }) {
    await this.createForUser({
      userId: params.inviteeUserId,
      type: NotificationType.GROUP_INVITE,
      title: notificationTitle(NotificationType.GROUP_INVITE),
      body: `${params.inviterName} invited you to ${params.groupName}.`,
      refLabel: params.groupName,
    });
  }

  async notifyResponderUpdate(params: {
    ownerId: string;
    responderName: string;
    alertId: string;
    responding: boolean;
  }) {
    await this.createForUser({
      userId: params.ownerId,
      type: NotificationType.RESPONDER_UPDATE,
      title: params.responding ? "Someone is responding" : "Can't help right now",
      body: params.responding
        ? `${params.responderName} is on the way.`
        : `${params.responderName} can't help right now.`,
      refLabel: params.responderName,
      alertId: params.alertId,
    });
  }

  private async createForUser(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    refLabel?: string;
    alertId?: string;
    contactId?: string;
  }) {
    const item = await this.prisma.notification.create({
      data: {
        id: `ntf-${crypto.randomUUID().slice(0, 8)}`,
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        refLabel: data.refLabel,
        alertId: data.alertId,
        contactId: data.contactId,
      },
    });
    const dto = toNotificationDto(item);
    this.realtime.emitToRoom(`user:${data.userId}`, "notification:new", dto);
    return dto;
  }
}
