import { Module } from "@nestjs/common";
import { AlertService } from "./alert.service";
import { AlertsController } from "./alerts.controller";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [AlertsController],
  providers: [AlertService],
  exports: [AlertService],
})
export class AlertsModule {}
