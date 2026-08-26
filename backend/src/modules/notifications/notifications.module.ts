import { Module } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { NotificationsController } from "./notifications.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}
