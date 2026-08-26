import { Module } from "@nestjs/common";
import { ContactService } from "./contact.service";
import { ContactsController } from "./contacts.controller";

@Module({
  controllers: [ContactsController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactsModule {}
