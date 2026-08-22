import { Server as SocketIOServer, Socket } from "socket.io";
import { alertService } from "../modules/alerts/alert.service.js";
import { dashboardService } from "../modules/dashboard/dashboard.service.js";

export function initSocketGateway(io: SocketIOServer) {
  io.on("connection", (socket: Socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Join specific emergency room
    socket.on("alert:join", (alertId: string) => {
      socket.join(`room:${alertId}`);
      const alert = alertService.getActiveAlertById(alertId);
      if (alert) {
        socket.emit("alert:state", alert);
      }
    });

    // Handle live GPS telemetry updates from distressed client
    socket.on(
      "alert:telemetry",
      (data: {
        alertId: string;
        latitude: number;
        longitude: number;
        speed: number;
        heading: number;
        accuracy: number;
        batteryLevel: number;
      }) => {
        const updated = alertService.updateTelemetry(data.alertId, {
          latitude: data.latitude,
          longitude: data.longitude,
          speed: data.speed,
          heading: data.heading,
          accuracy: data.accuracy,
          batteryLevel: data.batteryLevel,
        });

        if (updated) {
          io.to(`room:${data.alertId}`).emit("alert:telemetry:update", {
            alertId: data.alertId,
            location: updated.location,
            latestPoint:
              updated.telemetryHistory[updated.telemetryHistory.length - 1],
          });

          // Also broadcast to admin monitoring room
          io.to("room:admin").emit("admin:alert:telemetry", {
            alertId: data.alertId,
            location: updated.location,
          });
        }
      }
    );

    // Live chat message in emergency call
    socket.on(
      "alert:message:send",
      (data: { alertId: string; sender: string; text: string }) => {
        const updated = alertService.addMessage(
          data.alertId,
          data.sender,
          data.text,
          "USER"
        );
        if (updated) {
          io.to(`room:${data.alertId}`).emit(
            "alert:messages:update",
            updated.liveMessages
          );
        }
      }
    );

    // Quick response trigger ("Need Help", "Send Location", "I'm Safe")
    socket.on(
      "alert:quick_response",
      (data: { alertId: string; sender: string; action: string }) => {
        let text = "";
        if (data.action === "need_help") text = "🚨 I NEED IMMEDIATE HELP!";
        else if (data.action === "send_location")
          text = "📍 Live Location pin broadcasted.";
        else if (data.action === "im_safe")
          text = "✅ I am currently safe and secure.";

        const updated = alertService.addMessage(
          data.alertId,
          data.sender,
          text,
          "QUICK_REPLY"
        );
        if (updated) {
          io.to(`room:${data.alertId}`).emit(
            "alert:messages:update",
            updated.liveMessages
          );
        }
      }
    );

    // Admin dashboard room subscription
    socket.on("admin:subscribe", () => {
      socket.join("room:admin");
      socket.emit("admin:metrics", dashboardService.getOverviewMetrics());
    });

    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });
}
