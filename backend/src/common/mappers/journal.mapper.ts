import { Journal, JournalEntryType } from "@prisma/client";

export const JOURNAL_TYPES = [
  { key: "INCIDENT", label: "Incident", color: "#DC2626" },
  { key: "TEST", label: "Test", color: "#3A67D5" },
  { key: "UPDATE", label: "Update", color: "#16A34A" },
] as const;

const typeMeta: Record<JournalEntryType, (typeof JOURNAL_TYPES)[number]> = {
  INCIDENT: JOURNAL_TYPES[0],
  TEST: JOURNAL_TYPES[1],
  UPDATE: JOURNAL_TYPES[2],
};

export function parseJournalType(value?: string): JournalEntryType {
  const normalized = (value || "").trim().toUpperCase();
  if (normalized === "INCIDENT" || normalized === "TEST" || normalized === "UPDATE") {
    return normalized;
  }
  return JournalEntryType.UPDATE;
}

export function toJournalDto(entry: Journal) {
  const meta = typeMeta[entry.type];
  const occurredAt = entry.triggeredAt;
  return {
    id: entry.id,
    userId: entry.userId,
    type: meta.key,
    label: meta.label,
    color: meta.color,
    body: entry.body,
    source: entry.source,
    location: entry.location,
    occurredAt: occurredAt.toISOString(),
    dateLabel: formatJournalDate(occurredAt),
    emergencyType: entry.emergencyType,
    severity: entry.severity,
    status: entry.status,
    duration: entry.duration,
    createdAt: entry.createdAt.toISOString(),
  };
}

function formatJournalDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
