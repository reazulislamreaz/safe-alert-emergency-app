import { Module } from "@nestjs/common";
import { JournalService } from "./journal.service";
import { JournalsController } from "./journals.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [JournalsController],
  providers: [JournalService],
  exports: [JournalService],
})
export class JournalsModule {}
