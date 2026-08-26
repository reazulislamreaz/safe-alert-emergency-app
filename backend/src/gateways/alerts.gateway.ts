import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { MessageType } from "@prisma/client";
import { Server, Socket } from "socket.io";
import { env, JwtPayload } from "../config/env";
import { AlertService } from "../modules/alerts/alert.service";
import { DashboardService } from "../modules/dashboard/dashboard.service";
import { RealtimeService } from "../realtime/realtime.service";

@WebSocketGateway({
  cors: {
    origin: env.corsOrigin,
    methods: ["GET", "POST"],
  },
})
export class AlertsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(AlertsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly realtime: RealtimeService,
    private readonly alertService: AlertService,
    private readonly dashboardService: DashboardService,
    private readonly jwt: JwtService,
  ) {}

  afterInit(server: Server): void {
    this.realtime.setServer(server);
    this.logger.log("WebSocket gateway ready");
  }

  handleConnection(socket: Socket): void {
    const token =
      (socket.handshake.auth?.token as string | undefined) ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (token) {
      try {
        socket.data.user = this.jwt.verify<JwtPayload>(token);
      } catch {
        this.logger.warn(`Handshake token invalid for client: ${socket.id}`);
      }
    }

    const user = socket.data?.user as JwtPayload | undefined;
    if (user?.sub) {
      socket.join(`user:${user.sub}`);
    }
    this.logger.log(
      `Client connected: ${socket.id}${user ? ` (User: ${user.email} [${user.role}])` : " (Guest/Demo)"}`,
    );
  }

  handleDisconnect(socket: Socket): void {
    this.logger.log(`Client disconnected: ${socket.id}`);
  }

  @SubscribeMessage("alert:join")
  async joinAlert(@ConnectedSocket() socket: Socket, @MessageBody() alertId: string) {
    socket.join(`room:${alertId}`);
    const alert = await this.alertService.getActiveAlertById(alertId);
    if (alert) {
      socket.emit("alert:state", alert);
    }
  }

  @SubscribeMessage("alert:telemetry")
  async telemetry(
    @MessageBody()
    data: {
      alertId: string;
      latitude: number;
      longitude: number;
      speed: number;
      heading: number;
      accuracy: number;
      batteryLevel: number;
    },
  ) {
    await this.alertService.updateTelemetry(data.alertId, {
      latitude: data.latitude,
      longitude: data.longitude,
      speed: data.speed,
      heading: data.heading,
      accuracy: data.accuracy,
      batteryLevel: data.batteryLevel,
    });
  }

  @SubscribeMessage("alert:message:send")
  async sendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { alertId: string; sender: string; text: string },
  ) {
    const user = socket.data?.user as JwtPayload | undefined;
    const senderName = user?.email ? user.email.split("@")[0] : data.sender;
    const updated = await this.alertService.addMessage(
      data.alertId,
      senderName,
      data.text,
      MessageType.USER,
      user?.sub,
    );
    if (updated) {
      this.server.to(`room:${data.alertId}`).emit("alert:messages:update", updated.liveMessages);
    }
  }

  @SubscribeMessage("alert:quick_response")
  async quickResponse(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { alertId: string; sender: string; action: string },
  ) {
    let text = "";
    if (data.action === "need_help") text = "🚨 I NEED IMMEDIATE HELP!";
    else if (data.action === "send_location") text = "📍 Live Location pin broadcasted.";
    else if (data.action === "im_safe") text = "✅ I am currently safe and secure.";

    const user = socket.data?.user as JwtPayload | undefined;
    const senderName = user?.email ? user.email.split("@")[0] : data.sender;
    const updated = await this.alertService.addMessage(
      data.alertId,
      senderName,
      text,
      MessageType.QUICK_REPLY,
      user?.sub,
    );
    if (updated) {
      this.server.to(`room:${data.alertId}`).emit("alert:messages:update", updated.liveMessages);
    }
  }

  @SubscribeMessage("admin:subscribe")
  async adminSubscribe(@ConnectedSocket() socket: Socket) {
    socket.join("room:admin");
    socket.emit("admin:metrics", await this.dashboardService.getOverviewMetrics());
  }
}
