import { Logger } from "@nestjs/common";
import {
  PrismaClient,
  Role,
  SubscriptionTier,
  Severity,
  AlertMode,
  AlertStatus,
  MessageType,
  DeliveryStatus,
  ParticipantStatus,
} from "@prisma/client";
import { hashSync } from "bcryptjs";
import { digitsOnly } from "../common/utils/phone";

const logger = new Logger("DatabaseSeed");

function hashSecret(value: string): string {
  return hashSync(value, 10);
}

export async function seedDatabase(prisma: PrismaClient): Promise<void> {
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    return;
  }

  logger.log("Empty database detected — seeding demo data");

  await prisma.user.createMany({
    data: [
      {
        id: "usr-sarah-101",
        fullName: "Sarah Johnson",
        email: "sarah.johnson@example.com",
        phone: "+1 (555) 234-5678",
        phoneDigits: digitsOnly("+1 (555) 234-5678"),
        role: Role.USER,
        subscriptionTier: SubscriptionTier.FREE,
        isVerified: true,
        isPhoneVerified: true,
        pinHash: hashSecret("1234"),
        passwordHash: hashSecret("password123"),
        dob: "1998-05-14",
        race: "White",
        location: "New York, NY",
        emergencyContactName: "James Johnson",
        emergencyContactPhone: "+1 (555) 987-6543",
        emergencyContactRelation: "Father",
        profilePhotos: [
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
        ],
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        createdAt: new Date("2026-07-15T10:00:00Z"),
      },
      {
        id: "usr-admin-001",
        fullName: "Super Admin",
        email: "admin@safealert.app",
        phone: "+1 (555) 000-0001",
        phoneDigits: digitsOnly("+1 (555) 000-0001"),
        role: Role.SUPER_ADMIN,
        subscriptionTier: SubscriptionTier.PREMIUM,
        isVerified: true,
        isPhoneVerified: true,
        pinHash: hashSecret("9999"),
        passwordHash: hashSecret("adminpassword"),
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        createdAt: new Date("2026-01-01T00:00:00Z"),
      },
      {
        id: "usr-ops-001",
        fullName: "Dispatch Officer Dave",
        email: "ops@safealert.app",
        phone: "+1 (555) 000-0002",
        phoneDigits: digitsOnly("+1 (555) 000-0002"),
        role: Role.OPS_ADMIN,
        subscriptionTier: SubscriptionTier.PREMIUM,
        isVerified: true,
        isPhoneVerified: true,
        pinHash: hashSecret("8888"),
        passwordHash: hashSecret("opspassword"),
        avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
        createdAt: new Date("2026-02-01T00:00:00Z"),
      },
      {
        id: "usr-002",
        fullName: "Sarah Mitchell",
        email: "s.mitchell@example.com",
        phone: "+1 (555) 345-6789",
        phoneDigits: digitsOnly("+1 (555) 345-6789"),
        role: Role.USER,
        subscriptionTier: SubscriptionTier.PREMIUM,
        isVerified: true,
        isPhoneVerified: true,
        pinHash: hashSecret("1111"),
        createdAt: new Date("2026-06-10T12:30:00Z"),
      },
      {
        id: "usr-003",
        fullName: "Priya Sharma",
        email: "priya.s@example.com",
        phone: "+1 (555) 456-7890",
        phoneDigits: digitsOnly("+1 (555) 456-7890"),
        role: Role.USER,
        subscriptionTier: SubscriptionTier.PREMIUM,
        isVerified: true,
        isPhoneVerified: true,
        pinHash: hashSecret("2222"),
        createdAt: new Date("2026-05-20T08:15:00Z"),
      },
      {
        id: "usr-004",
        fullName: "Aisha Johnson",
        email: "aisha.j@example.com",
        phone: "+1 (555) 567-8901",
        phoneDigits: digitsOnly("+1 (555) 567-8901"),
        role: Role.USER,
        subscriptionTier: SubscriptionTier.FREE,
        isVerified: true,
        isPhoneVerified: true,
        pinHash: hashSecret("3333"),
        createdAt: new Date("2026-04-12T14:45:00Z"),
      },
      {
        id: "usr-005",
        fullName: "Devon Brooks",
        email: "devon.b@example.com",
        phone: "+1 (555) 678-9012",
        phoneDigits: digitsOnly("+1 (555) 678-9012"),
        role: Role.USER,
        subscriptionTier: SubscriptionTier.FREE,
        isVerified: true,
        isPhoneVerified: true,
        pinHash: hashSecret("4444"),
        createdAt: new Date("2026-07-02T19:20:00Z"),
      },
      {
        id: "usr-006",
        fullName: "Nina Torres",
        email: "nina.t@example.com",
        phone: "+1 (555) 789-0123",
        phoneDigits: digitsOnly("+1 (555) 789-0123"),
        role: Role.USER,
        subscriptionTier: SubscriptionTier.FREE,
        isVerified: true,
        isPhoneVerified: true,
        pinHash: hashSecret("5555"),
        createdAt: new Date("2026-08-01T11:00:00Z"),
      },
    ],
  });

  await prisma.emergencyType.createMany({
    data: [
      {
        id: "et-assault",
        key: "ASSAULT",
        label: "Assault & Physical Danger",
        severity: Severity.CRITICAL,
        icon: "ShieldAlert",
        description: "Immediate violent threat or physical harassment",
        isActive: true,
      },
      {
        id: "et-medical",
        key: "MEDICAL",
        label: "Medical Emergency",
        severity: Severity.CRITICAL,
        icon: "HeartPulse",
        description: "Severe injury, unconsciousness, cardiac or allergic reaction",
        isActive: true,
      },
      {
        id: "et-accident",
        key: "ACCIDENT",
        label: "Car Accident / Crash",
        severity: Severity.HIGH,
        icon: "CarCrash",
        description: "Vehicular collision or roadside emergency",
        isActive: true,
      },
      {
        id: "et-breakdown",
        key: "BREAKDOWN",
        label: "Vehicle Breakdown",
        severity: Severity.URGENT,
        icon: "Wrench",
        description: "Stranded vehicle on dark or remote road",
        isActive: true,
      },
      {
        id: "et-suspicious",
        key: "SUSPICIOUS",
        label: "Suspicious Person / Stalking",
        severity: Severity.URGENT,
        icon: "Eye",
        description: "Being followed or observing dangerous prowler",
        isActive: true,
      },
      {
        id: "et-fire",
        key: "FIRE",
        label: "Fire & Natural Disaster",
        severity: Severity.CRITICAL,
        icon: "Flame",
        description: "Building fire, gas leak, or environmental hazard",
        isActive: true,
      },
    ],
  });

  await prisma.contactGroup.createMany({
    data: [
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
    ],
  });

  await prisma.contactMember.createMany({
    data: [
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
    ],
  });

  await prisma.subscriptionPlan.createMany({
    data: [
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
    ],
  });

  await prisma.journal.createMany({
    data: [
      {
        id: "jrn-01",
        userId: "usr-sarah-101",
        emergencyType: "Medical Emergency",
        severity: "CRITICAL",
        status: "RESOLVED",
        resolutionReason: "SAFE",
        resolutionNotes: "Ambulance arrived promptly. Resolved safely at clinic.",
        location: "Grand Central Terminal, NY",
        triggeredAt: new Date("2026-08-10T14:22:00Z"),
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
        triggeredAt: new Date("2026-07-28T22:45:00Z"),
        duration: "42 mins",
      },
    ],
  });

  await prisma.alert.create({
    data: {
      id: "alt-active-991",
      userId: "usr-sarah-101",
      userName: "Sarah Johnson",
      userPhone: "+1 (555) 234-5678",
      emergencyTypeId: "et-assault",
      emergencyTypeLabel: "Assault & Physical Danger",
      severity: Severity.CRITICAL,
      mode: AlertMode.EMERGENCY,
      status: AlertStatus.BROADCASTING,
      latitude: 40.712776,
      longitude: -74.005974,
      address: "123 Main St, New York, NY 10001",
      participants: [
        {
          id: "part-01",
          name: "You (Sarah)",
          initials: "SJ",
          status: ParticipantStatus.CONNECTED,
          color: "#3A67D5",
          isSender: true,
        },
        {
          id: "part-02",
          name: "James",
          initials: "JJ",
          status: ParticipantStatus.CONNECTED,
          color: "#3B82F6",
        },
        {
          id: "part-03",
          name: "Emma",
          initials: "ES",
          status: ParticipantStatus.CONNECTED,
          color: "#8B5CF6",
        },
        {
          id: "part-04",
          name: "Mike",
          initials: "MJ",
          status: ParticipantStatus.CALLING,
          color: "#64748B",
        },
      ],
      triggeredAt: new Date(Date.now() - 180000),
      telemetryHistory: {
        create: [
          {
            latitude: 40.712776,
            longitude: -74.005974,
            accuracy: 3.5,
            speed: 1.2,
            heading: 90,
            batteryLevel: 84,
            timestamp: new Date(Date.now() - 120000),
          },
          {
            latitude: 40.71285,
            longitude: -74.00602,
            accuracy: 2.8,
            speed: 1.5,
            heading: 95,
            batteryLevel: 83,
            timestamp: new Date(Date.now() - 60000),
          },
        ],
      },
      notifiedGroups: {
        create: [
          {
            groupId: "grp-family-01",
            groupName: "Family",
            memberCount: 4,
            deliveryStatus: DeliveryStatus.DELIVERED,
          },
          {
            groupId: "grp-work-02",
            groupName: "Work Emergency",
            memberCount: 3,
            deliveryStatus: DeliveryStatus.DELIVERED,
          },
        ],
      },
      liveMessages: {
        create: [
          {
            id: "msg-1",
            sender: "SafeAlert Dispatch",
            text: "SOS Triggered. Audio and GPS tracking live.",
            timestamp: "5:13 PM",
            type: MessageType.SOS,
          },
          {
            id: "msg-2",
            sender: "James Johnson",
            text: "I see your location, heading towards you now!",
            timestamp: "5:14 PM",
            type: MessageType.USER,
          },
        ],
      },
    },
  });

  logger.log("Demo seed complete");
}
