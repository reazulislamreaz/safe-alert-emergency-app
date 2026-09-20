import { Module, forwardRef } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { JobsService } from "./jobs.service";
import { AlertsModule } from "../alerts/alerts.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    forwardRef(() => AlertsModule),
    NotificationsModule,
  ],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
