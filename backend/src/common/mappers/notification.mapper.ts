import { Notification, NotificationType } from "@prisma/client";
import { SOUND_KEYS } from "../utils/location-share";

export const NOTIFICATION_EMPTY = {
  title: "Notification",
  searchPlaceholder: "Search Your Notifications",
  emptyTitle: "No Notification Yet",
  seeMoreLabel: "See More",
};

export function soundForNotificationType(type: NotificationType): {
  soundKey: string;
  soundUrl: string;
} {
  switch (type) {
    case NotificationType.ALERT_RECEIVED:
    case NotificationType.DIRECT_ALERT:
    case NotificationType.FOLLOW_UP_ALERT:
    case NotificationType.COUNTDOWN_ESCALATED:
      return {
        soundKey: SOUND_KEYS.EMERGENCY_ALERT,
        soundUrl: "/sounds/emergency-alert.mp3",
      };
    default:
      return {
        soundKey: SOUND_KEYS.CIRCLE_NOTIFY,
        soundUrl: "/sounds/circle-notify.mp3",
      };
  }
}

export function toNotificationDto(item: Notification) {
  const sound = soundForNotificationType(item.type);
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    body: item.body,
    refLabel: item.refLabel,
    alertId: item.alertId,
    contactId: item.contactId,
    soundKey: sound.soundKey,
    soundUrl: sound.soundUrl,
    read: Boolean(item.readAt),
    timeLabel: formatNotificationTime(item.createdAt),
    createdAt: item.createdAt.toISOString(),
  };
}

export type NotificationDto = ReturnType<typeof toNotificationDto>;

export function notificationTitle(type: NotificationType): string {
  if (type === NotificationType.DIRECT_ALERT) return "Direct Alert";
  if (type === NotificationType.ALERT_RECEIVED) return "Alert Received";
  if (type === NotificationType.ALERT_CANCELLED) return "Alert Cancelled";
  if (type === NotificationType.CONTACT_ADDED) return "Someone added you";
  if (type === NotificationType.GROUP_INVITE) return "Group invitation";
  if (type === NotificationType.RESPONDER_UPDATE) return "Someone is responding";
  if (type === NotificationType.SAFETY_COUNTDOWN) return "Safety countdown";
  if (type === NotificationType.FOLLOW_UP_ALERT) return "Emergency still active";
  if (type === NotificationType.LOCATION_REQUEST) return "Location request";
  if (type === NotificationType.BYSTANDER) return "Bystander-assisted message";
  if (type === NotificationType.PROMO) return "Premium access";
  if (type === NotificationType.COUNTDOWN_ESCALATED) return "Countdown escalated";
  return "Subscription Alert";
}

function formatNotificationTime(date: Date): string {
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}
