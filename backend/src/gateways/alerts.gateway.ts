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
import { Role } from "@prisma/client";
import { Server, Socket } from "socket.io";
import { env, JwtAudience, JwtPayload } from "../config/env";
import { isDashboardSession } from "../common/auth/dashboard-admin";
import { PrismaService } from "../prisma/prisma.service";
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
      socket.join("presence");
      this.realtime.markOnline(socket.id, user.sub, user.phone);
    }
    this.logger.log(
      `Client connected: ${socket.id}${user ? ` (User: ${user.email} [${user.role}])` : " (Guest/Demo)"}`,
    );
  }

  handleDisconnect(socket: Socket): void {
    this.realtime.markOffline(socket.id);
    this.logger.log(`Client disconnected: ${socket.id}`);
  }

  @SubscribeMessage("alert:join")
  async joinAlert(@ConnectedSocket() socket: Socket, @MessageBody() alertId: string) {
    const user = socket.data?.user as JwtPayload | undefined;
    if (!user?.sub || !alertId) {
      return;
    }
    try {
      const alert = await this.alertService.getResponderView(alertId, user.sub);
      socket.join(`room:${alertId}`);
      socket.emit("alert:state", alert);
    } catch {
      this.logger.warn(`alert:join denied for ${socket.id} on ${alertId}`);
    }
  }

  @SubscribeMessage("alert:telemetry")
  async telemetry(
    @ConnectedSocket() socket: Socket,
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
    const user = socket.data?.user as JwtPayload | undefined;
    if (!user?.sub) {
      return;
    }
    try {
      await this.alertService.updateTelemetry(data.alertId, user.sub, {
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed,
        heading: data.heading,
        accuracy: data.accuracy,
        batteryLevel: data.batteryLevel,
      });
    } catch {
      this.logger.warn(`alert:telemetry denied for ${socket.id}`);
    }
  }

  @SubscribeMessage("alert:message:send")
  async sendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { alertId: string; sender: string; text: string; groupId?: string },
  ) {
    const user = socket.data?.user as JwtPayload | undefined;
    if (!user?.sub) {
      return;
    }
    try {
      await this.alertService.sendMessage(data.alertId, user.sub, {
        text: data.text,
        groupId: data.groupId,
      });
    } catch {
      this.logger.warn(`alert:message:send denied for ${socket.id}`);
    }
  }

  @SubscribeMessage("alert:quick_response")
  async quickResponse(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { alertId: string; sender: string; action: string },
  ) {
    const user = socket.data?.user as JwtPayload | undefined;
    if (!user?.sub) {
      return;
    }
    try {
      await this.alertService.quickResponse(data.alertId, user.sub, { action: data.action });
    } catch {
      this.logger.warn(`alert:quick_response denied for ${socket.id}`);
    }
  }

  @SubscribeMessage("admin:subscribe")
  async adminSubscribe(@ConnectedSocket() socket: Socket) {
    const user = socket.data?.user as JwtPayload | undefined;
    if (user?.role !== Role.OPS_ADMIN && user?.role !== Role.SUPER_ADMIN) {
      this.logger.warn(`admin:subscribe denied for ${socket.id}`);
      return;
    }
    socket.join("room:admin");
    socket.emit("admin:metrics", await this.dashboardService.getOverviewMetrics());
  }
}
