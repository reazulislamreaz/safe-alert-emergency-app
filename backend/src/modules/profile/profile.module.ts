import { Module } from "@nestjs/common";
import { ProfileService } from "./profile.service";
import { LegalController, ProfileController, SubscriptionsController } from "./profile.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [ProfileController, SubscriptionsController, LegalController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
