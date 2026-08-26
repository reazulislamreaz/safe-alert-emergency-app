import { Injectable } from "@nestjs/common";
import { AlertStatus, Prisma, SubscriptionTier } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { toPublicUser } from "../../common/mappers/user.mapper";
import { CreateEmergencyTypeDto } from "./dto/emergency-type.dto";

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

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverviewMetrics() {
    const [totalUsers, activeAlerts, premiumUsers, freeUsers, groupsActive, recent] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.alert.count({ where: { status: AlertStatus.BROADCASTING } }),
        this.prisma.user.count({ where: { subscriptionTier: SubscriptionTier.PREMIUM } }),
        this.prisma.user.count({ where: { subscriptionTier: SubscriptionTier.FREE } }),
        this.prisma.contactGroup.count(),
        this.prisma.alert.findMany({
          orderBy: { triggeredAt: "desc" },
          take: 5,
        }),
      ]);

    const monthlyRevenue = Math.round(premiumUsers * 7.99);

    return {
      kpis: {
        totalUsers: { value: totalUsers, change: "+12% this month" },
        activeAlerts: { value: activeAlerts, change: "+3 today this month" },
        premiumUsers: { value: premiumUsers, change: "+8% this month" },
        groupsActive: { value: groupsActive, change: "+5% this month" },
      },
      subscriptionSplit: {
        premium: premiumUsers,
        free: freeUsers,
        monthlyRevenue,
        revenueGrowth: "+14% from last month",
      },
      recentAlerts: recent.map((alert) => ({
        id: alert.id,
        userName: alert.userName,
        userInitials: initialsFromName(alert.userName),
        color: "#2563EB",
        category: alert.emergencyTypeLabel,
        severity: titleCase(alert.severity),
        timeAgo: timeAgo(alert.triggeredAt),
        status: alert.status === AlertStatus.BROADCASTING ? "Active" : titleCase(alert.status),
      })),
    };
  }

  async getUsers(query?: string) {
    const where: Prisma.UserWhereInput = query
      ? {
          OR: [
            { fullName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
          ],
        }
      : {};

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return users.map(toPublicUser);
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
    return toPublicUser(updated);
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
    const last = await this.prisma.emergencyType.aggregate({ _max: { sortOrder: true } });
    return this.prisma.emergencyType.create({
      data: {
        id: `et-${Date.now()}`,
        key: dto.key,
        label: dto.label,
        severity: dto.severity,
        icon: dto.icon,
        description: dto.description,
        isActive: dto.isActive ?? true,
        sortOrder: (last._max.sortOrder ?? 0) + 1,
      },
    });
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
    return this.prisma.subscriptionPlan.findMany({ orderBy: { priceMonthly: "asc" } });
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
}
