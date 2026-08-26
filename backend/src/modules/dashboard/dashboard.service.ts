import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AlertStatus, Prisma, Severity, SubscriptionPlan, SubscriptionTier } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { LEGAL_PAGES, PLAN_CATALOG } from "../profile/profile.constants";
import { isStoredImageUrl } from "../uploads/uploads.constants";
import { CreateEmergencyTypeDto, UpdateEmergencyTypeDto } from "./dto/emergency-type.dto";
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from "./dto/subscription.dto";
import { UpdateLegalPageDto } from "./dto/legal.dto";

const ADMIN_AVATAR_COLOR = "#2563EB";
const LEGAL_SLUGS = ["about", "privacy", "terms"] as const;

type LiveGroupCategory = "MEDICAL" | "FIRE" | "POLICE / SECURITY" | "NATURAL DISASTER" | "GENERAL";
type LiveGroupStatus = "SOS active" | "Idle" | "Monitoring";
type MemberStatus = "SOS triggered" | "Safe" | "Last seen";

function initialsFromName(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function timeAgo(date: Date): string {
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${Math.round(hours / 24)}d ago`;
}

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function formatJoined(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function percentChange(current: number, previous: number, suffix: string): string {
  if (previous <= 0) {
    if (current <= 0) {
      return `0% ${suffix}`;
    }
    return `+100% ${suffix}`;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}% ${suffix}`;
}

function slugifyKey(value: string): string {
  const slug = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return slug || `TYPE_${Date.now()}`;
}

function resolveIcon(icon?: string): string | undefined {
  const trimmed = icon?.trim();
  if (!trimmed) {
    return undefined;
  }
  if (trimmed.includes("/") || trimmed.startsWith("http")) {
    if (!isStoredImageUrl(trimmed)) {
      throw new BadRequestException("Upload the icon with POST /api/uploads/images.");
    }
  }
  return trimmed;
}

function slugifyId(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `plan-${Date.now().toString(36)}`;
}

function groupCode(id: string): string {
  const compact = id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase();
  return `GRP-${compact || "0000"}`;
}

function categoryFromType(label: string | null | undefined): LiveGroupCategory {
  const value = (label ?? "").toLowerCase();
  if (value.includes("fire")) return "FIRE";
  if (value.includes("medical") || value.includes("mental") || value.includes("health") || value.includes("child")) {
    return "MEDICAL";
  }
  if (
    value.includes("assault") ||
    value.includes("theft") ||
    value.includes("stalk") ||
    value.includes("police") ||
    value.includes("unsafe") ||
    value.includes("security")
  ) {
    return "POLICE / SECURITY";
  }
  if (value.includes("disaster") || value.includes("flood") || value.includes("natural")) {
    return "NATURAL DISASTER";
  }
  return "GENERAL";
}

function statusFromAlert(status?: AlertStatus | null): LiveGroupStatus {
  if (status === AlertStatus.BROADCASTING) return "SOS active";
  if (status === AlertStatus.TRIGGERED) return "Monitoring";
  return "Idle";
}

function mapPlanFeatures(plan: SubscriptionPlan): { text: string; included: boolean }[] {
  const catalog =
    plan.id === PLAN_CATALOG.FREE.id
      ? PLAN_CATALOG.FREE
      : plan.id === PLAN_CATALOG.PREMIUM.id
        ? PLAN_CATALOG.PREMIUM
        : null;

  if (!catalog) {
    return plan.features.map((text) => ({ text, included: true }));
  }

  const stored = new Set(plan.features);
  const catalogIncluded = catalog.features.filter((row) => row.included).map((row) => row.label);
  const matchesCatalog =
    stored.size === catalogIncluded.length && catalogIncluded.every((label) => stored.has(label));

  if (matchesCatalog || plan.features.length === 0) {
    return catalog.features.map((row) => ({ text: row.label, included: row.included }));
  }

  const excluded = catalog.features
    .filter((row) => !row.included && !stored.has(row.label))
    .map((row) => ({ text: row.label, included: false }));

  return [...plan.features.map((text) => ({ text, included: true })), ...excluded];
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverviewMetrics() {
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const startOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const [
      totalUsers,
      usersThisMonth,
      activeAlerts,
      alertsToday,
      premiumUsers,
      premiumThisMonth,
      freeUsers,
      groupsActive,
      premiumPlan,
      recent,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: startOfThisMonth } } }),
      this.prisma.alert.count({ where: { status: AlertStatus.BROADCASTING } }),
      this.prisma.alert.count({ where: { triggeredAt: { gte: startOfToday } } }),
      this.prisma.user.count({ where: { subscriptionTier: SubscriptionTier.PREMIUM } }),
      this.prisma.user.count({
        where: {
          subscriptionTier: SubscriptionTier.PREMIUM,
          subscriptionStartedAt: { gte: startOfThisMonth },
        },
      }),
      this.prisma.user.count({ where: { subscriptionTier: SubscriptionTier.FREE } }),
      this.prisma.contactGroup.count(),
      this.prisma.subscriptionPlan.findUnique({ where: { id: PLAN_CATALOG.PREMIUM.id } }),
      this.prisma.alert.findMany({
        orderBy: { triggeredAt: "desc" },
        take: 5,
      }),
    ]);

    const priceMonthly = premiumPlan?.priceMonthly ?? PLAN_CATALOG.PREMIUM.price;
    const monthlyRevenue = Math.round(premiumUsers * priceMonthly * 100) / 100;
    const usersAtMonthStart = Math.max(0, totalUsers - usersThisMonth);
    const premiumAtMonthStart = Math.max(0, premiumUsers - premiumThisMonth);
    const lastMonthRevenue = Math.round(premiumAtMonthStart * priceMonthly * 100) / 100;

    return {
      kpis: {
        totalUsers: {
          value: totalUsers,
          change: percentChange(totalUsers, usersAtMonthStart, "this month"),
        },
        activeAlerts: {
          value: activeAlerts,
          change: `+${alertsToday} today this month`,
        },
        premiumUsers: {
          value: premiumUsers,
          change: percentChange(premiumUsers, premiumAtMonthStart, "this month"),
        },
        groupsActive: {
          value: groupsActive,
          change: "0% this month",
        },
      },
      subscriptionSplit: {
        premium: premiumUsers,
        free: freeUsers,
        monthlyRevenue,
        revenueGrowth: percentChange(monthlyRevenue, lastMonthRevenue, "from last month"),
      },
      recentAlerts: recent.map((alert) => ({
        id: alert.id,
        userName: alert.userName,
        userInitials: initialsFromName(alert.userName),
        color: ADMIN_AVATAR_COLOR,
        category: alert.emergencyTypeLabel,
        severity: titleCase(alert.severity),
        timeAgo: timeAgo(alert.triggeredAt),
        status: alert.status === AlertStatus.BROADCASTING ? "Active" : "Resolved",
      })),
    };
  }

  async getUsers(query?: string) {
    const q = query?.trim();
    const where: Prisma.UserWhereInput = q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { location: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};

    const [users, total, alertCounts] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count(),
      this.prisma.alert.groupBy({
        by: ["userId"],
        _count: { _all: true },
      }),
    ]);

    const alertsByUser = new Map(alertCounts.map((row) => [row.userId, row._count._all]));

    return {
      total,
      users: users.map((user) => ({
        id: user.id,
        name: user.fullName,
        email: user.email,
        initials: initialsFromName(user.fullName),
        avatarColor: ADMIN_AVATAR_COLOR,
        plan: user.subscriptionTier === SubscriptionTier.PREMIUM ? "Premium" : "Free",
        status: user.isVerified ? "Active" : "Inactive",
        location: user.location?.trim() || "—",
        joined: formatJoined(user.createdAt),
        alerts: alertsByUser.get(user.id) ?? 0,
      })),
    };
  }

  async toggleUserVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return null;
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: !user.isVerified },
    });
    const alerts = await this.prisma.alert.count({ where: { userId } });
    return {
      id: updated.id,
      name: updated.fullName,
      email: updated.email,
      initials: initialsFromName(updated.fullName),
      avatarColor: ADMIN_AVATAR_COLOR,
      plan: updated.subscriptionTier === SubscriptionTier.PREMIUM ? "Premium" : "Free",
      status: updated.isVerified ? "Active" : "Inactive",
      location: updated.location?.trim() || "—",
      joined: formatJoined(updated.createdAt),
      alerts,
    };
  }

  async getEmergencyTypes(options?: { query?: string; activeOnly?: boolean }) {
    const query = options?.query?.trim();
    return this.prisma.emergencyType.findMany({
      where: {
        ...(options?.activeOnly ? { isActive: true } : {}),
        ...(query
          ? {
              OR: [
                { label: { contains: query, mode: "insensitive" } },
                { key: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    });
  }

  async createEmergencyType(dto: CreateEmergencyTypeDto) {
    const label = dto.label.trim();
    let key = dto.key?.trim() ? slugifyKey(dto.key) : slugifyKey(label);
    const existing = await this.prisma.emergencyType.findUnique({ where: { key } });
    if (existing) {
      if (dto.key?.trim()) {
        throw new ConflictException("An emergency type with this key already exists.");
      }
      key = `${key}_${Date.now().toString(36).toUpperCase()}`;
    }

    const last = await this.prisma.emergencyType.aggregate({ _max: { sortOrder: true } });
    return this.prisma.emergencyType.create({
      data: {
        id: `et-${Date.now()}`,
        key,
        label,
        severity: dto.severity ?? Severity.URGENT,
        icon: resolveIcon(dto.icon) || "ShieldAlert",
        description: dto.description?.trim() || label,
        isActive: dto.isActive ?? true,
        sortOrder: (last._max.sortOrder ?? 0) + 1,
      },
    });
  }

  async updateEmergencyType(id: string, dto: UpdateEmergencyTypeDto) {
    const type = await this.prisma.emergencyType.findUnique({ where: { id } });
    if (!type) {
      return null;
    }
    const nextIcon = resolveIcon(dto.icon);
    return this.prisma.emergencyType.update({
      where: { id },
      data: {
        ...(dto.label?.trim() ? { label: dto.label.trim() } : {}),
        ...(nextIcon ? { icon: nextIcon } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
        ...(dto.severity ? { severity: dto.severity } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async deleteEmergencyType(id: string) {
    const type = await this.prisma.emergencyType.findUnique({
      where: { id },
      include: { _count: { select: { alerts: true } } },
    });
    if (!type) {
      return null;
    }
    if (type._count.alerts > 0) {
      throw new BadRequestException("Cannot delete an emergency type that has been used in alerts.");
    }
    await this.prisma.emergencyType.delete({ where: { id } });
    return { id, deleted: true };
  }

  async toggleEmergencyType(id: string) {
    const type = await this.prisma.emergencyType.findUnique({ where: { id } });
    if (!type) {
      return null;
    }
    return this.prisma.emergencyType.update({
      where: { id },
      data: { isActive: !type.isActive },
    });
  }

  async getSubscriptions() {
    const [plans, premiumCount, freeCount, billedUsers] = await Promise.all([
      this.prisma.subscriptionPlan.findMany({ orderBy: { priceMonthly: "asc" } }),
      this.prisma.user.count({ where: { subscriptionTier: SubscriptionTier.PREMIUM } }),
      this.prisma.user.count({ where: { subscriptionTier: SubscriptionTier.FREE } }),
      this.prisma.user.findMany({
        where: {
          OR: [{ subscriptionStartedAt: { not: null } }, { subscriptionTier: SubscriptionTier.PREMIUM }],
        },
        orderBy: [{ subscriptionStartedAt: "desc" }, { createdAt: "desc" }],
        take: 50,
      }),
    ]);

    const premiumPlan = plans.find((plan) => plan.id === PLAN_CATALOG.PREMIUM.id);
    const premiumPrice = premiumPlan?.priceMonthly ?? PLAN_CATALOG.PREMIUM.price;

    return {
      plans: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        price: plan.priceMonthly,
        period: plan.priceMonthly <= 0 ? "forever" : "month",
        features: mapPlanFeatures(plan),
        subscriberCount:
          plan.id === PLAN_CATALOG.PREMIUM.id
            ? premiumCount
            : plan.id === PLAN_CATALOG.FREE.id
              ? freeCount
              : plan.subscriberCount,
      })),
      transactions: billedUsers.map((user) => {
        const isPremium = user.subscriptionTier === SubscriptionTier.PREMIUM && !user.subscriptionCancelledAt;
        const amount = isPremium || user.subscriptionStartedAt ? premiumPrice : 0;
        const status = user.subscriptionCancelledAt ? "Refunded" : "Paid";
        const date = user.subscriptionStartedAt ?? user.createdAt;
        return {
          id: `tx-${user.id}`,
          userName: user.fullName,
          plan: user.subscriptionTier === SubscriptionTier.PREMIUM ? "Premium" : "Free",
          amount: `$${amount.toFixed(2)}`,
          date: formatJoined(date),
          status,
        };
      }),
    };
  }

  async createSubscriptionPlan(dto: CreateSubscriptionPlanDto) {
    const name = dto.name.trim();
    const priceMonthly = dto.priceMonthly ?? dto.price ?? 0;
    const features = (dto.features ?? []).map((item) => item.trim()).filter(Boolean);
    const id = `plan-${slugifyId(name)}`;

    const existing = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (existing) {
      throw new ConflictException("A subscription plan with this name already exists.");
    }

    const created = await this.prisma.subscriptionPlan.create({
      data: {
        id,
        name,
        priceMonthly,
        priceYearly: Math.round(priceMonthly * 12 * 100) / 100,
        maxContacts: dto.maxContacts ?? 5,
        maxGroups: dto.maxGroups ?? 2,
        features,
        subscriberCount: 0,
      },
    });

    return this.toAdminPlan(created, 0);
  }

  async updateSubscriptionPlan(id: string, dto: UpdateSubscriptionPlanDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) {
      return null;
    }

    const priceMonthly = dto.priceMonthly ?? dto.price;
    const features = dto.features?.map((item) => item.trim()).filter(Boolean);

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(dto.name?.trim() ? { name: dto.name.trim() } : {}),
        ...(priceMonthly !== undefined
          ? { priceMonthly, priceYearly: Math.round(priceMonthly * 12 * 100) / 100 }
          : {}),
        ...(features ? { features } : {}),
        ...(dto.maxContacts !== undefined ? { maxContacts: dto.maxContacts } : {}),
        ...(dto.maxGroups !== undefined ? { maxGroups: dto.maxGroups } : {}),
      },
    });

    const subscriberCount = await this.subscriberCountFor(updated);
    return this.toAdminPlan(updated, subscriberCount);
  }

  async deleteSubscriptionPlan(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) {
      return null;
    }
    await this.prisma.subscriptionPlan.delete({ where: { id } });
    return { id, deleted: true };
  }

  async getLiveGroups() {
    const [groups, notifiedRows, activeAlerts] = await Promise.all([
      this.prisma.contactGroup.findMany({
        include: {
          user: { select: { id: true, fullName: true } },
          members: true,
        },
        orderBy: { name: "asc" },
      }),
      this.prisma.alertNotifiedGroup.findMany({
        include: { alert: true },
        orderBy: { alert: { triggeredAt: "desc" } },
      }),
      this.prisma.alert.findMany({
        where: { status: { in: [AlertStatus.BROADCASTING, AlertStatus.TRIGGERED] } },
        orderBy: { triggeredAt: "desc" },
      }),
    ]);

    const latestByGroupId = new Map<string, (typeof notifiedRows)[number]["alert"]>();
    const latestActiveByGroupId = new Map<string, (typeof notifiedRows)[number]["alert"]>();
    for (const row of notifiedRows) {
      if (!latestByGroupId.has(row.groupId)) {
        latestByGroupId.set(row.groupId, row.alert);
      }
      if (
        !latestActiveByGroupId.has(row.groupId) &&
        (row.alert.status === AlertStatus.BROADCASTING || row.alert.status === AlertStatus.TRIGGERED)
      ) {
        latestActiveByGroupId.set(row.groupId, row.alert);
      }
    }

    const latestByOwner = new Map<string, (typeof activeAlerts)[number]>();
    for (const alert of activeAlerts) {
      if (!latestByOwner.has(alert.userId)) {
        latestByOwner.set(alert.userId, alert);
      }
    }

    const mapped = groups.map((group) => {
      const alert =
        latestActiveByGroupId.get(group.id) ??
        (group.isDefaultSOS ? latestByOwner.get(group.userId) : undefined) ??
        latestByGroupId.get(group.id);
      const status = statusFromAlert(alert?.status);
      const ownerSos = Boolean(
        alert && alert.userId === group.userId && alert.status === AlertStatus.BROADCASTING,
      );

      const ownerMember = {
        id: `owner-${group.userId}`,
        name: group.user.fullName,
        initials: initialsFromName(group.user.fullName),
        color: ADMIN_AVATAR_COLOR,
        role: "Group Admin" as const,
        status: (ownerSos ? "SOS triggered" : "Safe") as MemberStatus,
        timeAgo: alert ? timeAgo(alert.triggeredAt) : "",
      };

      const members = [
        ownerMember,
        ...group.members.map((member) => ({
          id: member.id,
          name: member.name,
          initials: initialsFromName(member.name),
          color: ADMIN_AVATAR_COLOR,
          role: "Member" as const,
          status: "Safe" as MemberStatus,
          timeAgo: alert ? timeAgo(alert.triggeredAt) : "",
        })),
      ];

      return {
        id: group.id,
        code: groupCode(group.id),
        name: group.name,
        category: categoryFromType(alert?.emergencyTypeLabel),
        membersCount: members.length,
        timeAgo: alert ? timeAgo(alert.triggeredAt) : "",
        status,
        lat: alert?.latitude ?? 0,
        lng: alert?.longitude ?? 0,
        members,
      };
    });

    const counts = {
      all: mapped.length,
      sos: mapped.filter((group) => group.status === "SOS active").length,
      fire: mapped.filter((group) => group.category === "FIRE").length,
      medical: mapped.filter((group) => group.category === "MEDICAL").length,
      police: mapped.filter((group) => group.category === "POLICE / SECURITY").length,
      natural: mapped.filter((group) => group.category === "NATURAL DISASTER").length,
      idle: mapped.filter((group) => group.status === "Idle").length,
    };

    return { groups: mapped, counts };
  }

  async updateLegalPage(slug: string, dto: UpdateLegalPageDto) {
    const normalized = slug.trim().toLowerCase();
    if (!LEGAL_SLUGS.includes(normalized as (typeof LEGAL_SLUGS)[number])) {
      throw new NotFoundException("Page not found");
    }

    const fallback = LEGAL_PAGES.find((page) => page.slug === normalized);
    const title = dto.title?.trim() || fallback?.title || titleCase(normalized);

    return this.prisma.legalPage.upsert({
      where: { slug: normalized },
      create: {
        slug: normalized,
        title,
        body: dto.body,
      },
      update: {
        body: dto.body,
        ...(dto.title?.trim() ? { title: dto.title.trim() } : {}),
      },
    });
  }

  async getJournals() {
    const journals = await this.prisma.journal.findMany({
      orderBy: { triggeredAt: "desc" },
    });
    return journals.map((journal) => ({
      ...journal,
      triggeredAt: journal.triggeredAt.toISOString(),
      createdAt: journal.createdAt.toISOString(),
    }));
  }

  private toAdminPlan(plan: SubscriptionPlan, subscriberCount: number) {
    return {
      id: plan.id,
      name: plan.name,
      price: plan.priceMonthly,
      period: plan.priceMonthly <= 0 ? "forever" : "month",
      features: mapPlanFeatures(plan),
      subscriberCount,
    };
  }

  private async subscriberCountFor(plan: SubscriptionPlan) {
    if (plan.id === PLAN_CATALOG.PREMIUM.id) {
      return this.prisma.user.count({ where: { subscriptionTier: SubscriptionTier.PREMIUM } });
    }
    if (plan.id === PLAN_CATALOG.FREE.id) {
      return this.prisma.user.count({ where: { subscriptionTier: SubscriptionTier.FREE } });
    }
    return plan.subscriberCount;
  }
}
