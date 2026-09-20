import { Module } from "@nestjs/common";
import { BystanderService } from "./bystander.service";
import { BystanderController } from "./bystander.controller";
import { NotificationsModule } from "../notifications/notifications.module";
import { AlertsModule } from "../alerts/alerts.module";

@Module({
  imports: [NotificationsModule, AlertsModule],
  controllers: [BystanderController],
  providers: [BystanderService],
})
export class BystanderModule {}
