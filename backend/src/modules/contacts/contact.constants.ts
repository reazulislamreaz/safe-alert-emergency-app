/** Status dropdown values from the Figma Add Contact modal, plus close relatives. */
export const CONTACT_STATUSES = [
  "Father",
  "Mother",
  "Sister",
  "Brother",
  "Spouse",
  "Friend",
  "Colleague",
  "Neighbor",
  "Other",
] as const;

export const REFERRAL_COPY = {
  title: "Invite your Friends to Safe Alert App",
  subtitle: "Invite trusted contacts to join your safety circle and stay connected.",
  cta: "Share referral link",
} as const;

export const GROUP_COLORS = [
  { key: "blue", value: "#3A67D5", label: "Blue" },
  { key: "green", value: "#00AA1D", label: "Green" },
  { key: "red", value: "#DC2626", label: "Red" },
  { key: "orange", value: "#F97316", label: "Orange" },
  { key: "purple", value: "#8B5CF6", label: "Purple" },
] as const;

export const CONTACTS_EMPTY = {
  title: "No contacts yet",
  body: "Add people you trust. They'll be notified in emergencies.",
  actionLabel: "Add contact",
} as const;

export const GROUPS_EMPTY = {
  title: "No groups yet",
  body: "Create a group so the right people are notified together.",
  actionLabel: "+ Add New Group",
} as const;
