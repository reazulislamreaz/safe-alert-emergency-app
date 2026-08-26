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
const env_1 = require("../../config/env");
const alert_mapper_1 = require("../../common/mappers/alert.mapper");
const alert_constants_1 = require("./alert.constants");
const zego_util_1 = require("./zego.util");
const groupWithMembers = {
    members: { orderBy: { name: "asc" } },
};
let AlertService = class AlertService {
    prisma;
    realtime;
    constructor(prisma, realtime) {
        this.prisma = prisma;
        this.realtime = realtime;
    }
    getModes() {
        return {
            title: "Alert Mode",
            prompt: "How Should we alert?",
            subtitle: "This will immediately notify your emergency contacts and share your live location.",
            continueLabel: "Continue",
            modes: alert_constants_1.ALERT_MODES.map((mode) => ({ ...mode })),
        };
    }
    getCancelReasons() {
        return {
            title: "Cancel Alert",
            prompt: "Why are you Cancelling ?",
            subtitle: "This will immediately notify your emergency contacts that the alert has ended.",
            confirmLabel: "Confirm",
            reasons: alert_constants_1.CANCEL_REASONS.map((reason) => ({ ...reason })),
        };
    }
    getQuickResponses() {
        return { responses: alert_constants_1.QUICK_RESPONSES.map((item) => ({ ...item })) };
    }
    async getHome(userId) {
        const user = await this.requireUser(userId);
        const [contactCount, active, recentJournals] = await Promise.all([
            this.prisma.contact.count({ where: { userId } }),
            this.findActive(userId),
            this.prisma.journal.findMany({
                where: { userId },
                orderBy: { triggeredAt: "desc" },
                take: 3,
            }),
        ]);
        const hour = new Date().getHours();
        const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
        const firstName = user.fullName.split(" ")[0];
        return {
            greeting,
            user: {
                id: user.id,
                fullName: user.fullName,
                firstName,
                avatar: user.avatar,
                subscriptionTier: user.subscriptionTier,
            },
            sos: {
                label: "SOS",
                hint: "Tap or hold",
                holdHint: "Hold for 1.5s to skip confirmation",
            },
            confirmation: {
                title: "Activate Emergency Alert?",
                body: "This will immediately notify your emergency contacts and share your live location.",
                autoActivateSeconds: 4,
                confirmLabel: "Create Now",
                cancelLabel: "Cancel — I'm Safe",
            },
            actions: [
                { key: "QUICK", label: "Quick Emergency — Alert All Groups", alertAllGroups: true, mode: "EMERGENCY" },
                { key: "MANUAL", label: "Create Emergency Alert", alertAllGroups: false, mode: "EMERGENCY" },
                { key: "TEST", label: "Test Emergency Alert", alertAllGroups: true, mode: "TEST" },
            ],
            status: active
                ? {
                    key: "ACTIVE",
                    label: "Active alert",
                    lastSeenLabel: "Last seen: Now",
                }
                : {
                    key: "SAFE",
                    label: "Safe — No active alerts",
                    lastSeenLabel: "Last seen: Now",
                },
            hasContacts: contactCount > 0,
            emptyState: contactCount === 0
                ? {
                    title: "No contacts yet",
                    body: "Add people you trust. They'll be notified in emergencies.",
                    actionLabel: "Add contact",
                }
                : null,
            recentActivity: recentJournals.map((entry) => ({
                id: entry.id,
                title: entry.body,
                timeLabel: formatRelative(entry.triggeredAt),
                badge: entry.type === "TEST" ? "Test" : entry.source === "ALERT" ? "Safe" : "Update",
            })),
            activeAlert: active ? (0, alert_mapper_1.toAlertDto)(active) : null,
        };
    }
    async getCurrent(userId) {
        const alert = await this.findActive(userId);
        return alert ? (0, alert_mapper_1.toAlertDto)(alert) : null;
    }
    async triggerAlert(params) {
        const user = await this.requireUser(params.userId);
        const existing = await this.findActive(user.id);
        if (existing) {
            return (0, alert_mapper_1.toAlertDto)(existing);
        }
        const source = parseSource(params.source);
        const mode = params.mode ?? client_1.AlertMode.EMERGENCY;
        const alertAllGroups = params.alertAllGroups ?? source === client_1.AlertSource.QUICK;
        const emergencyType = (await this.prisma.emergencyType.findUnique({
            where: { id: params.emergencyTypeId || alert_constants_1.DEFAULT_EMERGENCY_TYPE_ID },
        })) ??
            (await this.prisma.emergencyType.findFirst({
                where: { isActive: true },
                orderBy: { sortOrder: "asc" },
            }));
        if (!emergencyType) {
            throw new common_1.NotFoundException("Emergency type not found");
        }
        const groups = await this.prisma.contactGroup.findMany({
            where: {
                userId: user.id,
                ...(alertAllGroups ? {} : { isDefaultSOS: true }),
            },
            include: groupWithMembers,
        });
        const latitude = params.latitude ?? 40.712776;
        const longitude = params.longitude ?? -74.005974;
        const address = params.address || user.location || "123 Main St, New York, NY 10001";
        const firstName = user.fullName.split(" ")[0];
        const alertId = `alt-${crypto.randomUUID().slice(0, 8)}`;
        const roomId = `safealert-${alertId}`;
        const participants = buildParticipants(user.id, user.fullName, firstName, groups);
        const alert = await this.prisma.alert.create({
            data: {
                id: alertId,
                userId: user.id,
                userName: user.fullName,
                userPhone: user.phone,
                emergencyTypeId: emergencyType.id,
                emergencyTypeLabel: emergencyType.label,
                severity: emergencyType.severity,
                mode,
                source,
                status: client_1.AlertStatus.BROADCASTING,
                latitude,
                longitude,
                address,
                roomId,
                participants: participants,
                telemetryHistory: {
                    create: {
                        latitude,
                        longitude,
                        accuracy: 3,
                        speed: 0,
                        heading: 0,
                        batteryLevel: 92,
                    },
                },
                notifiedGroups: {
                    create: groups.map((group) => ({
                        groupId: group.id,
                        groupName: group.name,
                        memberCount: group.memberCount || group.members.length,
                        deliveryStatus: client_1.DeliveryStatus.DELIVERED,
                    })),
                },
                liveMessages: {
                    create: {
                        sender: "SafeAlert System",
                        text: mode === client_1.AlertMode.TEST
                            ? `Test alert sent for ${emergencyType.label}. Contacts notified.`
                            : `🚨 SOS broadcast started for ${emergencyType.label}. Emergency circle alerted.`,
                        timestamp: clockLabel(),
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
    async getLiveSession(id) {
        const alert = await this.requireAlert(id);
        const dto = (0, alert_mapper_1.toAlertDto)(alert);
        const respondingContacts = dto.activeCallParticipants
            .filter((participant) => !participant.isSender)
            .map((participant) => ({
            id: participant.id,
            contactId: participant.contactId,
            name: participant.name,
            initials: participant.initials,
            relationship: participant.relationship,
            statusLabel: "En route",
            color: participant.color,
        }));
        return {
            ...dto,
            title: "Live Session",
            sosPinLabel: "SOS",
            actions: {
                startCallLabel: "Start Group Video Call",
                viewLiveLabel: "View Live Session",
                callLabel: "Call",
                endAlertLabel: "End Alert",
                messageLabel: "Message",
                cancelLabel: "Cancel Alert",
            },
            respondingContacts,
        };
    }
    async getCallSession(id, userId) {
        const alert = await this.requireAlert(id);
        const dto = (0, alert_mapper_1.toAlertDto)(alert);
        const appId = env_1.env.zegoAppId;
        const secret = env_1.env.zegoServerSecret;
        let token = null;
        if (appId && secret.length === 32) {
            token = (0, zego_util_1.generateZegoToken04)(appId, userId, secret, 3600, "");
        }
        return {
            alertId: dto.id,
            roomId: dto.roomId,
            title: "LIVE EMERGENCY CALL",
            groupLabel: "Emergency Group",
            durationLabel: dto.durationLabel,
            userId,
            userName: dto.userName,
            appId: appId || null,
            token,
            demo: !token,
            participants: dto.activeCallParticipants,
            quickResponses: alert_constants_1.QUICK_RESPONSES.map((item) => ({ ...item })),
        };
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
                        timestamp: clockLabel(),
                        type,
                    },
                },
            },
            include: alert_mapper_1.alertInclude,
        });
        return (0, alert_mapper_1.toAlertDto)(alert);
    }
    async quickResponse(alertId, userId, dto) {
        await this.requireOwned(alertId, userId);
        const action = alert_constants_1.QUICK_RESPONSES.find((item) => item.key === dto.action);
        if (!action) {
            throw new common_1.BadRequestException("Unknown quick response.");
        }
        const user = await this.requireUser(userId);
        const updated = await this.addMessage(alertId, user.fullName.split(" ")[0], action.text, client_1.MessageType.QUICK_REPLY);
        if (updated) {
            this.realtime.emitToRoom(`room:${alertId}`, "alert:messages:update", updated.liveMessages);
        }
        return updated;
    }
    async updateParticipant(alertId, dto) {
        const alert = await this.requireAlert(alertId);
        const participants = (alert.participants ?? []).map((participant) => {
            const matched = (dto.participantId && participant.id === dto.participantId) ||
                (dto.contactId && participant.contactId === dto.contactId);
            if (!matched) {
                return participant;
            }
            const status = dto.status ?? "CONNECTED";
            return {
                ...participant,
                status,
                responderStatus: status === "CONNECTED" ? "JOINED" : "CALLING",
            };
        });
        const updated = await this.prisma.alert.update({
            where: { id: alertId },
            data: { participants: participants },
            include: alert_mapper_1.alertInclude,
        });
        const dtoAlert = (0, alert_mapper_1.toAlertDto)(updated);
        this.realtime.emitToRoom(`room:${alertId}`, "alert:state", dtoAlert);
        return dtoAlert;
    }
    async cancelAlert(alertId, userId, reasonRaw, notes, pin) {
        return this.closeAlert(alertId, userId, reasonRaw, notes, pin);
    }
    async resolveAlert(alertId, reason, notes, pin, userId) {
        return this.closeAlert(alertId, userId, reason, notes, pin);
    }
    async closeAlert(alertId, userId, reasonRaw, notes, pin) {
        const alert = await this.requireAlert(alertId);
        const closer = await this.requireUser(userId);
        if (alert.userId !== userId && closer.role === client_1.Role.USER) {
            throw new common_1.ForbiddenException("You can only cancel your own alert.");
        }
        if (alert.status !== client_1.AlertStatus.BROADCASTING) {
            throw new common_1.BadRequestException("This alert is already closed.");
        }
        const owner = await this.requireUser(alert.userId);
        if (pin) {
            if (!(await (0, bcryptjs_1.compare)(pin, owner.pinHash))) {
                throw new common_1.BadRequestException("Incorrect Security PIN");
            }
        }
        const reasonMeta = alert_constants_1.CANCEL_REASONS.find((item) => item.key === normalizeReason(reasonRaw)) ?? alert_constants_1.CANCEL_REASONS[0];
        const durationMins = Math.max(1, Math.round((Date.now() - alert.triggeredAt.getTime()) / 60000));
        const firstName = owner.fullName.split(" ")[0];
        const cancelledBody = `${firstName} has cancelled their emergency safety alert and indicated that it was a ${reasonPhrase(reasonMeta.key)}.`;
        const [resolved] = await this.prisma.$transaction([
            this.prisma.alert.update({
                where: { id: alertId },
                data: {
                    status: client_1.AlertStatus.CANCELLED,
                    resolvedAt: new Date(),
                    resolutionReason: reasonMeta.key,
                    resolutionNotes: notes?.trim() || reasonMeta.description,
                },
                include: alert_mapper_1.alertInclude,
            }),
            this.prisma.journal.create({
                data: {
                    id: `jrn-${crypto.randomUUID().slice(0, 8)}`,
                    userId: alert.userId,
                    type: reasonMeta.key === "TEST" ? client_1.JournalEntryType.TEST : client_1.JournalEntryType.INCIDENT,
                    body: notes?.trim() || cancelledBody,
                    source: client_1.JournalSource.ALERT,
                    emergencyType: alert.emergencyTypeLabel,
                    severity: alert.severity,
                    status: "CANCELLED",
                    resolutionReason: reasonMeta.key,
                    resolutionNotes: notes?.trim() || reasonMeta.description,
                    location: alert.address,
                    triggeredAt: alert.triggeredAt,
                    duration: `${durationMins} mins`,
                },
            }),
        ]);
        const dto = (0, alert_mapper_1.toAlertDto)(resolved);
        const payload = {
            ...dto,
            cancelledTitle: "Alert Cancelled",
            cancelledBody,
            reasonLabel: `Reason: ${reasonMeta.label}`,
            homeLabel: "Back to Home",
        };
        this.realtime.emitToRoom(`room:${alertId}`, "alert:resolved", payload);
        this.realtime.emit("admin:alert:resolved", payload);
        return payload;
    }
    async findActive(userId) {
        return this.prisma.alert.findFirst({
            where: { userId, status: client_1.AlertStatus.BROADCASTING },
            include: alert_mapper_1.alertInclude,
            orderBy: { triggeredAt: "desc" },
        });
    }
    async requireAlert(id) {
        const alert = await this.prisma.alert.findUnique({
            where: { id },
            include: alert_mapper_1.alertInclude,
        });
        if (!alert) {
            throw new common_1.NotFoundException("Alert not found");
        }
        return alert;
    }
    async requireOwned(alertId, userId) {
        const alert = await this.requireAlert(alertId);
        if (alert.userId !== userId) {
            throw new common_1.ForbiddenException("You can only update your own alert.");
        }
        return alert;
    }
    async requireUser(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        return user;
    }
};
exports.AlertService = AlertService;
exports.AlertService = AlertService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_service_1.RealtimeService])
], AlertService);
function parseSource(value) {
    const normalized = (value || "").trim().toUpperCase();
    if (normalized === "QUICK")
        return client_1.AlertSource.QUICK;
    if (normalized === "SOS")
        return client_1.AlertSource.SOS;
    return client_1.AlertSource.MANUAL;
}
function normalizeReason(value) {
    const normalized = (value || "").trim().toUpperCase().replace(/[\s'-]/g, "_");
    if (normalized === "FALSE_ALERT" || normalized === "FALSE_ALARM")
        return "FALSE_ALARM";
    if (normalized === "TEST")
        return "TEST";
    if (normalized === "IM_SAFE" || normalized === "I_M_SAFE" || normalized === "SAFE")
        return "SAFE";
    return "SAFE";
}
function reasonPhrase(reason) {
    if (reason === "FALSE_ALARM")
        return "false alert";
    if (reason === "TEST")
        return "test alert";
    return "safe situation";
}
function clockLabel() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatRelative(date) {
    const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
    if (minutes < 60)
        return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24)
        return `${hours}h ago`;
    if (hours < 48)
        return "Yesterday";
    return `${Math.round(hours / 24)}d ago`;
}
function buildParticipants(userId, fullName, firstName, groups) {
    const seen = new Set();
    const sender = {
        id: `part-${userId}`,
        contactId: null,
        name: fullName,
        displayName: `You (${firstName})`,
        initials: initialsFrom(fullName),
        relationship: "Sender",
        status: "CONNECTED",
        responderStatus: "JOINED",
        color: alert_constants_1.PARTICIPANT_COLORS[0],
        isSender: true,
    };
    const members = [];
    for (const group of groups) {
        for (const member of group.members) {
            const key = member.contactId || member.id;
            if (seen.has(key))
                continue;
            seen.add(key);
            const joined = member.isJoinedCall;
            members.push({
                id: `part-${key}`,
                contactId: member.contactId,
                name: member.name,
                displayName: member.name.split(" ")[0],
                initials: initialsFrom(member.name),
                relationship: member.relationship,
                status: joined ? "CONNECTED" : "CALLING",
                responderStatus: joined ? "JOINED" : "CALLING",
                color: alert_constants_1.PARTICIPANT_COLORS[(members.length + 1) % alert_constants_1.PARTICIPANT_COLORS.length],
            });
        }
    }
    return [sender, ...members];
}
function initialsFrom(name) {
    return name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("")
        .slice(0, 2);
}
//# sourceMappingURL=alert.service.js.map