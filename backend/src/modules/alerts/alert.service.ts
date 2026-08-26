import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { compare } from "bcryptjs";
import {
  AlertMode,
  AlertStatus,
  DeliveryStatus,
  MessageType,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { RealtimeService } from "../../realtime/realtime.service";
import {
  alertInclude,
  CallParticipant,
  toAlertDto,
} from "../../common/mappers/alert.mapper";
import { TriggerAlertDto, TelemetryDto } from "./dto/alert.dto";

@Injectable()
export class AlertService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  async triggerAlert(params: TriggerAlertDto & { userId: string }) {
    const user =
      (await this.prisma.user.findUnique({ where: { id: params.userId } })) ??
      (await this.prisma.user.findUnique({ where: { id: "usr-sarah-101" } }));

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const emergencyType =
      (await this.prisma.emergencyType.findUnique({
        where: { id: params.emergencyTypeId || "et-assault" },
      })) ?? (await this.prisma.emergencyType.findFirst());

    if (!emergencyType) {
      throw new NotFoundException("Emergency type not found");
    }

    const groups = await this.prisma.contactGroup.findMany({
      where: { userId: user.id },
    });

    const latitude = params.latitude ?? 40.712776;
    const longitude = params.longitude ?? -74.005974;
    const address = params.address || "123 Main St, New York, NY 10001";
    const firstName = user.fullName.split(" ")[0];
    const initials = user.fullName
      .split(" ")
      .map((part) => part[0])
      .join("");

    const participants: CallParticipant[] = [
      {
        id: `part-${user.id}`,
        name: `You (${firstName})`,
        initials,
        status: "CONNECTED",
        color: "#3A67D5",
        isSender: true,
      },
      {
        id: "part-james",
        name: "James",
        initials: "JJ",
        status: "CONNECTED",
        color: "#3B82F6",
      },
      {
        id: "part-emma",
        name: "Emma",
        initials: "ES",
        status: "CONNECTED",
        color: "#8B5CF6",
      },
    ];

    const alert = await this.prisma.alert.create({
      data: {
        id: `alt-${Date.now()}`,
        userId: user.id,
        userName: user.fullName,
        userPhone: user.phone,
        emergencyTypeId: emergencyType.id,
        emergencyTypeLabel: emergencyType.label,
        severity: emergencyType.severity,
        mode: params.mode ?? AlertMode.EMERGENCY,
        status: AlertStatus.BROADCASTING,
        latitude,
        longitude,
        address,
        participants: participants as unknown as Prisma.InputJsonValue,
        telemetryHistory: {
          create: {
            latitude,
            longitude,
            accuracy: 3,
            speed: 1,
            heading: 0,
            batteryLevel: 92,
          },
        },
        notifiedGroups: {
          create: groups.map((group) => ({
            groupId: group.id,
            groupName: group.name,
            memberCount: group.memberCount,
            deliveryStatus: DeliveryStatus.DELIVERED,
          })),
        },
        liveMessages: {
          create: {
            sender: "SafeAlert System",
            text: `🚨 SOS broadcast started for ${emergencyType.label}. Emergency circle alerted.`,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            type: MessageType.SOS,
          },
        },
      },
      include: alertInclude,
    });

    const dto = toAlertDto(alert);
    this.realtime.emit("admin:alert:new", dto);
    return dto;
  }

  async getActiveAlertById(id: string) {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: alertInclude,
    });
    return alert ? toAlertDto(alert) : null;
  }

  async getActiveAlerts() {
    const alerts = await this.prisma.alert.findMany({
      where: { status: AlertStatus.BROADCASTING },
      include: alertInclude,
      orderBy: { triggeredAt: "desc" },
    });
    return alerts.map(toAlertDto);
  }

  async updateTelemetry(alertId: string, point: TelemetryDto) {
    const existing = await this.prisma.alert.findUnique({ where: { id: alertId } });
    if (!existing) {
      return null;
    }

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
            text,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            type,
          },
        },
      },
      include: alertInclude,
    });

    return toAlertDto(alert);
  }

  async resolveAlert(
    alertId: string,
    reason: "SAFE" | "FALSE_ALARM" | "TEST",
    notes: string,
    pin: string,
    userId: string,
  ) {
    const alert = await this.prisma.alert.findUnique({
      where: { id: alertId },
      include: alertInclude,
    });
    if (!alert) {
      throw new NotFoundException("Alert not found");
    }

    const user =
      (await this.prisma.user.findUnique({ where: { id: userId } })) ??
      (await this.prisma.user.findUnique({ where: { id: "usr-sarah-101" } }));

    if (!user || !(await compare(pin, user.pinHash))) {
      throw new BadRequestException("Incorrect Security PIN");
    }

    const durationMins = Math.max(
      1,
      Math.round((Date.now() - alert.triggeredAt.getTime()) / 60000),
    );

    const [resolved] = await this.prisma.$transaction([
      this.prisma.alert.update({
        where: { id: alertId },
        data: {
          status: AlertStatus.RESOLVED,
          resolvedAt: new Date(),
          resolutionReason: reason,
          resolutionNotes: notes,
        },
        include: alertInclude,
      }),
      this.prisma.journal.create({
        data: {
          id: `jrn-${Date.now()}`,
          userId: alert.userId,
          emergencyType: alert.emergencyTypeLabel,
          severity: alert.severity,
          status: "RESOLVED",
          resolutionReason: reason,
          resolutionNotes: notes,
          location: alert.address,
          triggeredAt: alert.triggeredAt,
          duration: `${durationMins} mins`,
        },
      }),
    ]);

    const dto = toAlertDto(resolved);
    this.realtime.emitToRoom(`room:${alertId}`, "alert:resolved", dto);
    this.realtime.emit("admin:alert:resolved", dto);
    return dto;
  }
}
