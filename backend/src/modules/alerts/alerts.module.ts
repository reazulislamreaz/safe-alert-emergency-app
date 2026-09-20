import { Module, forwardRef } from "@nestjs/common";
import { AlertService } from "./alert.service";
import { AlertsController } from "./alerts.controller";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { JobsModule } from "../jobs/jobs.module";

@Module({
  imports: [AuthModule, NotificationsModule, forwardRef(() => JobsModule)],
  controllers: [AlertsController],
  providers: [AlertService],
  exports: [AlertService],
})
export class AlertsModule {}
