import { Module } from "@nestjs/common";
import { ContactService } from "./contact.service";
import { ContactsController } from "./contacts.controller";
import { ContactReferralController } from "./contact-referral.controller";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [ContactsController, ContactReferralController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactsModule {}
