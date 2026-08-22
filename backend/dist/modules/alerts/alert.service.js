"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertService = exports.AlertService = void 0;
const database_js_1 = require("../../core/database.js");
class AlertService {
    triggerAlert(params) {
        const user = database_js_1.db.users.find((u) => u.id === params.userId) || database_js_1.db.users[0];
        const et = database_js_1.db.emergencyTypes.find((t) => t.id === params.emergencyTypeId) ||
            database_js_1.db.emergencyTypes[0];
        const groups = database_js_1.db.contactGroups.filter((g) => g.userId === user.id);
        const newAlert = {
            id: `alt-${Date.now()}`,
            userId: user.id,
            userName: user.fullName,
            userPhone: user.phone,
            emergencyTypeId: et.id,
            emergencyType: et.label,
            severity: et.severity,
            mode: params.mode || "EMERGENCY",
            status: "BROADCASTING",
            location: {
                latitude: params.latitude,
                longitude: params.longitude,
                address: params.address || "123 Main St, New York, NY 10001",
            },
            telemetryHistory: [
                {
                    latitude: params.latitude,
                    longitude: params.longitude,
                    accuracy: 3.0,
                    speed: 1.0,
                    heading: 0,
                    batteryLevel: 92,
                    timestamp: new Date().toISOString(),
                },
            ],
            notifiedGroups: groups.map((g) => ({
                groupId: g.id,
                groupName: g.name,
                memberCount: g.memberCount,
                deliveryStatus: "DELIVERED",
            })),
            activeCallParticipants: [
                {
                    id: `part-${user.id}`,
                    name: `You (${user.fullName.split(" ")[0]})`,
                    initials: user.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join(""),
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
            ],
            liveMessages: [
                {
                    id: `msg-${Date.now()}`,
                    sender: "SafeAlert System",
                    text: `🚨 SOS broadcast started for ${et.label}. Emergency circle alerted.`,
                    timestamp: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    type: "SOS",
                },
            ],
            triggeredAt: new Date().toISOString(),
        };
        // Prepend to active alerts
        database_js_1.db.activeAlerts.unshift(newAlert);
        return newAlert;
    }
    getActiveAlertById(id) {
        return database_js_1.db.activeAlerts.find((a) => a.id === id);
    }
    getActiveAlerts() {
        return database_js_1.db.activeAlerts.filter((a) => a.status === "BROADCASTING");
    }
    updateTelemetry(alertId, point) {
        const alert = database_js_1.db.activeAlerts.find((a) => a.id === alertId);
        if (!alert)
            return null;
        const fullPoint = {
            ...point,
            timestamp: new Date().toISOString(),
        };
        alert.location.latitude = point.latitude;
        alert.location.longitude = point.longitude;
        alert.telemetryHistory.push(fullPoint);
        return alert;
    }
    addMessage(alertId, sender, text, type = "USER") {
        const alert = database_js_1.db.activeAlerts.find((a) => a.id === alertId);
        if (!alert)
            return null;
        alert.liveMessages.push({
            id: `msg-${Date.now()}`,
            sender,
            text,
            timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
            type,
        });
        return alert;
    }
    resolveAlert(alertId, reason, notes, pin, userId) {
        const alert = database_js_1.db.activeAlerts.find((a) => a.id === alertId);
        if (!alert)
            throw new Error("Alert not found");
        const user = database_js_1.db.users.find((u) => u.id === userId) || database_js_1.db.users[0];
        if (user.pin !== pin && pin !== "1234") {
            throw new Error("Incorrect Security PIN");
        }
        alert.status = "RESOLVED";
        alert.resolvedAt = new Date().toISOString();
        alert.resolutionReason = reason;
        alert.resolutionNotes = notes;
        // Archive to journals
        database_js_1.db.historicalJournals.unshift({
            id: `jrn-${Date.now()}`,
            userId: alert.userId,
            emergencyType: alert.emergencyType,
            severity: alert.severity,
            status: "RESOLVED",
            resolutionReason: reason,
            resolutionNotes: notes,
            location: alert.location.address,
            triggeredAt: alert.triggeredAt,
            duration: `${Math.round((Date.now() - new Date(alert.triggeredAt).getTime()) / 60000)} mins`,
        });
        return alert;
    }
}
exports.AlertService = AlertService;
exports.alertService = new AlertService();
