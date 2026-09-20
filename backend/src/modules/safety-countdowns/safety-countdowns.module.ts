import { Module } from "@nestjs/common";
import { SafetyCountdownService } from "./safety-countdown.service";
import { SafetyCountdownsController } from "./safety-countdowns.controller";
import { JobsModule } from "../jobs/jobs.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [JobsModule, NotificationsModule],
  controllers: [SafetyCountdownsController],
  providers: [SafetyCountdownService],
  exports: [SafetyCountdownService],
})
export class SafetyCountdownsModule {}
