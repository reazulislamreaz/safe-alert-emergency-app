import { Module } from "@nestjs/common";
import { LocationRequestService } from "./location-request.service";
import { LocationRequestsController } from "./location-requests.controller";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [LocationRequestsController],
  providers: [LocationRequestService],
  exports: [LocationRequestService],
})
export class LocationRequestsModule {}
