import { v4 as uuidv4 } from "uuid";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "USER" | "OPS_ADMIN" | "SUPER_ADMIN";
  subscriptionTier: "FREE" | "PREMIUM";
  isVerified: boolean;
  pin: string; // 4-digit security PIN for de-escalation
  avatar?: string;
  createdAt: string;
}

export interface ContactGroup {
  id: string;
  userId: string;
  name: string; // e.g. "Family", "Work Emergency", "Neighborhood"
  color: string;
  isDefaultSOS: boolean;
  memberCount: number;
}

export interface ContactMember {
  id: string;
  groupId: string;
  name: string;
  phone: string;
  relationship: string;
  isJoinedCall?: boolean;
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

class Database {
  users: User[] = [
    {
      id: "usr-sarah-101",
      fullName: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      phone: "+1 (555) 234-5678",
      role: "USER",
      subscriptionTier: "FREE",
      isVerified: true,
      pin: "1234",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      createdAt: "2026-07-15T10:00:00Z",
    },
    {
      id: "usr-admin-001",
      fullName: "Admin User",
      email: "admin@safealert.app",
      phone: "+1 (555) 000-0001",
      role: "SUPER_ADMIN",
      subscriptionTier: "PREMIUM",
      isVerified: true,
      pin: "9999",
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "usr-002",
      fullName: "Sarah Mitchell",
      email: "s.mitchell@example.com",
      phone: "+1 (555) 345-6789",
      role: "USER",
      subscriptionTier: "PREMIUM",
      isVerified: true,
      pin: "1111",
      createdAt: "2026-06-10T12:30:00Z",
    },
    {
      id: "usr-003",
      fullName: "Priya Sharma",
      email: "priya.s@example.com",
      phone: "+1 (555) 456-7890",
      role: "USER",
      subscriptionTier: "PREMIUM",
      isVerified: true,
      pin: "2222",
      createdAt: "2026-05-20T08:15:00Z",
    },
    {
      id: "usr-004",
      fullName: "Aisha Johnson",
      email: "aisha.j@example.com",
      phone: "+1 (555) 567-8901",
      role: "USER",
      subscriptionTier: "FREE",
      isVerified: true,
      pin: "3333",
      createdAt: "2026-04-12T14:45:00Z",
    },
    {
      id: "usr-005",
      fullName: "Devon Brooks",
      email: "devon.b@example.com",
      phone: "+1 (555) 678-9012",
      role: "USER",
      subscriptionTier: "FREE",
      isVerified: true,
      pin: "4444",
      createdAt: "2026-07-02T19:20:00Z",
    },
    {
      id: "usr-006",
      fullName: "Nina Torres",
      email: "nina.t@example.com",
      phone: "+1 (555) 789-0123",
      role: "USER",
      subscriptionTier: "FREE",
      isVerified: true,
      pin: "5555",
      createdAt: "2026-08-01T11:00:00Z",
    },
  ];

  emergencyTypes: EmergencyType[] = [
    {
      id: "et-assault",
      key: "ASSAULT",
      label: "Assault & Physical Danger",
      severity: "CRITICAL",
      icon: "ShieldAlert",
      description: "Immediate violent threat or physical harassment",
      isActive: true,
    },
    {
      id: "et-medical",
      key: "MEDICAL",
      label: "Medical Emergency",
      severity: "CRITICAL",
      icon: "HeartPulse",
      description: "Severe injury, unconsciousness, cardiac or allergic reaction",
      isActive: true,
    },
    {
      id: "et-accident",
      key: "ACCIDENT",
      label: "Car Accident / Crash",
      severity: "HIGH",
      icon: "CarCrash",
      description: "Vehicular collision or roadside emergency",
      isActive: true,
    },
    {
      id: "et-breakdown",
      key: "BREAKDOWN",
      label: "Vehicle Breakdown",
      severity: "URGENT",
      icon: "Wrench",
      description: "Stranded vehicle on dark or remote road",
      isActive: true,
    },
    {
      id: "et-suspicious",
      key: "SUSPICIOUS",
      label: "Suspicious Person / Stalking",
      severity: "URGENT",
      icon: "Eye",
      description: "Being followed or observing dangerous prowler",
      isActive: true,
    },
    {
      id: "et-fire",
      key: "FIRE",
      label: "Fire & Natural Disaster",
      severity: "CRITICAL",
      icon: "Flame",
      description: "Building fire, gas leak, or environmental hazard",
      isActive: true,
    },
  ];

  contactGroups: ContactGroup[] = [
    {
      id: "grp-family-01",
      userId: "usr-sarah-101",
      name: "Family",
      color: "#3A67D5",
      isDefaultSOS: true,
      memberCount: 4,
    },
    {
      id: "grp-work-02",
      userId: "usr-sarah-101",
      name: "Work Emergency",
      color: "#00AA1D",
      isDefaultSOS: true,
      memberCount: 3,
    },
    {
      id: "grp-neighbors-03",
      userId: "usr-sarah-101",
      name: "Neighborhood Watch",
      color: "#E1AA00",
      isDefaultSOS: false,
      memberCount: 5,
    },
  ];

  contactMembers: ContactMember[] = [
    {
      id: "mem-01",
      groupId: "grp-family-01",
      name: "James Johnson",
      phone: "+1 (555) 111-2222",
      relationship: "Father",
      isJoinedCall: true,
    },
    {
      id: "mem-02",
      groupId: "grp-family-01",
      name: "Emma Johnson",
      phone: "+1 (555) 222-3333",
      relationship: "Sister",
      isJoinedCall: true,
    },
    {
      id: "mem-03",
      groupId: "grp-family-01",
      name: "Mike Johnson",
      phone: "+1 (555) 333-4444",
      relationship: "Brother",
      isJoinedCall: false,
    },
    {
      id: "mem-04",
      groupId: "grp-family-01",
      name: "Eleanor Johnson",
      phone: "+1 (555) 444-5555",
      relationship: "Mother",
      isJoinedCall: false,
    },
    {
      id: "mem-05",
      groupId: "grp-work-02",
      name: "David Vance",
      phone: "+1 (555) 555-6666",
      relationship: "Manager",
      isJoinedCall: false,
    },
    {
      id: "mem-06",
      groupId: "grp-work-02",
      name: "Chloe Bennett",
      phone: "+1 (555) 666-7777",
      relationship: "Coworker",
      isJoinedCall: false,
    },
  ];

  activeAlerts: ActiveAlert[] = [
    {
      id: "alt-active-991",
      userId: "usr-sarah-101",
      userName: "Sarah Johnson",
      userPhone: "+1 (555) 234-5678",
      emergencyTypeId: "et-assault",
      emergencyType: "Assault & Physical Danger",
      severity: "CRITICAL",
      mode: "EMERGENCY",
      status: "BROADCASTING",
      location: {
        latitude: 40.712776,
        longitude: -74.005974,
        address: "123 Main St, New York, NY 10001",
      },
      telemetryHistory: [
        {
          latitude: 40.712776,
          longitude: -74.005974,
          accuracy: 3.5,
          speed: 1.2,
          heading: 90,
          batteryLevel: 84,
          timestamp: new Date(Date.now() - 120000).toISOString(),
        },
        {
          latitude: 40.71285,
          longitude: -74.00602,
          accuracy: 2.8,
          speed: 1.5,
          heading: 95,
          batteryLevel: 83,
          timestamp: new Date(Date.now() - 60000).toISOString(),
        },
      ],
      notifiedGroups: [
        {
          groupId: "grp-family-01",
          groupName: "Family",
          memberCount: 4,
          deliveryStatus: "DELIVERED",
        },
        {
          groupId: "grp-work-02",
          groupName: "Work Emergency",
          memberCount: 3,
          deliveryStatus: "DELIVERED",
        },
      ],
      activeCallParticipants: [
        {
          id: "part-01",
          name: "You (Sarah)",
          initials: "SJ",
          status: "CONNECTED",
          color: "#3A67D5",
          isSender: true,
        },
        {
          id: "part-02",
          name: "James",
          initials: "JJ",
          status: "CONNECTED",
          color: "#3B82F6",
        },
        {
          id: "part-03",
          name: "Emma",
          initials: "ES",
          status: "CONNECTED",
          color: "#8B5CF6",
        },
        {
          id: "part-04",
          name: "Mike",
          initials: "MJ",
          status: "CALLING",
          color: "#64748B",
        },
      ],
      liveMessages: [
        {
          id: "msg-1",
          sender: "SafeAlert Dispatch",
          text: "SOS Triggered. Audio and GPS tracking live.",
          timestamp: "5:13 PM",
          type: "SOS",
        },
        {
          id: "msg-2",
          sender: "James Johnson",
          text: "I see your location, heading towards you now!",
          timestamp: "5:14 PM",
          type: "USER",
        },
      ],
      triggeredAt: new Date(Date.now() - 180000).toISOString(),
    },
  ];

  historicalJournals = [
    {
      id: "jrn-01",
      userId: "usr-sarah-101",
      emergencyType: "Medical Emergency",
      severity: "CRITICAL",
      status: "RESOLVED",
      resolutionReason: "SAFE",
      resolutionNotes: "Ambulance arrived promptly. Resolved safely at clinic.",
      location: "Grand Central Terminal, NY",
      triggeredAt: "2026-08-10T14:22:00Z",
      duration: "18 mins",
    },
    {
      id: "jrn-02",
      userId: "usr-sarah-101",
      emergencyType: "Vehicle Breakdown",
      severity: "URGENT",
      status: "RESOLVED",
      resolutionReason: "SAFE",
      resolutionNotes: "Towing truck helped change the flat tire.",
      location: "FDR Drive & 34th St, NY",
      triggeredAt: "2026-07-28T22:45:00Z",
      duration: "42 mins",
    },
  ];

  subscriptionPlans: SubscriptionPlan[] = [
    {
      id: "plan-free",
      name: "Free Basic",
      priceMonthly: 0,
      priceYearly: 0,
      maxContacts: 5,
      maxGroups: 1,
      features: [
        "Instant SOS Trigger",
        "Live GPS location broadcast",
        "SMS/Push alerts to 1 group",
        "Community emergency updates",
      ],
      subscriberCount: 1340,
    },
    {
      id: "plan-pro",
      name: "SafeAlert Pro",
      priceMonthly: 7.99,
      priceYearly: 79.99,
      maxContacts: 25,
      maxGroups: 5,
      features: [
        "Everything in Free",
        "Multi-party WebRTC Live Video / Audio",
        "Unlimited Emergency Groups",
        "Silent SOS & Fake Lock Screen Mode",
        "30-day Incident Cloud Recordings",
        "Priority 911/PSAP Auto-Dispatch",
      ],
      subscriberCount: 1294,
    },
  ];
}

export const db = new Database();
