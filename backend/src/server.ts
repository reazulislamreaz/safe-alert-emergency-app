import express from "express";
import http from "http";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import { config } from "./config/env.js";
import { db } from "./core/database.js";
import { authService } from "./modules/auth/auth.service.js";
import { alertService } from "./modules/alerts/alert.service.js";
import { contactService } from "./modules/contacts/contact.service.js";
import { dashboardService } from "./modules/dashboard/dashboard.service.js";
import { initSocketGateway } from "./gateways/socket.gateway.js";

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

// Initialize Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ["GET", "POST"],
  },
});

initSocketGateway(io);

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
    const result = authService.login(emailOrPhone, pin);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(401).json({ success: false, error: error.message });
  }
});

app.post("/api/auth/verify-pin", (req, res) => {
  const { userId, pin } = req.body;
  const valid = authService.verifyPin(userId || "usr-sarah-101", pin);
  res.json({ success: valid });
});

app.get("/api/auth/me", (req, res) => {
  const user = db.users[0]; // Default mock Sarah Johnson
  res.json({ success: true, data: user });
});

// --- ALERT ROUTES ---
app.get("/api/alerts/active", (req, res) => {
  const alerts = alertService.getActiveAlerts();
  res.json({ success: true, data: alerts });
});

app.get("/api/alerts/:id", (req, res) => {
  const alert = alertService.getActiveAlertById(req.params.id);
  if (!alert) return res.status(404).json({ success: false, error: "Alert not found" });
  res.json({ success: true, data: alert });
});

app.post("/api/alerts/trigger", (req, res) => {
  try {
    const { userId, emergencyTypeId, mode, latitude, longitude, address } = req.body;
    const alert = alertService.triggerAlert({
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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/alerts/:id/telemetry", (req, res) => {
  const { latitude, longitude, speed, heading, accuracy, batteryLevel } = req.body;
  const updated = alertService.updateTelemetry(req.params.id, {
    latitude,
    longitude,
    speed: speed || 0,
    heading: heading || 0,
    accuracy: accuracy || 3,
    batteryLevel: batteryLevel || 85,
  });
  if (!updated) return res.status(404).json({ success: false, error: "Alert not found" });

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
    const resolved = alertService.resolveAlert(
      req.params.id,
      reason || "SAFE",
      notes || "",
      pin || "1234",
      userId || "usr-sarah-101"
    );

    io.to(`room:${req.params.id}`).emit("alert:resolved", resolved);
    io.emit("admin:alert:resolved", resolved);

    res.json({ success: true, data: resolved });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// --- CONTACT & GROUP ROUTES ---
app.get("/api/contacts/groups", (req, res) => {
  const userId = (req.query.userId as string) || "usr-sarah-101";
  const groups = contactService.getGroups(userId);
  res.json({ success: true, data: groups });
});

app.post("/api/contacts/groups", (req, res) => {
  const { userId, name, color } = req.body;
  const group = contactService.createGroup(userId || "usr-sarah-101", name, color);
  res.status(201).json({ success: true, data: group });
});

app.post("/api/contacts/members", (req, res) => {
  const { groupId, name, phone, relationship } = req.body;
  const member = contactService.addMember(groupId, name, phone, relationship);
  res.status(201).json({ success: true, data: member });
});

app.delete("/api/contacts/members/:id", (req, res) => {
  const success = contactService.deleteMember(req.params.id);
  res.json({ success });
});

// --- EMERGENCY TYPES & JOURNALS ---
app.get("/api/emergency-types", (req, res) => {
  res.json({ success: true, data: db.emergencyTypes });
});

app.get("/api/journals", (req, res) => {
  res.json({ success: true, data: db.historicalJournals });
});

// --- ADMIN DASHBOARD ROUTES ---
app.get("/api/dashboard/metrics", (req, res) => {
  const metrics = dashboardService.getOverviewMetrics();
  res.json({ success: true, data: metrics });
});

app.get("/api/dashboard/users", (req, res) => {
  const query = req.query.q as string;
  const users = dashboardService.getUsers(query);
  res.json({ success: true, data: users });
});

app.patch("/api/dashboard/users/:id/verify", (req, res) => {
  const updated = dashboardService.toggleUserVerification(req.params.id);
  if (!updated) return res.status(404).json({ success: false, error: "User not found" });
  res.json({ success: true, data: updated });
});

app.get("/api/dashboard/emergency-types", (req, res) => {
  const types = dashboardService.getEmergencyTypes();
  res.json({ success: true, data: types });
});

app.post("/api/dashboard/emergency-types", (req, res) => {
  const newType = dashboardService.createEmergencyType(req.body);
  res.status(201).json({ success: true, data: newType });
});

app.patch("/api/dashboard/emergency-types/:id/toggle", (req, res) => {
  const updated = dashboardService.toggleEmergencyType(req.params.id);
  if (!updated) return res.status(404).json({ success: false, error: "Type not found" });
  res.json({ success: true, data: updated });
});

app.get("/api/dashboard/subscriptions", (req, res) => {
  const subs = dashboardService.getSubscriptions();
  res.json({ success: true, data: subs });
});

// Start Server
server.listen(config.port, () => {
  console.log(`\n======================================================`);
  console.log(`🚨 SafeAlert Emergency Backend running on port ${config.port}`);
  console.log(`📡 WebSocket Gateway ready on ws://localhost:${config.port}`);
  console.log(`🩺 Health check: http://localhost:${config.port}/health`);
  console.log(`======================================================\n`);
});
