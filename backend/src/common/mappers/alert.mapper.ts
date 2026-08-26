import {
  Alert,
  AlertNotifiedGroup,
  LiveMessage,
  Prisma,
  TelemetryPoint,
} from "@prisma/client";
import { ALERT_MODES } from "../../modules/alerts/alert.constants";

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
  contactId?: string | null;
  name: string;
  displayName: string;
  initials: string;
  relationship?: string;
  status: "CONNECTED" | "CALLING";
  responderStatus: "JOINED" | "CALLING" | "EN_ROUTE";
  color: string;
  isSender?: boolean;
};

export function formatDuration(from: Date, to: Date = new Date()): string {
  const totalSeconds = Math.max(0, Math.floor((to.getTime() - from.getTime()) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function modeLabel(mode: string): string {
  return ALERT_MODES.find((item) => item.key === mode)?.shortLabel ?? "Emergency";
}

export function toAlertDto(alert: AlertRecord) {
  const participants = (alert.participants as CallParticipant[] | null) ?? [];
  return {
    id: alert.id,
    userId: alert.userId,
    userName: alert.userName,
    userPhone: alert.userPhone,
    emergencyTypeId: alert.emergencyTypeId,
    emergencyType: alert.emergencyTypeLabel,
    severity: alert.severity,
    mode: alert.mode,
    modeLabel: modeLabel(alert.mode),
    source: alert.source,
    status: alert.status,
    statusLabel: alert.status === "BROADCASTING" ? "Active Alert" : alert.status === "CANCELLED" ? "Alert Cancelled" : alert.status,
    location: {
      latitude: alert.latitude,
      longitude: alert.longitude,
      address: alert.address,
    },
    liveLocationActive: alert.status === "BROADCASTING",
    durationLabel: formatDuration(alert.triggeredAt, alert.resolvedAt ?? new Date()),
    roomId: alert.roomId ?? `safealert-${alert.id}`,
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
      memberLabel: `${group.memberCount} member${group.memberCount === 1 ? "" : "s"}`,
      deliveryStatus: group.deliveryStatus,
      deliveryLabel: group.deliveryStatus === "DELIVERED" ? "✓ Delivered" : "Pending",
    })),
    activeCallParticipants: participants.map((participant) => ({
      ...participant,
      name: participant.name,
      displayName: participant.displayName || participant.name,
      responderStatus: participant.responderStatus || (participant.status === "CONNECTED" ? "JOINED" : "CALLING"),
      statusLabel: participant.status === "CONNECTED" ? "Joined" : "Calling…",
    })),
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
