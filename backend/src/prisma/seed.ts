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
  AlertSource,
  NotificationType,
  InvitationStatus,
} from "@prisma/client";
import { hashSync } from "bcryptjs";
import { digitsOnly } from "../common/utils/phone";
import { LEGAL_PAGES, PLAN_CATALOG } from "../modules/profile/profile.constants";
import { FIGMA_EMERGENCY_TYPES } from "../modules/alerts/alert.constants";

const logger = new Logger("DatabaseSeed");

function hashSecret(value: string): string {
  return hashSync(value, 10);
}

async function ensureDashboardAdmin(prisma: PrismaClient): Promise<void> {
  const email = (process.env.DASHBOARD_ADMIN_EMAIL || "admin@safealert.app").trim().toLowerCase();

  await prisma.user.updateMany({
    where: {
      role: Role.SUPER_ADMIN,
      NOT: { email },
    },
    data: { role: Role.USER },
  });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== Role.SUPER_ADMIN) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: Role.SUPER_ADMIN },
      });
    }
    return;
  }

  const takenId = await prisma.user.findUnique({ where: { id: "usr-admin-001" } });
  await prisma.user.create({
    data: {
      id: takenId ? `usr-admin-${crypto.randomUUID().slice(0, 8)}` : "usr-admin-001",
      fullName: "Super Admin",
      email,
      phone: "+1 (555) 000-0001",
      phoneDigits: digitsOnly("+1 (555) 000-0001"),
      role: Role.SUPER_ADMIN,
      subscriptionTier: SubscriptionTier.PREMIUM,
      isVerified: true,
      isPhoneVerified: true,
      pinHash: hashSecret("9"),
      passwordHash: hashSecret("adminpassword"),
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    },
  });
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

async function ensureFigmaNotifications(prisma: PrismaClient): Promise<void> {
  const sarah = await prisma.user.findUnique({ where: { id: "usr-sarah-101" } });
  if (!sarah) {
    return;
  }

  const now = Date.now();
  const rows = [
    {
      id: "ntf-direct-01",
      type: NotificationType.DIRECT_ALERT,
      title: "Direct Alert",
      body: "Your emergency alert was sent to Family and Work Emergency.",
      refLabel: "Family",
      createdAt: new Date(now - 2 * 60 * 1000),
    },
    {
      id: "ntf-received-01",
      type: NotificationType.ALERT_RECEIVED,
      title: "Alert Received",
      body: "A contact in your circle triggered an emergency alert.",
      refLabel: "Live now",
      createdAt: new Date(now - 18 * 60 * 1000),
    },
    {
      id: "ntf-added-01",
      type: NotificationType.CONTACT_ADDED,
      title: "Someone added you",
      body: "James Johnson added you as an emergency contact.",
      refLabel: "James Johnson",
      createdAt: new Date(now - 3 * 60 * 60 * 1000),
    },
    {
      id: "ntf-sub-01",
      type: NotificationType.SUBSCRIPTION,
      title: "Subscription Alert",
      body: "Your subscription is expired. Renew to keep premium features.",
      refLabel: "Premium",
      createdAt: new Date(now - 26 * 60 * 60 * 1000),
    },
  ] as const;

  for (const row of rows) {
    await prisma.notification.upsert({
      where: { id: row.id },
      update: {
        type: row.type,
        title: row.title,
        body: row.body,
        refLabel: row.refLabel,
        createdAt: row.createdAt,
      },
      create: {
        id: row.id,
        userId: "usr-sarah-101",
        type: row.type,
        title: row.title,
        body: row.body,
        refLabel: row.refLabel,
        createdAt: row.createdAt,
      },
    });
  }
}

async function ensureFigmaInvitations(prisma: PrismaClient): Promise<void> {
  const priya = await prisma.user.findUnique({ where: { id: "usr-003" } });
  const family = await prisma.contactGroup.findUnique({ where: { id: "grp-family-01" } });
  if (!priya || !family) {
    return;
  }

  const existing = await prisma.groupInvitation.findUnique({ where: { id: "inv-family-priya" } });
  if (existing) {
    return;
  }

  await prisma.groupInvitation.create({
    data: {
      id: "inv-family-priya",
      groupId: family.id,
      inviterId: "usr-sarah-101",
      inviteeUserId: priya.id,
      inviteePhone: priya.phone || "",
      inviteePhoneDigits: priya.phoneDigits,
      inviteeName: priya.fullName,
      status: InvitationStatus.PENDING,
    },
  });
}

async function ensureFigmaEmergencyTypes(prisma: PrismaClient): Promise<void> {
  for (const type of FIGMA_EMERGENCY_TYPES) {
    await prisma.emergencyType.upsert({
      where: { id: type.id },
      update: {
        key: type.key,
        label: type.label,
        severity: type.severity,
        icon: type.icon,
        description: type.description,
        isActive: true,
        sortOrder: type.sortOrder,
      },
      create: {
        id: type.id,
        key: type.key,
        label: type.label,
        severity: type.severity,
        icon: type.icon,
        description: type.description,
        isActive: true,
        sortOrder: type.sortOrder,
      },
    });
  }

  await prisma.emergencyType.updateMany({
    where: { id: { in: ["et-breakdown", "et-suspicious"] } },
    data: { isActive: false },
  });
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
    const phoneDigits = digitsOnly(member.phone);
    await prisma.contactMember.upsert({
      where: { id: member.id },
      create: { ...member, phoneDigits },
      update: {
        groupId: member.groupId,
        contactId: member.contactId,
        name: member.name,
        phone: member.phone,
        phoneDigits,
        relationship: member.relationship,
        isJoinedCall: member.isJoinedCall,
      },
    });
  }

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
    await ensureDashboardAdmin(prisma);
    await ensureFigmaEmergencyTypes(prisma);
    await ensureFigmaContacts(prisma);
    await ensureFigmaJournals(prisma);
    await ensureFigmaNotifications(prisma);
    await ensureFigmaInvitations(prisma);
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
        pinHash: hashSecret("3"),
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
        pinHash: hashSecret("9"),
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
        role: Role.USER,
        subscriptionTier: SubscriptionTier.PREMIUM,
        isVerified: true,
        isPhoneVerified: true,
        pinHash: hashSecret("8"),
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
        pinHash: hashSecret("1"),
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
        pinHash: hashSecret("2"),
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
        pinHash: hashSecret("3"),
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
        pinHash: hashSecret("4"),
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
        pinHash: hashSecret("5"),
        createdAt: new Date("2026-08-01T11:00:00Z"),
      },
    ],
  });

  await ensureDashboardAdmin(prisma);
  await ensureFigmaEmergencyTypes(prisma);

  await ensureFigmaContacts(prisma);
  await ensureFigmaJournals(prisma);
  await ensureFigmaNotifications(prisma);
  await ensureFigmaInvitations(prisma);

  await prisma.alert.create({
    data: {
      id: "alt-active-991",
      userId: "usr-sarah-101",
      userName: "Sarah Johnson",
      userPhone: "+1 (555) 234-5678",
      emergencyTypeId: "et-assault",
      emergencyTypeLabel: "Assault",
      severity: Severity.CRITICAL,
      mode: AlertMode.EMERGENCY,
      source: AlertSource.MANUAL,
      status: AlertStatus.BROADCASTING,
      latitude: 40.712776,
      longitude: -74.005974,
      address: "123 Main St, New York, NY 10001",
      roomId: "safealert-alt-active-991",
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
