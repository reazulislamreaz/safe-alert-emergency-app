import { Module } from "@nestjs/common";
import { ContactService } from "./contact.service";
import { ContactsController } from "./contacts.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [ContactsController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactsModule {}
