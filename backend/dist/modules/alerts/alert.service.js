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
exports.AlertService = void 0;
const common_1 = require("@nestjs/common");
const bcryptjs_1 = require("bcryptjs");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const realtime_service_1 = require("../../realtime/realtime.service");
const alert_mapper_1 = require("../../common/mappers/alert.mapper");
let AlertService = class AlertService {
    prisma;
    realtime;
    constructor(prisma, realtime) {
        this.prisma = prisma;
        this.realtime = realtime;
    }
    async triggerAlert(params) {
        const user = (await this.prisma.user.findUnique({ where: { id: params.userId } })) ??
            (await this.prisma.user.findUnique({ where: { id: "usr-sarah-101" } }));
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        const emergencyType = (await this.prisma.emergencyType.findUnique({
            where: { id: params.emergencyTypeId || "et-assault" },
        })) ?? (await this.prisma.emergencyType.findFirst());
        if (!emergencyType) {
            throw new common_1.NotFoundException("Emergency type not found");
        }
        const groups = await this.prisma.contactGroup.findMany({
            where: { userId: user.id },
        });
        const latitude = params.latitude ?? 40.712776;
        const longitude = params.longitude ?? -74.005974;
        const address = params.address || "123 Main St, New York, NY 10001";
        const firstName = user.fullName.split(" ")[0];
        const initials = user.fullName
            .split(" ")
            .map((part) => part[0])
            .join("");
        const participants = [
            {
                id: `part-${user.id}`,
                name: `You (${firstName})`,
                initials,
                status: "CONNECTED",
                color: "#3A67D5",
                isSender: true,
            },
            {
                id: "part-james",
                name: "James",
                initials: "JJ",
                status: "CONNECTED",
                color: "#3B82F6",
            },
            {
                id: "part-emma",
                name: "Emma",
                initials: "ES",
                status: "CONNECTED",
                color: "#8B5CF6",
            },
        ];
        const alert = await this.prisma.alert.create({
            data: {
                id: `alt-${Date.now()}`,
                userId: user.id,
                userName: user.fullName,
                userPhone: user.phone,
                emergencyTypeId: emergencyType.id,
                emergencyTypeLabel: emergencyType.label,
                severity: emergencyType.severity,
                mode: params.mode ?? client_1.AlertMode.EMERGENCY,
                status: client_1.AlertStatus.BROADCASTING,
                latitude,
                longitude,
                address,
                participants: participants,
                telemetryHistory: {
                    create: {
                        latitude,
                        longitude,
                        accuracy: 3,
                        speed: 1,
                        heading: 0,
                        batteryLevel: 92,
                    },
                },
                notifiedGroups: {
                    create: groups.map((group) => ({
                        groupId: group.id,
                        groupName: group.name,
                        memberCount: group.memberCount,
                        deliveryStatus: client_1.DeliveryStatus.DELIVERED,
                    })),
                },
                liveMessages: {
                    create: {
                        sender: "SafeAlert System",
                        text: `🚨 SOS broadcast started for ${emergencyType.label}. Emergency circle alerted.`,
                        timestamp: new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                        type: client_1.MessageType.SOS,
                    },
                },
            },
            include: alert_mapper_1.alertInclude,
        });
        const dto = (0, alert_mapper_1.toAlertDto)(alert);
        this.realtime.emit("admin:alert:new", dto);
        return dto;
    }
    async getActiveAlertById(id) {
        const alert = await this.prisma.alert.findUnique({
            where: { id },
            include: alert_mapper_1.alertInclude,
        });
        return alert ? (0, alert_mapper_1.toAlertDto)(alert) : null;
    }
    async getActiveAlerts() {
        const alerts = await this.prisma.alert.findMany({
            where: { status: client_1.AlertStatus.BROADCASTING },
            include: alert_mapper_1.alertInclude,
            orderBy: { triggeredAt: "desc" },
        });
        return alerts.map(alert_mapper_1.toAlertDto);
    }
    async updateTelemetry(alertId, point) {
        const existing = await this.prisma.alert.findUnique({ where: { id: alertId } });
        if (!existing) {
            return null;
        }
        const alert = await this.prisma.alert.update({
            where: { id: alertId },
            data: {
                latitude: point.latitude,
                longitude: point.longitude,
                telemetryHistory: {
                    create: {
                        latitude: point.latitude,
                        longitude: point.longitude,
                        speed: point.speed ?? 0,
                        heading: point.heading ?? 0,
                        accuracy: point.accuracy ?? 3,
                        batteryLevel: point.batteryLevel ?? 85,
                    },
                },
            },
            include: alert_mapper_1.alertInclude,
        });
        const dto = (0, alert_mapper_1.toAlertDto)(alert);
        this.realtime.emitToRoom(`room:${alertId}`, "alert:telemetry:update", {
            alertId,
            location: dto.location,
            latestPoint: dto.telemetryHistory[dto.telemetryHistory.length - 1],
        });
        this.realtime.emitToRoom("room:admin", "admin:alert:telemetry", {
            alertId,
            location: dto.location,
        });
        return dto;
    }
    async addMessage(alertId, sender, text, type = client_1.MessageType.USER) {
        const existing = await this.prisma.alert.findUnique({ where: { id: alertId } });
        if (!existing) {
            return null;
        }
        const alert = await this.prisma.alert.update({
            where: { id: alertId },
            data: {
                liveMessages: {
                    create: {
                        sender,
                        text,
                        timestamp: new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                        type,
                    },
                },
            },
            include: alert_mapper_1.alertInclude,
        });
        return (0, alert_mapper_1.toAlertDto)(alert);
    }
    async resolveAlert(alertId, reason, notes, pin, userId) {
        const alert = await this.prisma.alert.findUnique({
            where: { id: alertId },
            include: alert_mapper_1.alertInclude,
        });
        if (!alert) {
            throw new common_1.NotFoundException("Alert not found");
        }
        const user = (await this.prisma.user.findUnique({ where: { id: userId } })) ??
            (await this.prisma.user.findUnique({ where: { id: "usr-sarah-101" } }));
        if (!user || !(await (0, bcryptjs_1.compare)(pin, user.pinHash))) {
            throw new common_1.BadRequestException("Incorrect Security PIN");
        }
        const durationMins = Math.max(1, Math.round((Date.now() - alert.triggeredAt.getTime()) / 60000));
        const [resolved] = await this.prisma.$transaction([
            this.prisma.alert.update({
                where: { id: alertId },
                data: {
                    status: client_1.AlertStatus.RESOLVED,
                    resolvedAt: new Date(),
                    resolutionReason: reason,
                    resolutionNotes: notes,
                },
                include: alert_mapper_1.alertInclude,
            }),
            this.prisma.journal.create({
                data: {
                    id: `jrn-${Date.now()}`,
                    userId: alert.userId,
                    emergencyType: alert.emergencyTypeLabel,
                    severity: alert.severity,
                    status: "RESOLVED",
                    resolutionReason: reason,
                    resolutionNotes: notes,
                    location: alert.address,
                    triggeredAt: alert.triggeredAt,
                    duration: `${durationMins} mins`,
                },
            }),
        ]);
        const dto = (0, alert_mapper_1.toAlertDto)(resolved);
        this.realtime.emitToRoom(`room:${alertId}`, "alert:resolved", dto);
        this.realtime.emit("admin:alert:resolved", dto);
        return dto;
    }
};
exports.AlertService = AlertService;
exports.AlertService = AlertService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_service_1.RealtimeService])
], AlertService);
//# sourceMappingURL=alert.service.js.map