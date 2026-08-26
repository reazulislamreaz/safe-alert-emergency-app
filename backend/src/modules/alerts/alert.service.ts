import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { compare } from "bcryptjs";
import {
  AlertMode,
  AlertSource,
  AlertStatus,
  DeliveryStatus,
  InvitationStatus,
  JournalEntryType,
  JournalSource,
  MessageType,
  Prisma,
  Role,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { RealtimeService } from "../../realtime/realtime.service";
import { env } from "../../config/env";
import { isDesignatedAdminEmail } from "../../common/auth/dashboard-admin";
import {
  alertInclude,
  AlertRecord,
  CallParticipant,
  toAlertDto,
} from "../../common/mappers/alert.mapper";
import {
  ALERT_MODES,
  CANCEL_REASONS,
  DEFAULT_EMERGENCY_TYPE_ID,
  emergencyEmoji,
  PARTICIPANT_COLORS,
  QUICK_RESPONSES,
} from "./alert.constants";
import {
  QuickResponseDto,
  RespondAlertDto,
  SendAlertMessageDto,
  TelemetryDto,
  TriggerAlertDto,
  UpdateParticipantDto,
} from "./dto/alert.dto";
import { generateZegoToken04 } from "./zego.util";
import { NotificationService } from "../notifications/notification.service";
import { digitsOnly } from "../../common/utils/phone";

const groupWithMembers = {
  members: { orderBy: { name: "asc" as const } },
} satisfies Prisma.ContactGroupInclude;

@Injectable()
export class AlertService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationService,
  ) {}

  getModes() {
    return {
      title: "Alert Mode",
      prompt: "How Should we alert?",
      subtitle: "This will immediately notify your emergency contacts and share your live location.",
      continueLabel: "Continue",
      modes: ALERT_MODES.map((mode) => ({ ...mode })),
    };
  }

  getCancelReasons() {
    return {
      title: "Cancel Alert",
      prompt: "Why are you Cancelling ?",
      subtitle: "This will immediately notify your emergency contacts that the alert has ended.",
      confirmLabel: "Confirm",
      reasons: CANCEL_REASONS.map((reason) => ({ ...reason })),
    };
  }

  getQuickResponses() {
    return { responses: QUICK_RESPONSES.map((item) => ({ ...item })) };
  }

  async getHome(userId: string) {
    const user = await this.requireUser(userId);
    const [contactCount, active, recentJournals, unreadCount] = await Promise.all([
      this.prisma.contact.count({ where: { userId } }),
      this.findActive(userId),
      this.prisma.journal.findMany({
        where: { userId },
        orderBy: { triggeredAt: "desc" },
        take: 3,
      }),
      this.notifications.unreadCount(userId),
    ]);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const firstName = user.fullName.split(" ")[0];

    return {
      greeting,
      user: {
        id: user.id,
        fullName: user.fullName,
        firstName,
        avatar: user.avatar,
        subscriptionTier: user.subscriptionTier,
      },
      sos: {
        label: "SOS",
        hint: "Tap or hold",
        holdHint: "Hold for 1.5s to skip confirmation",
        holdMs: 1500,
        skipConfirmation: true,
        source: "SOS",
        alertAllGroups: true,
        mode: "EMERGENCY",
      },
      confirmation: {
        title: "Activate Emergency Alert?",
        body: "This will immediately notify your emergency contacts and share your live location.",
        autoActivateSeconds: 4,
        confirmLabel: "Create Now",
        cancelLabel: "Cancel — I'm Safe",
      },
      actions: [
        {
          key: "QUICK",
          label: "Quick Emergency — Alert All Groups",
          alertAllGroups: true,
          mode: "EMERGENCY",
          source: "QUICK",
          skipConfirmation: true,
        },
        {
          key: "MANUAL",
          label: "Create Emergency Alert",
          alertAllGroups: false,
          mode: "EMERGENCY",
          source: "MANUAL",
          skipConfirmation: false,
        },
        {
          key: "TEST",
          label: "Test Emergency Alert",
          alertAllGroups: true,
          mode: "TEST",
          source: "MANUAL",
          skipConfirmation: false,
        },
      ],
      notifications: {
        title: "Notification",
        unreadCount,
      },
      status: active
        ? {
            key: "ACTIVE",
            label: "Active alert",
            lastSeenLabel: "Last seen: Now",
          }
        : {
            key: "SAFE",
            label: "Safe — No active alerts",
            lastSeenLabel: "Last seen: Now",
          },
      hasContacts: contactCount > 0,
      emptyState:
        contactCount === 0
          ? {
              title: "No contacts yet",
              body: "Add people you trust. They'll be notified in emergencies.",
              actionLabel: "Add contact",
            }
          : null,
      recentActivity: recentJournals.map((entry) => ({
        id: entry.id,
        title: entry.body,
        timeLabel: formatRelative(entry.triggeredAt),
        badge: entry.type === "TEST" ? "Test" : entry.source === "ALERT" ? "Safe" : "Update",
      })),
      activeAlert: active ? toAlertDto(active) : null,
    };
  }

  async getCurrent(userId: string) {
    const alert = await this.findActive(userId);
    return alert ? toAlertDto(alert) : null;
  }

  async getInbox(userId: string, tab?: string) {
    const user = await this.requireUser(userId);
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const firstName = user.fullName.split(" ")[0];
    const ownerIds = await this.circleOwnerIds(user.phoneDigits, user.id);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [activeAlerts, pastAlerts, invitations, unreadCount] = await Promise.all([
      ownerIds.length
        ? this.prisma.alert.findMany({
            where: { userId: { in: ownerIds }, status: AlertStatus.BROADCASTING },
            include: alertInclude,
            orderBy: { triggeredAt: "desc" },
          })
        : Promise.resolve([]),
      ownerIds.length
        ? this.prisma.alert.findMany({
            where: {
              userId: { in: ownerIds },
              status: { in: [AlertStatus.CANCELLED, AlertStatus.RESOLVED] },
              triggeredAt: { gte: since },
            },
            include: alertInclude,
            orderBy: { triggeredAt: "desc" },
          })
        : Promise.resolve([]),
      this.prisma.groupInvitation.findMany({
        where: {
          status: InvitationStatus.PENDING,
          OR: [{ inviteeUserId: user.id }, { inviteePhoneDigits: user.phoneDigits }],
        },
        include: { group: true, inviter: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.notifications.unreadCount(userId),
    ]);

    const live = activeAlerts[0];
    const dtoLive = live ? toAlertDto(live) : null;
    const selectedTab = (tab || "active").toLowerCase() === "past" ? "past" : "active";

    return {
      greeting,
      user: {
        id: user.id,
        fullName: user.fullName,
        firstName,
        avatar: user.avatar,
      },
      notifications: { title: "Notification", unreadCount },
      liveBanner: dtoLive
        ? {
            alertId: dtoLive.id,
            title: "LIVE EMERGENCY",
            cta: "Tap to respond →",
            emoji: emergencyEmoji(dtoLive.emergencyTypeId || dtoLive.emergencyType),
            headline: `${emergencyEmoji(dtoLive.emergencyTypeId || dtoLive.emergencyType)} ${dtoLive.userName.split(" ")[0]} needs help!`,
            subtitle: `${dtoLive.emergencyType} · ${dtoLive.location.address} · ${formatRelative(new Date(dtoLive.triggeredAt))}`,
            statusLabel: "LIVE",
          }
        : null,
      tabs: [
        { key: "active", label: `Active(${activeAlerts.length})` },
        { key: "past", label: "Past alerts" },
      ],
      selectedTab,
      emptyActive: {
        title: "No Active Alert yet",
      },
      active: activeAlerts.map((alert) => this.toInboxCard(alert)),
      past: {
        heading: "Past 7 Days",
        items: pastAlerts.map((alert) => ({
          ...this.toInboxCard(alert),
          statusLabel: "Resolved",
          subtitle: `${alert.mode === AlertMode.TEST ? "Test Alert" : alert.emergencyTypeLabel} · ${formatRelative(alert.triggeredAt)}`,
        })),
      },
      invitations: {
        title: "Join an Emergency Group",
        subtitle: "please ! Accept or Reject the pending invitation",
        skipLabel: "Skip for now — join a group later",
        acceptLabel: "Accept & Join",
        declineLabel: "Decline",
        items: invitations.map((invite) => ({
          id: invite.id,
          groupId: invite.groupId,
          groupName: invite.group.name,
          invitedBy: `Invited by ${invite.inviter.fullName}`,
          timeLabel: formatRelative(invite.createdAt),
        })),
      },
      myGroups: await this.circleGroups(user.id, user.phoneDigits),
    };
  }

  async getResponderView(alertId: string, userId: string) {
    const alert = await this.requireAccessible(alertId, userId);
    const viewer = await this.requireUser(userId);
    const dto = toAlertDto(alert);
    const membership = await this.prisma.contactMember.findFirst({
      where: {
        phoneDigits: viewer.phoneDigits,
        group: { userId: alert.userId },
      },
      include: { group: true },
    });
    const self =
      dto.activeCallParticipants.find((participant) => participant.id === `part-${userId}`) ||
      dto.activeCallParticipants.find(
        (participant) => membership?.contactId && participant.contactId === membership.contactId,
      ) ||
      dto.activeCallParticipants.find((participant) => participant.name === viewer.fullName);
    const responding = self?.responderStatus === "RESPONDING" || self?.responderStatus === "EN_ROUTE";

    return {
      ...dto,
      title: "LIVE ALERT",
      groupLabel: membership
        ? `Your group: ${membership.group.name} · ${membership.relationship}`
        : "Your group",
      actions: {
        joinCallLabel: "Join Call",
        messageLabel: "Message",
        respondLabel: "I'm Responding",
        declineLabel: "Can't Help",
      },
      responding,
      respondingTitle: responding ? "You're responding" : undefined,
      respondingBody: responding
        ? `${alert.userName.split(" ")[0]} has been notified you're on the way`
        : undefined,
    };
  }

  async respondToAlert(alertId: string, userId: string, dto: RespondAlertDto) {
    const alert = await this.requireAccessible(alertId, userId);
    const viewer = await this.requireUser(userId);
    const action = dto.action?.toUpperCase();
    if (action !== "RESPONDING" && action !== "CANT_HELP") {
      throw new BadRequestException("Choose I'm Responding or Can't Help.");
    }

    const responderStatus = action === "RESPONDING" ? "RESPONDING" : "CANT_HELP";
    const status = action === "RESPONDING" ? "CONNECTED" : "CALLING";
    const firstName = viewer.fullName.split(" ")[0];
    const participants = ((alert.participants as CallParticipant[] | null) ?? []).map((participant) => {
      const matched =
        participant.id === `part-${userId}` ||
        participant.name === viewer.fullName ||
        participant.displayName === firstName;
      if (!matched) {
        return participant;
      }
      return { ...participant, status, responderStatus };
    });

    const hasSelf = participants.some(
      (participant) => participant.id === `part-${userId}` || participant.name === viewer.fullName,
    );
    if (!hasSelf) {
      participants.push({
        id: `part-${userId}`,
        contactId: null,
        name: viewer.fullName,
        displayName: viewer.fullName.split(" ")[0],
        initials: initialsFrom(viewer.fullName),
        relationship: "Responder",
        status,
        responderStatus,
        color: PARTICIPANT_COLORS[1],
      });
    }

    const updated = await this.prisma.alert.update({
      where: { id: alertId },
      data: { participants: participants as unknown as Prisma.InputJsonValue },
      include: alertInclude,
    });

    this.realtime.emitToRoom(`room:${alertId}`, "alert:state", toAlertDto(updated));
    await this.notifications.notifyResponderUpdate({
      ownerId: alert.userId,
      responderName: viewer.fullName.split(" ")[0],
      alertId,
      responding: action === "RESPONDING",
    });

    return this.getResponderView(alertId, userId);
  }

  async triggerAlert(params: TriggerAlertDto & { userId: string }) {
    const user = await this.requireUser(params.userId);
    const existing = await this.findActive(user.id);
    if (existing) {
      return withSentScreen(toAlertDto(existing));
    }

    const source = parseSource(params.source);
    const mode = params.mode ?? AlertMode.EMERGENCY;
    const alertAllGroups =
      params.alertAllGroups ?? (source === AlertSource.QUICK || source === AlertSource.SOS);

    const emergencyType =
      (await this.prisma.emergencyType.findUnique({
        where: { id: params.emergencyTypeId || DEFAULT_EMERGENCY_TYPE_ID },
      })) ??
      (await this.prisma.emergencyType.findFirst({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }));

    if (!emergencyType) {
      throw new NotFoundException("Emergency type not found");
    }

    const groups = await this.prisma.contactGroup.findMany({
      where: {
        userId: user.id,
        ...(alertAllGroups ? {} : { isDefaultSOS: true }),
      },
      include: groupWithMembers,
    });

    const latitude = params.latitude ?? 40.712776;
    const longitude = params.longitude ?? -74.005974;
    const address = params.address || user.location || "123 Main St, New York, NY 10001";
    const firstName = user.fullName.split(" ")[0];
    const alertId = `alt-${crypto.randomUUID().slice(0, 8)}`;
    const roomId = `safealert-${alertId}`;

    const participants = buildParticipants(user.id, user.fullName, firstName, groups);

    const alert = await this.prisma.alert.create({
      data: {
        id: alertId,
        userId: user.id,
        userName: user.fullName,
        userPhone: user.phone,
        emergencyTypeId: emergencyType.id,
        emergencyTypeLabel: emergencyType.label,
        severity: emergencyType.severity,
        mode,
        source,
        status: AlertStatus.BROADCASTING,
        latitude,
        longitude,
        address,
        roomId,
        participants: participants as unknown as Prisma.InputJsonValue,
        telemetryHistory: {
          create: {
            latitude,
            longitude,
            accuracy: 3,
            speed: 0,
            heading: 0,
            batteryLevel: 92,
          },
        },
        notifiedGroups: {
          create: groups.map((group) => ({
            groupId: group.id,
            groupName: group.name,
            memberCount: group.memberCount || group.members.length,
            deliveryStatus: DeliveryStatus.DELIVERED,
          })),
        },
        liveMessages: {
          create: {
            sender: "SafeAlert System",
            text:
              mode === AlertMode.TEST
                ? `Test alert sent for ${emergencyType.label}. Contacts notified.`
                : `🚨 SOS broadcast started for ${emergencyType.label}. Emergency circle alerted.`,
            timestamp: clockLabel(),
            type: MessageType.SOS,
          },
        },
      },
      include: alertInclude,
    });

    const dto = withSentScreen(toAlertDto(alert));
    this.realtime.emit("admin:alert:new", dto);
    await this.notifications.notifyAlertOpened({
      ownerId: user.id,
      ownerName: firstName,
      alertId: alert.id,
      source,
      groupNames: groups.map((group) => group.name),
      memberPhones: groups.flatMap((group) => group.members.map((member) => member.phone)),
    });
    return dto;
  }

  async triggerDirect(params: TriggerAlertDto & { userId: string }) {
    const source = parseSource(params.source);
    return this.triggerAlert({
      ...params,
      source: source === AlertSource.QUICK ? AlertSource.QUICK : AlertSource.SOS,
      alertAllGroups: true,
      mode: AlertMode.EMERGENCY,
    });
  }

  async getActiveAlertById(id: string) {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: alertInclude,
    });
    return alert ? toAlertDto(alert) : null;
  }

  async getLiveSession(id: string, userId: string) {
    const alert = await this.requireAccessible(id, userId);
    const dto = toAlertDto(alert);
    const respondingContacts = dto.activeCallParticipants
      .filter((participant) => !participant.isSender)
      .map((participant) => ({
        id: participant.id,
        contactId: participant.contactId,
        name: participant.name,
        initials: participant.initials,
        relationship: participant.relationship,
        statusLabel: "En route",
        color: participant.color,
      }));

    return {
      ...dto,
      title: "Live Session",
      sosPinLabel: "SOS",
      actions: {
        startCallLabel: "Start Group Video Call",
        viewLiveLabel: "View Live Session",
        callLabel: "Call",
        endAlertLabel: "End Alert",
        messageLabel: "Message",
        cancelLabel: "Cancel Alert",
      },
      respondingContacts,
    };
  }

  async getCallSession(id: string, userId: string) {
    const alert = await this.requireAccessible(id, userId);
    const dto = toAlertDto(alert);
    const appId = env.zegoAppId;
    const secret = env.zegoServerSecret;
    let token: string | null = null;
    if (appId && secret.length === 32) {
      token = generateZegoToken04(appId, userId, secret, 3600, "");
    }

    return {
      alertId: dto.id,
      roomId: dto.roomId,
      title: "LIVE EMERGENCY CALL",
      groupLabel: "Emergency Group",
      durationLabel: dto.durationLabel,
      userId,
      userName: dto.userName,
      appId: appId || null,
      token,
      demo: !token,
      participants: dto.activeCallParticipants,
      quickResponses: QUICK_RESPONSES.map((item) => ({ ...item })),
    };
  }

  async getActiveAlerts() {
    const alerts = await this.prisma.alert.findMany({
      where: { status: AlertStatus.BROADCASTING },
      include: alertInclude,
      orderBy: { triggeredAt: "desc" },
    });
    return alerts.map(toAlertDto);
  }

  async updateTelemetry(alertId: string, userId: string, point: TelemetryDto) {
    await this.requireOwned(alertId, userId);

    const alert = await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        latitude: point.latitude,
        longitude: point.longitude,
        telemetryHistory: {
          create: {
            latitude: point.latitude,
            longitude: point.longitude,
            speed: point.speed ?? 0,
            heading: point.heading ?? 0,
            accuracy: point.accuracy ?? 3,
            batteryLevel: point.batteryLevel ?? 85,
          },
        },
      },
      include: alertInclude,
    });

    const dto = toAlertDto(alert);
    this.realtime.emitToRoom(`room:${alertId}`, "alert:telemetry:update", {
      alertId,
      location: dto.location,
      latestPoint: dto.telemetryHistory[dto.telemetryHistory.length - 1],
    });
    this.realtime.emitToRoom("room:admin", "admin:alert:telemetry", {
      alertId,
      location: dto.location,
    });
    return dto;
  }

  async addMessage(
    alertId: string,
    sender: string,
    text: string,
    type: MessageType = MessageType.USER,
    senderUserId?: string,
  ) {
    const existing = await this.prisma.alert.findUnique({ where: { id: alertId } });
    if (!existing) {
      return null;
    }

    const alert = await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        liveMessages: {
          create: {
            sender,
            senderUserId,
            text,
            timestamp: clockLabel(),
            type,
          },
        },
      },
      include: alertInclude,
    });

    return toAlertDto(alert);
  }

  async getMessages(alertId: string, userId: string, groupId?: string) {
    const alert = await this.requireAccessible(alertId, userId);
    return this.toChatThread(alert, userId, groupId);
  }

  async sendMessage(alertId: string, userId: string, dto: SendAlertMessageDto) {
    const alert = await this.requireAccessible(alertId, userId);
    const text = dto.text.trim();
    if (!text) {
      throw new BadRequestException("Type your message...");
    }

    const sender = await this.requireUser(userId);
    const updated = await this.addMessage(
      alert.id,
      sender.fullName.split(" ")[0],
      text,
      MessageType.USER,
      sender.id,
    );
    if (updated) {
      this.realtime.emitToRoom(`room:${alertId}`, "alert:messages:update", updated.liveMessages);
    }

    const fresh = await this.requireAlert(alertId);
    return this.toChatThread(fresh, userId, dto.groupId);
  }

  async quickResponse(alertId: string, userId: string, dto: QuickResponseDto) {
    await this.requireOwned(alertId, userId);
    const action = QUICK_RESPONSES.find((item) => item.key === dto.action);
    if (!action) {
      throw new BadRequestException("Unknown quick response.");
    }

    const user = await this.requireUser(userId);
    const updated = await this.addMessage(
      alertId,
      user.fullName.split(" ")[0],
      action.text,
      MessageType.QUICK_REPLY,
      user.id,
    );
    if (updated) {
      this.realtime.emitToRoom(`room:${alertId}`, "alert:messages:update", updated.liveMessages);
    }
    return updated;
  }

  async updateParticipant(alertId: string, userId: string, dto: UpdateParticipantDto) {
    const alert = await this.requireAccessible(alertId, userId);
    const participants = ((alert.participants as CallParticipant[] | null) ?? []).map((participant) => {
      const matched =
        (dto.participantId && participant.id === dto.participantId) ||
        (dto.contactId && participant.contactId === dto.contactId);
      if (!matched) {
        return participant;
      }
      const status = dto.status ?? "CONNECTED";
      return {
        ...participant,
        status,
        responderStatus: status === "CONNECTED" ? "JOINED" : "CALLING",
      };
    });

    const updated = await this.prisma.alert.update({
      where: { id: alertId },
      data: { participants: participants as unknown as Prisma.InputJsonValue },
      include: alertInclude,
    });

    const dtoAlert = toAlertDto(updated);
    this.realtime.emitToRoom(`room:${alertId}`, "alert:state", dtoAlert);
    return dtoAlert;
  }

  async cancelAlert(alertId: string, userId: string, reasonRaw?: string, notes?: string, pin?: string) {
    return this.closeAlert(alertId, userId, reasonRaw, notes, pin);
  }

  async resolveAlert(
    alertId: string,
    reason: string,
    notes: string,
    pin: string,
    userId: string,
  ) {
    return this.closeAlert(alertId, userId, reason, notes, pin);
  }

  private async closeAlert(
    alertId: string,
    userId: string,
    reasonRaw?: string,
    notes?: string,
    pin?: string,
  ) {
    const alert = await this.requireAlert(alertId);
    const closer = await this.requireUser(userId);
    if (alert.userId !== userId && closer.role === Role.USER) {
      throw new ForbiddenException("You can only cancel your own alert.");
    }
    if (alert.status !== AlertStatus.BROADCASTING) {
      throw new BadRequestException("This alert is already closed.");
    }

    const owner = await this.requireUser(alert.userId);
    if (pin) {
      if (!(await compare(pin, owner.pinHash))) {
        throw new BadRequestException("Incorrect Security PIN");
      }
    }

    const reasonMeta =
      CANCEL_REASONS.find((item) => item.key === normalizeReason(reasonRaw)) ?? CANCEL_REASONS[0];
    const durationMins = Math.max(
      1,
      Math.round((Date.now() - alert.triggeredAt.getTime()) / 60000),
    );
    const firstName = owner.fullName.split(" ")[0];
    const cancelledBody = `${firstName} has cancelled their emergency safety alert and indicated that it was a ${reasonPhrase(reasonMeta.key)}.`;

    const [resolved] = await this.prisma.$transaction([
      this.prisma.alert.update({
        where: { id: alertId },
        data: {
          status: AlertStatus.CANCELLED,
          resolvedAt: new Date(),
          resolutionReason: reasonMeta.key,
          resolutionNotes: notes?.trim() || reasonMeta.description,
        },
        include: alertInclude,
      }),
      this.prisma.journal.create({
        data: {
          id: `jrn-${crypto.randomUUID().slice(0, 8)}`,
          userId: alert.userId,
          type: reasonMeta.key === "TEST" ? JournalEntryType.TEST : JournalEntryType.INCIDENT,
          body: notes?.trim() || cancelledBody,
          source: JournalSource.ALERT,
          emergencyType: alert.emergencyTypeLabel,
          severity: alert.severity,
          status: "CANCELLED",
          resolutionReason: reasonMeta.key,
          resolutionNotes: notes?.trim() || reasonMeta.description,
          location: alert.address,
          triggeredAt: alert.triggeredAt,
          duration: `${durationMins} mins`,
        },
      }),
    ]);

    const dto = toAlertDto(resolved);
    const payload = {
      ...dto,
      cancelledTitle: "Alert Cancelled",
      cancelledBody,
      reasonLabel: `Reason: ${reasonMeta.label}`,
      homeLabel: "Back to Home",
    };
    this.realtime.emitToRoom(`room:${alertId}`, "alert:resolved", payload);
    this.realtime.emit("admin:alert:resolved", payload);

    const notified = await this.prisma.alertNotifiedGroup.findMany({ where: { alertId } });
    const groups = await this.prisma.contactGroup.findMany({
      where: { id: { in: notified.map((group) => group.groupId) } },
      include: { members: true },
    });
    await this.notifications.notifyAlertCancelled({
      ownerId: owner.id,
      ownerName: firstName,
      alertId,
      reasonLabel: reasonMeta.label,
      memberPhones: groups.flatMap((group) => group.members.map((member) => member.phone)),
    });
    return payload;
  }

  private async findActive(userId: string) {
    return this.prisma.alert.findFirst({
      where: { userId, status: AlertStatus.BROADCASTING },
      include: alertInclude,
      orderBy: { triggeredAt: "desc" },
    });
  }

  private toInboxCard(alert: AlertRecord) {
    const dto = toAlertDto(alert);
    const emoji = emergencyEmoji(dto.emergencyTypeId || dto.emergencyType);
    return {
      id: dto.id,
      userName: dto.userName,
      initials: initialsFrom(dto.userName),
      emoji,
      statusLabel: dto.status === "BROADCASTING" ? "LIVE" : "Resolved",
      headline: `🚨 ${dto.emergencyType} · ${dto.mode === "EMERGENCY" ? "Emergency Mode" : dto.modeLabel}`,
      subtitle: `${dto.location.address} · ${formatRelative(new Date(dto.triggeredAt))}`,
      emergencyType: dto.emergencyType,
      modeLabel: dto.modeLabel,
      location: dto.location,
      joinCallLabel: "Join Call",
      messageLabel: "Message",
    };
  }

  private async circleOwnerIds(phoneDigits: string, selfId: string) {
    const [members, contacts] = await Promise.all([
      this.prisma.contactMember.findMany({
        where: { phoneDigits },
        select: { group: { select: { userId: true } } },
      }),
      this.prisma.contact.findMany({
        where: { phoneDigits, NOT: { userId: selfId } },
        select: { userId: true },
      }),
    ]);
    return [
      ...new Set(
        [...members.map((row) => row.group.userId), ...contacts.map((row) => row.userId)].filter(
          (id) => id !== selfId,
        ),
      ),
    ];
  }

  private async circleGroups(userId: string, phoneDigits: string) {
    const owned = await this.prisma.contactGroup.findMany({
      where: { userId },
      include: { members: true },
    });
    const memberOf = await this.prisma.contactGroup.findMany({
      where: { members: { some: { phoneDigits } }, NOT: { userId } },
      include: { members: true },
    });
    const groups = [...owned, ...memberOf];
    const viewerOnline = this.realtime.isUserOnline(userId);

    return groups.map((group) => {
      const memberOnline = group.members.filter((member) =>
        this.realtime.isPhoneOnline(member.phoneDigits),
      ).length;
      const ownerCounted =
        group.userId === userId &&
        viewerOnline &&
        !group.members.some((member) => member.phoneDigits === phoneDigits);
      const onlineCount = memberOnline + (ownerCounted ? 1 : 0);
      const memberCount = group.memberCount || group.members.length;
      return {
        id: group.id,
        name: group.name,
        memberCount,
        onlineCount,
        memberLabel: `${memberCount} members · ${onlineCount} online`,
      };
    });
  }

  private async requireAlert(id: string) {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: alertInclude,
    });
    if (!alert) {
      throw new NotFoundException("Alert not found");
    }
    return alert;
  }

  private async requireOwned(alertId: string, userId: string) {
    const alert = await this.requireAlert(alertId);
    if (alert.userId !== userId) {
      throw new ForbiddenException("You can only update your own alert.");
    }
    return alert;
  }

  private async requireAccessible(alertId: string, userId: string) {
    const alert = await this.requireAlert(alertId);
    const viewer = await this.requireUser(userId);
    if (
      alert.userId === userId ||
      (viewer.role === Role.ADMIN && isDesignatedAdminEmail(viewer.email))
    ) {
      return alert;
    }

    const phones = new Set(
      (
        await this.prisma.contactMember.findMany({
          where: {
            OR: [
              { groupId: { in: alert.notifiedGroups.map((group) => group.groupId) } },
              { group: { userId: alert.userId } },
            ],
          },
          select: { phone: true, phoneDigits: true },
        })
      ).flatMap((member) => [digitsOnly(member.phone), member.phoneDigits].filter(Boolean)),
    );
    if (!phones.has(viewer.phoneDigits)) {
      throw new ForbiddenException("You cannot access this emergency.");
    }
    return alert;
  }

  private async toChatThread(alert: AlertRecord, viewerId: string, groupId?: string) {
    const viewer = await this.requireUser(viewerId);
    const requested = groupId?.trim();
    const selected =
      alert.notifiedGroups.find((group) => group.groupId === requested) ?? alert.notifiedGroups[0];

    const members = selected
      ? await this.prisma.contactMember.findMany({
          where: { groupId: selected.groupId },
          orderBy: { name: "asc" },
        })
      : [];

    return {
      alertId: alert.id,
      title: selected?.groupName ?? "Emergency Group",
      statusLabel: alert.status === AlertStatus.BROADCASTING ? "Online" : "Offline",
      placeholder: "Type your message...",
      groupId: selected?.groupId ?? null,
      groups: alert.notifiedGroups.map((group) => ({
        groupId: group.groupId,
        groupName: group.groupName,
        memberCount: group.memberCount,
      })),
      avatars: members.slice(0, 3).map((member) => ({
        id: member.contactId ?? member.id,
        name: member.name,
        initials: initialsFrom(member.name),
      })),
      messages: alert.liveMessages.map((message) => ({
        id: message.id,
        sender: message.sender,
        senderUserId: message.senderUserId,
        text: message.text,
        timestamp: message.timestamp,
        type: message.type,
        isMine: isOwnMessage(message.senderUserId, message.sender, message.type, viewer),
      })),
    };
  }

  private async requireUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }
}

function parseSource(value?: string): AlertSource {
  const normalized = (value || "").trim().toUpperCase();
  if (normalized === "QUICK") return AlertSource.QUICK;
  if (normalized === "SOS" || normalized === "DIRECT") return AlertSource.SOS;
  return AlertSource.MANUAL;
}

function withSentScreen<T extends object>(dto: T) {
  return {
    ...dto,
    sentTitle: "Alert Sent!",
    sentBody: "Your contacts are being notified",
    liveLocationLabel: "Live Location Active",
    notifiedGroupsHeading: "NOTIFIED GROUPS",
    actions: {
      startCallLabel: "Start Group Video Call",
      viewLiveLabel: "View Live Session",
      messageLabel: "Message",
      cancelLabel: "Cancel Alert",
    },
  };
}

function isOwnMessage(
  senderUserId: string | null,
  sender: string,
  type: MessageType,
  viewer: { id: string; fullName: string },
) {
  if (senderUserId) {
    return senderUserId === viewer.id;
  }
  if (type === MessageType.SOS) {
    return false;
  }
  const firstName = viewer.fullName.split(" ")[0];
  return sender === viewer.fullName || sender === firstName || sender.startsWith(`You (${firstName})`);
}

function normalizeReason(value?: string): "SAFE" | "FALSE_ALARM" | "TEST" {
  const normalized = (value || "").trim().toUpperCase().replace(/[\s'-]/g, "_");
  if (normalized === "FALSE_ALERT" || normalized === "FALSE_ALARM") return "FALSE_ALARM";
  if (normalized === "TEST") return "TEST";
  if (normalized === "IM_SAFE" || normalized === "I_M_SAFE" || normalized === "SAFE") return "SAFE";
  return "SAFE";
}

function reasonPhrase(reason: "SAFE" | "FALSE_ALARM" | "TEST"): string {
  if (reason === "FALSE_ALARM") return "false alert";
  if (reason === "TEST") return "test alert";
  return "safe situation";
}

function clockLabel(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatRelative(date: Date): string {
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return "Yesterday";
  return `${Math.round(hours / 24)}d ago`;
}

function buildParticipants(
  userId: string,
  fullName: string,
  firstName: string,
  groups: Array<{ members: Array<{ id: string; contactId: string | null; name: string; relationship: string; isJoinedCall: boolean }> }>,
): CallParticipant[] {
  const seen = new Set<string>();
  const sender: CallParticipant = {
    id: `part-${userId}`,
    contactId: null,
    name: fullName,
    displayName: `You (${firstName})`,
    initials: initialsFrom(fullName),
    relationship: "Sender",
    status: "CONNECTED",
    responderStatus: "JOINED",
    color: PARTICIPANT_COLORS[0],
    isSender: true,
  };

  const members: CallParticipant[] = [];
  for (const group of groups) {
    for (const member of group.members) {
      const key = member.contactId || member.id;
      if (seen.has(key)) continue;
      seen.add(key);
      const joined = member.isJoinedCall;
      members.push({
        id: `part-${key}`,
        contactId: member.contactId,
        name: member.name,
        displayName: member.name.split(" ")[0],
        initials: initialsFrom(member.name),
        relationship: member.relationship,
        status: joined ? "CONNECTED" : "CALLING",
        responderStatus: joined ? "JOINED" : "CALLING",
        color: PARTICIPANT_COLORS[(members.length + 1) % PARTICIPANT_COLORS.length],
      });
    }
  }

  return [sender, ...members];
}

function initialsFrom(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}
