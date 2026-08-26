import { Notification, NotificationType } from "@prisma/client";

export const NOTIFICATION_EMPTY = {
  title: "Notification",
  searchPlaceholder: "Search Your Notifications",
  emptyTitle: "No Notification Yet",
  seeMoreLabel: "See More",
};

export function toNotificationDto(item: Notification) {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    body: item.body,
    refLabel: item.refLabel,
    alertId: item.alertId,
    contactId: item.contactId,
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
