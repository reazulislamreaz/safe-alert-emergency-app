import express from "express";
import http from "http";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import { config } from "./config/env.js";
import { db } from "./core/database.js";
import { authService } from "./modules/auth/auth.service.js";
import { authenticateJwt, requireRole } from "./modules/auth/auth.middleware.js";
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

// ============================================================================
// --- AUTHENTICATION & ONBOARDING ROUTES ---
// ============================================================================

/**
 * Register a new user (matches mobile profile setup screen)
 */
app.post("/api/auth/register", (req, res) => {
  try {
    const result = authService.register(req.body);
    res.status(201).json({
      success: true,
      message: "Account created successfully. Verification OTP dispatched.",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Send 6-digit phone verification OTP
 */
app.post("/api/auth/otp/send", (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: "Phone number is required." });
    }
    const result = authService.sendPhoneOtp(phone);
    res.json({
      success: true,
      message: `Verification code sent to ${phone}`,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Verify 6-digit phone verification OTP
 */
app.post("/api/auth/otp/verify", (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ success: false, error: "Phone and 6-digit code are required." });
    }
    const result = authService.verifyPhoneOtp(phone, code);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Set or update 4-digit security PIN
 */
app.post("/api/auth/pin/setup", (req, res) => {
  try {
    const { userId, pin } = req.body;
    if (!userId || !pin) {
      return res.status(400).json({ success: false, error: "User ID and 4-digit PIN are required." });
    }
    const result = authService.setupPin(userId, pin);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Verify PIN (De-escalation check for cancelling alerts / safe confirmation)
 */
app.post("/api/auth/pin/verify", (req, res) => {
  try {
    const { userId, pin } = req.body;
    const targetUserId = userId || req.user?.sub || "usr-sarah-101";
    const result = authService.verifyPin(targetUserId, pin);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Login endpoint (Email/Phone + PIN/Password for Citizens & Admins)
 */
app.post("/api/auth/login", (req, res) => {
  try {
    const result = authService.login(req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(401).json({ success: false, error: error.message });
  }
});

/**
 * Fetch authenticated user profile and active emergency data
 */
app.get("/api/auth/me", authenticateJwt, (req, res) => {
  try {
    const userId = req.user!.sub;
    const result = authService.getMe(userId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// ============================================================================
// --- ALERT ROUTES ---
// ============================================================================
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
      userId: userId || req.user?.sub || "usr-sarah-101",
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
      userId || req.user?.sub || "usr-sarah-101"
    );

    io.to(`room:${req.params.id}`).emit("alert:resolved", resolved);
    io.emit("admin:alert:resolved", resolved);

    res.json({ success: true, data: resolved });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================================
// --- CONTACT & GROUP ROUTES ---
// ============================================================================
app.get("/api/contacts/groups", (req, res) => {
  const userId = (req.query.userId as string) || req.user?.sub || "usr-sarah-101";
  const groups = contactService.getGroups(userId);
  res.json({ success: true, data: groups });
});

app.post("/api/contacts/groups", (req, res) => {
  const { userId, name, color } = req.body;
  const group = contactService.createGroup(userId || req.user?.sub || "usr-sarah-101", name, color);
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

// ============================================================================
// --- EMERGENCY TYPES & JOURNALS ---
// ============================================================================
app.get("/api/emergency-types", (req, res) => {
  res.json({ success: true, data: db.emergencyTypes });
});

app.get("/api/journals", (req, res) => {
  res.json({ success: true, data: db.historicalJournals });
});

// ============================================================================
// --- ADMIN DASHBOARD ROUTES ---
// ============================================================================
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
  console.log(`🔐 Auth system: Ready (JWT + OTP + RBAC + PIN verification)`);
  console.log(`======================================================\n`);
});
