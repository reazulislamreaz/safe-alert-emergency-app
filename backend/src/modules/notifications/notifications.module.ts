import { Module } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { NotificationsController } from "./notifications.controller";
import { PushService } from "./push.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationService, PushService],
  exports: [NotificationService, PushService],
})
export class NotificationsModule {}
