export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "USER" | "OPS_ADMIN" | "SUPER_ADMIN";
  subscriptionTier: "FREE" | "PREMIUM";
  isVerified: boolean;
  pin: string;
  avatar?: string;
  createdAt: string;
}

export function isOperatorRole(role: User['role']): boolean {
  return role === 'OPS_ADMIN' || role === 'SUPER_ADMIN';
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
  status: "TRIGGERED" | "BROADCASTING" | "RESOLVED" | "CANCELLED";
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
    text: string;
    timestamp: string;
    type: "SOS" | "QUICK_REPLY" | "USER";
  }[];
  triggeredAt: string;
  resolvedAt?: string;
  resolutionReason?: "SAFE" | "FALSE_ALARM" | "TEST";
  resolutionNotes?: string;
}

export interface EmergencyType {
  id: string;
  key: string;
  label: string;
  severity: "LOW" | "URGENT" | "HIGH" | "CRITICAL";
  icon: string;
  description: string;
  isActive: boolean;
}

export interface ContactGroup {
  id: string;
  userId: string;
  name: string;
  color: string;
  isDefaultSOS: boolean;
  memberCount: number;
  members?: {
    id: string;
    groupId: string;
    name: string;
    phone: string;
    relationship: string;
    isJoinedCall?: boolean;
  }[];
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
  emergencyType: string;
  severity: "LOW" | "URGENT" | "HIGH" | "CRITICAL" | string;
  status: string;
  resolutionReason: "SAFE" | "FALSE_ALARM" | "TEST" | string;
  resolutionNotes: string;
  location: string;
  triggeredAt: string;
  duration: string;
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
