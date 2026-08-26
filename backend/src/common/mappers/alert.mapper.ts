import {
  Alert,
  AlertNotifiedGroup,
  LiveMessage,
  Prisma,
  TelemetryPoint,
} from "@prisma/client";

export const alertInclude = {
  telemetryHistory: { orderBy: { timestamp: "asc" as const } },
  notifiedGroups: true,
  liveMessages: { orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.AlertInclude;

export type AlertRecord = Alert & {
  telemetryHistory: TelemetryPoint[];
  notifiedGroups: AlertNotifiedGroup[];
  liveMessages: LiveMessage[];
};

export type CallParticipant = {
  id: string;
  name: string;
  initials: string;
  status: "CONNECTED" | "CALLING";
  color: string;
  isSender?: boolean;
};

export function toAlertDto(alert: AlertRecord) {
  return {
    id: alert.id,
    userId: alert.userId,
    userName: alert.userName,
    userPhone: alert.userPhone,
    emergencyTypeId: alert.emergencyTypeId,
    emergencyType: alert.emergencyTypeLabel,
    severity: alert.severity,
    mode: alert.mode,
    status: alert.status,
    location: {
      latitude: alert.latitude,
      longitude: alert.longitude,
      address: alert.address,
    },
    telemetryHistory: alert.telemetryHistory.map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude,
      accuracy: point.accuracy,
      speed: point.speed,
      heading: point.heading,
      batteryLevel: point.batteryLevel,
      timestamp: point.timestamp.toISOString(),
    })),
    notifiedGroups: alert.notifiedGroups.map((group) => ({
      groupId: group.groupId,
      groupName: group.groupName,
      memberCount: group.memberCount,
      deliveryStatus: group.deliveryStatus,
    })),
    activeCallParticipants: (alert.participants as CallParticipant[] | null) ?? [],
    liveMessages: alert.liveMessages.map((message) => ({
      id: message.id,
      sender: message.sender,
      text: message.text,
      timestamp: message.timestamp,
      type: message.type,
    })),
    triggeredAt: alert.triggeredAt.toISOString(),
    resolvedAt: alert.resolvedAt?.toISOString(),
    resolutionReason: alert.resolutionReason ?? undefined,
    resolutionNotes: alert.resolutionNotes ?? undefined,
  };
}

export type AlertDto = ReturnType<typeof toAlertDto>;
