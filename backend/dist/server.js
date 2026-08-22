"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const env_js_1 = require("./config/env.js");
const database_js_1 = require("./core/database.js");
const auth_service_js_1 = require("./modules/auth/auth.service.js");
const alert_service_js_1 = require("./modules/alerts/alert.service.js");
const contact_service_js_1 = require("./modules/contacts/contact.service.js");
const dashboard_service_js_1 = require("./modules/dashboard/dashboard.service.js");
const socket_gateway_js_1 = require("./gateways/socket.gateway.js");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
app.use((0, cors_1.default)({ origin: env_js_1.config.corsOrigin, credentials: true }));
app.use(express_1.default.json());
// Initialize Socket.io
const io = new socket_io_1.Server(server, {
    cors: {
        origin: env_js_1.config.corsOrigin,
        methods: ["GET", "POST"],
    },
});
(0, socket_gateway_js_1.initSocketGateway)(io);
// Health Check
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        service: "SafeAlert Emergency Backend",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
// --- AUTH ROUTES ---
app.post("/api/auth/login", (req, res) => {
    try {
        const { emailOrPhone, pin } = req.body;
        const result = auth_service_js_1.authService.login(emailOrPhone, pin);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(401).json({ success: false, error: error.message });
    }
});
app.post("/api/auth/verify-pin", (req, res) => {
    const { userId, pin } = req.body;
    const valid = auth_service_js_1.authService.verifyPin(userId || "usr-sarah-101", pin);
    res.json({ success: valid });
});
app.get("/api/auth/me", (req, res) => {
    const user = database_js_1.db.users[0]; // Default mock Sarah Johnson
    res.json({ success: true, data: user });
});
// --- ALERT ROUTES ---
app.get("/api/alerts/active", (req, res) => {
    const alerts = alert_service_js_1.alertService.getActiveAlerts();
    res.json({ success: true, data: alerts });
});
app.get("/api/alerts/:id", (req, res) => {
    const alert = alert_service_js_1.alertService.getActiveAlertById(req.params.id);
    if (!alert)
        return res.status(404).json({ success: false, error: "Alert not found" });
    res.json({ success: true, data: alert });
});
app.post("/api/alerts/trigger", (req, res) => {
    try {
        const { userId, emergencyTypeId, mode, latitude, longitude, address } = req.body;
        const alert = alert_service_js_1.alertService.triggerAlert({
            userId: userId || "usr-sarah-101",
            emergencyTypeId: emergencyTypeId || "et-assault",
            mode: mode || "EMERGENCY",
            latitude: latitude || 40.712776,
            longitude: longitude || -74.005974,
            address: address || "123 Main St, New York, NY 10001",
        });
        // Notify all connected clients and admin room
        io.emit("admin:alert:new", alert);
        res.status(201).json({ success: true, data: alert });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
app.post("/api/alerts/:id/telemetry", (req, res) => {
    const { latitude, longitude, speed, heading, accuracy, batteryLevel } = req.body;
    const updated = alert_service_js_1.alertService.updateTelemetry(req.params.id, {
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        accuracy: accuracy || 3,
        batteryLevel: batteryLevel || 85,
    });
    if (!updated)
        return res.status(404).json({ success: false, error: "Alert not found" });
    io.to(`room:${req.params.id}`).emit("alert:telemetry:update", {
        alertId: req.params.id,
        location: updated.location,
        latestPoint: updated.telemetryHistory[updated.telemetryHistory.length - 1],
    });
    res.json({ success: true, data: updated });
});
app.post("/api/alerts/:id/resolve", (req, res) => {
    try {
        const { reason, notes, pin, userId } = req.body;
        const resolved = alert_service_js_1.alertService.resolveAlert(req.params.id, reason || "SAFE", notes || "", pin || "1234", userId || "usr-sarah-101");
        io.to(`room:${req.params.id}`).emit("alert:resolved", resolved);
        io.emit("admin:alert:resolved", resolved);
        res.json({ success: true, data: resolved });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
// --- CONTACT & GROUP ROUTES ---
app.get("/api/contacts/groups", (req, res) => {
    const userId = req.query.userId || "usr-sarah-101";
    const groups = contact_service_js_1.contactService.getGroups(userId);
    res.json({ success: true, data: groups });
});
app.post("/api/contacts/groups", (req, res) => {
    const { userId, name, color } = req.body;
    const group = contact_service_js_1.contactService.createGroup(userId || "usr-sarah-101", name, color);
    res.status(201).json({ success: true, data: group });
});
app.post("/api/contacts/members", (req, res) => {
    const { groupId, name, phone, relationship } = req.body;
    const member = contact_service_js_1.contactService.addMember(groupId, name, phone, relationship);
    res.status(201).json({ success: true, data: member });
});
app.delete("/api/contacts/members/:id", (req, res) => {
    const success = contact_service_js_1.contactService.deleteMember(req.params.id);
    res.json({ success });
});
// --- EMERGENCY TYPES & JOURNALS ---
app.get("/api/emergency-types", (req, res) => {
    res.json({ success: true, data: database_js_1.db.emergencyTypes });
});
app.get("/api/journals", (req, res) => {
    res.json({ success: true, data: database_js_1.db.historicalJournals });
});
// --- ADMIN DASHBOARD ROUTES ---
app.get("/api/dashboard/metrics", (req, res) => {
    const metrics = dashboard_service_js_1.dashboardService.getOverviewMetrics();
    res.json({ success: true, data: metrics });
});
app.get("/api/dashboard/users", (req, res) => {
    const query = req.query.q;
    const users = dashboard_service_js_1.dashboardService.getUsers(query);
    res.json({ success: true, data: users });
});
app.patch("/api/dashboard/users/:id/verify", (req, res) => {
    const updated = dashboard_service_js_1.dashboardService.toggleUserVerification(req.params.id);
    if (!updated)
        return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, data: updated });
});
app.get("/api/dashboard/emergency-types", (req, res) => {
    const types = dashboard_service_js_1.dashboardService.getEmergencyTypes();
    res.json({ success: true, data: types });
});
app.post("/api/dashboard/emergency-types", (req, res) => {
    const newType = dashboard_service_js_1.dashboardService.createEmergencyType(req.body);
    res.status(201).json({ success: true, data: newType });
});
app.patch("/api/dashboard/emergency-types/:id/toggle", (req, res) => {
    const updated = dashboard_service_js_1.dashboardService.toggleEmergencyType(req.params.id);
    if (!updated)
        return res.status(404).json({ success: false, error: "Type not found" });
    res.json({ success: true, data: updated });
});
app.get("/api/dashboard/subscriptions", (req, res) => {
    const subs = dashboard_service_js_1.dashboardService.getSubscriptions();
    res.json({ success: true, data: subs });
});
// Start Server
server.listen(env_js_1.config.port, () => {
    console.log(`\n======================================================`);
    console.log(`🚨 SafeAlert Emergency Backend running on port ${env_js_1.config.port}`);
    console.log(`📡 WebSocket Gateway ready on ws://localhost:${env_js_1.config.port}`);
    console.log(`🩺 Health check: http://localhost:${env_js_1.config.port}/health`);
    console.log(`======================================================\n`);
});
