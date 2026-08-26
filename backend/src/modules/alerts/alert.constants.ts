import { Severity } from "@prisma/client";

export const PARTICIPANT_COLORS = ["#3A67D5", "#3B82F6", "#8B5CF6", "#00AA1D", "#F59E0B", "#DC2626"];

export const ALERT_MODES = [
  {
    key: "EMERGENCY" as const,
    label: "Emergency Mode",
    shortLabel: "Emergency",
    description: "Loud siren, visible alert, full notification to all emergency contacts.",
    tags: ["Siren", "Full Alert", "Visible"],
    color: "#DC2626",
  },
  {
    key: "SILENT" as const,
    label: "Silent Mode",
    shortLabel: "Silent",
    description: "Discreet alert. No sound. Contacts are notified quietly with live location.",
    tags: ["No Sound", "Discreet", "Safe"],
    color: "#3A67D5",
    warning: "Starting a video call in Silent Mode may reveal your surroundings or identity.",
  },
];

export const CANCEL_REASONS = [
  {
    key: "SAFE" as const,
    label: "I'm Safe",
    description: "Situation resolved, I am safe",
  },
  {
    key: "FALSE_ALARM" as const,
    label: "False Alert",
    description: "Accidentally triggered the alert",
  },
  {
    key: "TEST" as const,
    label: "Test",
    description: "This was a test alert",
  },
];

export const QUICK_RESPONSES = [
  { key: "need_help", label: "Need Help", text: "🚨 I NEED IMMEDIATE HELP!" },
  { key: "send_location", label: "Send Location", text: "📍 Live Location pin broadcasted." },
  { key: "im_safe", label: "I'm Safe", text: "✅ I am currently safe and secure." },
] as const;

export const FIGMA_EMERGENCY_TYPES = [
  {
    id: "et-assault",
    key: "ASSAULT",
    label: "Assault",
    severity: Severity.CRITICAL,
    icon: "ShieldAlert",
    description: "Immediate violent threat or physical harassment",
    sortOrder: 1,
  },
  {
    id: "et-medical",
    key: "MEDICAL",
    label: "Medical",
    severity: Severity.CRITICAL,
    icon: "HeartPulse",
    description: "Severe injury, unconsciousness, cardiac or allergic reaction",
    sortOrder: 2,
  },
  {
    id: "et-fire",
    key: "FIRE",
    label: "Fire",
    severity: Severity.CRITICAL,
    icon: "Flame",
    description: "Building fire, gas leak, or smoke",
    sortOrder: 3,
  },
  {
    id: "et-accident",
    key: "ACCIDENT",
    label: "Accident",
    severity: Severity.HIGH,
    icon: "Car",
    description: "Vehicular collision or roadside emergency",
    sortOrder: 4,
  },
  {
    id: "et-theft",
    key: "THEFT",
    label: "Theft",
    severity: Severity.HIGH,
    icon: "Wallet",
    description: "Robbery, snatching, or stolen belongings",
    sortOrder: 5,
  },
  {
    id: "et-stalking",
    key: "STALKING",
    label: "Stalking",
    severity: Severity.URGENT,
    icon: "Eye",
    description: "Being followed or observing a dangerous prowler",
    sortOrder: 6,
  },
  {
    id: "et-disaster",
    key: "NATURAL_DISASTER",
    label: "Natural Disaster",
    severity: Severity.CRITICAL,
    icon: "CloudLightning",
    description: "Earthquake, flood, storm, or environmental hazard",
    sortOrder: 7,
  },
  {
    id: "et-mental",
    key: "MENTAL_HEALTH",
    label: "Mental Health",
    severity: Severity.HIGH,
    icon: "Brain",
    description: "Panic, self-harm risk, or mental-health crisis",
    sortOrder: 8,
  },
  {
    id: "et-child",
    key: "CHILD_IN_DANGER",
    label: "Child in danger",
    severity: Severity.CRITICAL,
    icon: "Baby",
    description: "A child is missing, injured, or in immediate danger",
    sortOrder: 9,
  },
  {
    id: "et-unsafe",
    key: "UNSAFE",
    label: "I don’t feel safe",
    severity: Severity.URGENT,
    icon: "MoreVertical",
    description: "Unspecified danger — notify contacts and share live location",
    sortOrder: 10,
  },
] as const;

export const DEFAULT_EMERGENCY_TYPE_ID = "et-unsafe";
