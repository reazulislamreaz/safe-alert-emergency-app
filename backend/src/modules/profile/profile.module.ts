import { Module } from "@nestjs/common";
import { ProfileService } from "./profile.service";
import { LegalController, ProfileController, SubscriptionsController } from "./profile.controller";
import { AuthModule } from "../auth/auth.module";
import { JobsModule } from "../jobs/jobs.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { UploadsModule } from "../uploads/uploads.module";

@Module({
  imports: [AuthModule, JobsModule, NotificationsModule, UploadsModule],
  controllers: [ProfileController, SubscriptionsController, LegalController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
