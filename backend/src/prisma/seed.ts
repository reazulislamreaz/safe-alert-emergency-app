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
  JournalEntryType,
  JournalSource,
} from "@prisma/client";
import { hashSync } from "bcryptjs";
import { digitsOnly } from "../common/utils/phone";
import { LEGAL_PAGES, PLAN_CATALOG } from "../modules/profile/profile.constants";

const logger = new Logger("DatabaseSeed");

function hashSecret(value: string): string {
  return hashSync(value, 10);
}

const FIGMA_CONTACTS = [
  {
    id: "ct-james-01",
    userId: "usr-sarah-101",
    name: "James Johnson",
    phone: "+1 (555) 111-2222",
    relationship: "Father",
  },
  {
    id: "ct-emma-01",
    userId: "usr-sarah-101",
    name: "Emma Smith",
    phone: "+1 (555) 222-3333",
    relationship: "Sister",
  },
  {
    id: "ct-david-01",
    userId: "usr-sarah-101",
    name: "David Lee",
    phone: "+1 (555) 555-6666",
    relationship: "Friend",
  },
  {
    id: "ct-rachel-01",
    userId: "usr-sarah-101",
    name: "Rachel Kim",
    phone: "+1 (555) 666-7777",
    relationship: "Colleague",
  },
  {
    id: "ct-tom-01",
    userId: "usr-sarah-101",
    name: "Tom Wilson",
    phone: "+1 (555) 777-8888",
    relationship: "Neighbor",
  },
] as const;

const FIGMA_GROUPS = [
  {
    id: "grp-family-01",
    userId: "usr-sarah-101",
    name: "Family",
    color: "#3A67D5",
    isDefaultSOS: true,
    memberCount: 3,
  },
  {
    id: "grp-work-02",
    userId: "usr-sarah-101",
    name: "Work Emergency",
    color: "#00AA1D",
    isDefaultSOS: true,
    memberCount: 2,
  },
] as const;

const FIGMA_MEMBERS = [
  {
    id: "mem-01",
    groupId: "grp-family-01",
    contactId: "ct-james-01",
    name: "James Johnson",
    phone: "+1 (555) 111-2222",
    relationship: "Father",
    isJoinedCall: true,
  },
  {
    id: "mem-02",
    groupId: "grp-family-01",
    contactId: "ct-emma-01",
    name: "Emma Smith",
    phone: "+1 (555) 222-3333",
    relationship: "Sister",
    isJoinedCall: true,
  },
  {
    id: "mem-03",
    groupId: "grp-family-01",
    contactId: "ct-tom-01",
    name: "Tom Wilson",
    phone: "+1 (555) 777-8888",
    relationship: "Neighbor",
    isJoinedCall: false,
  },
  {
    id: "mem-04",
    groupId: "grp-work-02",
    contactId: "ct-david-01",
    name: "David Lee",
    phone: "+1 (555) 555-6666",
    relationship: "Friend",
    isJoinedCall: false,
  },
  {
    id: "mem-05",
    groupId: "grp-work-02",
    contactId: "ct-rachel-01",
    name: "Rachel Kim",
    phone: "+1 (555) 666-7777",
    relationship: "Colleague",
    isJoinedCall: false,
  },
] as const;

const FIGMA_JOURNAL_AT = new Date("2026-07-30T16:00:00.000Z");
const FIGMA_JOURNALS = [
  {
    id: "jrn-incident-01",
    type: JournalEntryType.INCIDENT,
    body: "Was followed home from the subway. Got home safely",
  },
  {
    id: "jrn-test-01",
    type: JournalEntryType.TEST,
    body: "Was followed home from the subway. Got home safely",
  },
  {
    id: "jrn-update-01",
    type: JournalEntryType.UPDATE,
    body: "Was followed home from the subway. Got home safely",
  },
] as const;

async function ensureFigmaJournals(prisma: PrismaClient): Promise<void> {
  const sarah = await prisma.user.findUnique({ where: { id: "usr-sarah-101" } });
  if (!sarah) {
    return;
  }

  await prisma.journal.deleteMany({
    where: { id: { in: ["jrn-01", "jrn-02"] } },
  });

  for (const entry of FIGMA_JOURNALS) {
    await prisma.journal.upsert({
      where: { id: entry.id },
      update: {
        type: entry.type,
        body: entry.body,
        source: JournalSource.MANUAL,
        triggeredAt: FIGMA_JOURNAL_AT,
      },
      create: {
        id: entry.id,
        userId: "usr-sarah-101",
        type: entry.type,
        body: entry.body,
        source: JournalSource.MANUAL,
        triggeredAt: FIGMA_JOURNAL_AT,
      },
    });
  }
}

async function ensureFigmaContacts(prisma: PrismaClient): Promise<void> {
  const sarah = await prisma.user.findUnique({ where: { id: "usr-sarah-101" } });
  if (!sarah) {
    return;
  }

  await prisma.subscriptionPlan.upsert({
    where: { id: "plan-free" },
    create: {
      id: "plan-free",
      name: PLAN_CATALOG.FREE.name,
      priceMonthly: PLAN_CATALOG.FREE.price,
      priceYearly: 0,
      maxContacts: 5,
      maxGroups: 2,
      features: PLAN_CATALOG.FREE.features.filter((row) => row.included).map((row) => row.label),
      subscriberCount: 1340,
    },
    update: {
      name: PLAN_CATALOG.FREE.name,
      priceMonthly: PLAN_CATALOG.FREE.price,
      maxContacts: 5,
      maxGroups: 2,
      features: PLAN_CATALOG.FREE.features.filter((row) => row.included).map((row) => row.label),
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { id: "plan-pro" },
    create: {
      id: "plan-pro",
      name: PLAN_CATALOG.PREMIUM.name,
      priceMonthly: PLAN_CATALOG.PREMIUM.price,
      priceYearly: 60,
      maxContacts: 0,
      maxGroups: 0,
      features: PLAN_CATALOG.PREMIUM.features.map((row) => row.label),
      subscriberCount: 1294,
    },
    update: {
      name: PLAN_CATALOG.PREMIUM.name,
      priceMonthly: PLAN_CATALOG.PREMIUM.price,
      priceYearly: 60,
      maxContacts: 0,
      maxGroups: 0,
      features: PLAN_CATALOG.PREMIUM.features.map((row) => row.label),
    },
  });

  for (const page of LEGAL_PAGES) {
    await prisma.legalPage.upsert({
      where: { slug: page.slug },
      create: { slug: page.slug, title: page.title, body: page.body },
      update: { title: page.title, body: page.body },
    });
  }

  for (const group of FIGMA_GROUPS) {
    await prisma.contactGroup.upsert({
      where: { id: group.id },
      create: group,
      update: {
        name: group.name,
        color: group.color,
        isDefaultSOS: group.isDefaultSOS,
      },
    });
  }

  for (const contact of FIGMA_CONTACTS) {
    const phoneDigits = digitsOnly(contact.phone);
    await prisma.contact.deleteMany({
      where: {
        userId: contact.userId,
        phoneDigits,
        NOT: { id: contact.id },
      },
    });
    await prisma.contact.upsert({
      where: { id: contact.id },
      create: { ...contact, phoneDigits },
      update: {
        name: contact.name,
        phone: contact.phone,
        phoneDigits,
        relationship: contact.relationship,
      },
    });
  }

  for (const member of FIGMA_MEMBERS) {
    await prisma.contactMember.upsert({
      where: { id: member.id },
      create: member,
      update: {
        groupId: member.groupId,
        contactId: member.contactId,
        name: member.name,
        phone: member.phone,
        relationship: member.relationship,
        isJoinedCall: member.isJoinedCall,
      },
    });
  }

  await prisma.contactMember.deleteMany({
    where: {
      groupId: { in: FIGMA_GROUPS.map((group) => group.id) },
      id: { notIn: FIGMA_MEMBERS.map((member) => member.id) },
    },
  });

  await prisma.contactGroup.deleteMany({
    where: { userId: "usr-sarah-101", name: "Neighborhood Watch" },
  });

  for (const group of FIGMA_GROUPS) {
    const memberCount = await prisma.contactMember.count({ where: { groupId: group.id } });
    await prisma.contactGroup.update({
      where: { id: group.id },
      data: { memberCount },
    });
  }
}

export async function seedDatabase(prisma: PrismaClient): Promise<void> {
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    await ensureFigmaContacts(prisma);
    await ensureFigmaJournals(prisma);
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

  await ensureFigmaContacts(prisma);
  await ensureFigmaJournals(prisma);

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
            memberCount: 3,
            deliveryStatus: DeliveryStatus.DELIVERED,
          },
          {
            groupId: "grp-work-02",
            groupName: "Work Emergency",
            memberCount: 2,
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
