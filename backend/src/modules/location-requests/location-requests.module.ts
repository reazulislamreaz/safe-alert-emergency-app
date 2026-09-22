import { Module } from "@nestjs/common";
import { LocationRequestService } from "./location-request.service";
import { LocationRequestsController } from "./location-requests.controller";
import { NotificationsModule } from "../notifications/notifications.module";
import { JobsModule } from "../jobs/jobs.module";

@Module({
  imports: [NotificationsModule, JobsModule],
  controllers: [LocationRequestsController],
  providers: [LocationRequestService],
  exports: [LocationRequestService],
})
export class LocationRequestsModule {}
