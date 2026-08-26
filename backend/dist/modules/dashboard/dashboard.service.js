"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const user_mapper_1 = require("../../common/mappers/user.mapper");
function initialsFromName(name) {
    return name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("")
        .slice(0, 2);
}
function timeAgo(date) {
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
function titleCase(value) {
    return value.charAt(0) + value.slice(1).toLowerCase();
}
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOverviewMetrics() {
        const [totalUsers, activeAlerts, premiumUsers, freeUsers, groupsActive, recent] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.alert.count({ where: { status: client_1.AlertStatus.BROADCASTING } }),
            this.prisma.user.count({ where: { subscriptionTier: client_1.SubscriptionTier.PREMIUM } }),
            this.prisma.user.count({ where: { subscriptionTier: client_1.SubscriptionTier.FREE } }),
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
                status: alert.status === client_1.AlertStatus.BROADCASTING ? "Active" : titleCase(alert.status),
            })),
        };
    }
    async getUsers(query) {
        const where = query
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
        return users.map(user_mapper_1.toPublicUser);
    }
    async toggleUserVerification(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return null;
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { isVerified: !user.isVerified },
        });
        return (0, user_mapper_1.toPublicUser)(updated);
    }
    async getEmergencyTypes() {
        return this.prisma.emergencyType.findMany({ orderBy: { label: "asc" } });
    }
    async createEmergencyType(dto) {
        return this.prisma.emergencyType.create({
            data: {
                id: `et-${Date.now()}`,
                key: dto.key,
                label: dto.label,
                severity: dto.severity,
                icon: dto.icon,
                description: dto.description,
                isActive: dto.isActive ?? true,
            },
        });
    }
    async toggleEmergencyType(id) {
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
        }));
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map