export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  phoneMasked?: string;
  role: "USER" | "SUPER_ADMIN";
  subscriptionTier: "FREE" | "PREMIUM";
  isVerified: boolean;
  pin: string;
  avatar?: string;
  dob?: string | null;
  location?: string | null;
  profilePhotos?: string[];
  faceIdEnabled?: boolean;
  createdAt: string;
}

export type AuthAudience = "app" | "dashboard";

export function isDashboardAdmin(user: Pick<User, "role"> | null | undefined, audience?: string): boolean {
  return user?.role === "SUPER_ADMIN" && audience === "dashboard";
}

export interface TelemetryPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  batteryLevel: number;
  timestamp: string;
}

export interface ActiveAlert {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  emergencyTypeId: string;
  emergencyType: string;
  severity: "LOW" | "URGENT" | "HIGH" | "CRITICAL";
  mode: "EMERGENCY" | "SILENT" | "TEST";
  modeLabel?: string;
  source?: "MANUAL" | "QUICK" | "SOS" | string;
  status: "TRIGGERED" | "BROADCASTING" | "RESOLVED" | "CANCELLED";
  statusLabel?: string;
  durationLabel?: string;
  roomId?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  telemetryHistory: TelemetryPoint[];
  notifiedGroups: {
    groupId: string;
    groupName: string;
    memberCount: number;
    deliveryStatus: "DELIVERED" | "PENDING";
  }[];
  activeCallParticipants: {
    id: string;
    name: string;
    initials: string;
    status: "CONNECTED" | "CALLING";
    color: string;
    isSender?: boolean;
  }[];
  liveMessages: {
    id: string;
    sender: string;
    senderUserId?: string | null;
    text: string;
    timestamp: string;
    type: "SOS" | "QUICK_REPLY" | "USER";
  }[];
  sentTitle?: string;
  sentBody?: string;
  triggeredAt: string;
  resolvedAt?: string;
  resolutionReason?: "SAFE" | "FALSE_ALARM" | "TEST";
  resolutionNotes?: string;
}

export interface AlertInboxCard {
  id: string;
  title?: string;
  userName?: string;
  initials?: string;
  emoji?: string;
  headline?: string;
  subtitle?: string;
  statusLabel?: string;
  timeLabel?: string;
  emergencyType?: string;
  modeLabel?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  joinCallLabel?: string;
  messageLabel?: string;
}

export interface AlertInbox {
  greeting: string;
  user?: {
    id: string;
    fullName: string;
    firstName: string;
    avatar?: string | null;
  };
  notifications?: { title: string; unreadCount: number };
  liveBanner: {
    alertId: string;
    title: string;
    cta: string;
    emoji?: string;
    headline: string;
    subtitle: string;
    statusLabel: string;
  } | null;
  tabs: { key: string; label: string }[];
  selectedTab: "active" | "past";
  emptyActive: { title: string };
  active: AlertInboxCard[];
  past: { heading: string; items: AlertInboxCard[] };
  invitations: {
    title: string;
    subtitle: string;
    skipLabel: string;
    acceptLabel: string;
    declineLabel: string;
    items: { id: string; groupId: string; groupName: string; invitedBy: string; timeLabel?: string }[];
  };
  myGroups: { id: string; name: string; memberCount: number; onlineCount: number; memberLabel: string }[];
}

export interface AlertResponderView extends ActiveAlert {
  title: string;
  groupLabel: string;
  actions: {
    joinCallLabel: string;
    messageLabel: string;
    respondLabel: string;
    declineLabel: string;
  };
  responding: boolean;
  respondingTitle?: string;
  respondingBody?: string;
}

export interface EmergencyType {
  id: string;
  key: string;
  label: string;
  severity: "LOW" | "URGENT" | "HIGH" | "CRITICAL";
  icon: string;
  description: string;
  isActive: boolean;
  sortOrder?: number;
}

export interface ContactMember {
  id: string;
  groupId: string;
  contactId?: string | null;
  name: string;
  firstName?: string;
  chipLabel?: string;
  phone: string;
  relationship: string;
  initials?: string;
  isJoinedCall?: boolean;
  online?: boolean;
}

export interface ContactGroup {
  id: string;
  userId: string;
  name: string;
  tag?: string;
  color: string;
  isDefaultSOS: boolean;
  memberCount: number;
  memberLimit?: number | null;
  memberLabel?: string;
  presenceLabel?: string;
  onlineCount?: number;
  memberCounter?: string;
  canAddMember?: boolean;
  inviteCta?: string;
  members?: ContactMember[];
}

export interface AddressBookContact {
  id: string;
  userId: string;
  name: string;
  firstName?: string;
  phone: string;
  relationship: string;
  status?: string;
  initials?: string;
  group?: { id: string; name: string; tag: string; color: string } | null;
  groups?: { id: string; name: string; tag: string; color: string }[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  maxContacts: number;
  maxGroups: number;
  features: string[];
  subscriberCount: number;
}

export interface HistoricalJournal {
  id: string;
  userId: string;
  type?: "INCIDENT" | "TEST" | "UPDATE" | string;
  body?: string;
  source?: "MANUAL" | "ALERT" | string;
  emergencyType?: string | null;
  severity?: "LOW" | "URGENT" | "HIGH" | "CRITICAL" | string | null;
  status?: string | null;
  resolutionReason?: "SAFE" | "FALSE_ALARM" | "TEST" | string | null;
  resolutionNotes?: string | null;
  location?: string | null;
  triggeredAt: string;
  duration?: string | null;
  createdAt?: string;
}

export interface DashboardMetrics {
  kpis: {
    totalUsers: { value: number; change: string };
    activeAlerts: { value: number; change: string };
    premiumUsers: { value: number; change: string };
    groupsActive: { value: number; change: string };
  };
  subscriptionSplit: {
    premium: number;
    free: number;
    monthlyRevenue: number;
    revenueGrowth: string;
  };
  recentAlerts: {
    id: string;
    userName: string;
    userInitials: string;
    color: string;
    category: string;
    severity: string;
    timeAgo: string;
    status: string;
  }[];
}

// Figma Specific Screen Data Types
export interface UserItem {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarColor: string;
  plan: 'Free' | 'Premium';
  status: 'Active' | 'Suspended' | 'Inactive';
  location: string;
  joined: string;
  alerts: number;
}

export interface RecentAlertItem {
  id: string;
  userName: string;
  userInitials: string;
  color: string;
  category: string;
  severity: 'Critical' | 'High' | 'Urgent' | 'Low';
  timeAgo: string;
  status: 'Active' | 'Resolved';
}

export interface EmergencyTypeItem {
  id: string;
  name: string;
  iconName: string;
  isActive?: boolean;
}

export interface GroupMember {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: 'Group Admin' | 'Member';
  status: 'SOS triggered' | 'Safe' | 'Last seen';
  timeAgo: string;
}

export interface LiveGroupItem {
  id: string;
  code: string;
  name: string;
  category: 'MEDICAL' | 'FIRE' | 'POLICE / SECURITY' | 'NATURAL DISASTER' | 'GENERAL';
  membersCount: number;
  timeAgo: string;
  status: 'SOS active' | 'Idle' | 'Monitoring';
  lat: number;
  lng: number;
  members: GroupMember[];
}

export interface SubscriptionItem {
  id: string;
  name: string;
  price: number;
  period: string;
  features: { text: string; included: boolean }[];
}

export interface TransactionItem {
  id: string;
  userName: string;
  plan: 'Premium' | 'Free';
  amount: string;
  date: string;
  status: 'Paid' | 'Failed' | 'Refunded';
}
