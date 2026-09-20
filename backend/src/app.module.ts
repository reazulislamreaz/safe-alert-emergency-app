import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { MailModule } from "./mail/mail.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AlertsModule } from "./modules/alerts/alerts.module";
import { ContactsModule } from "./modules/contacts/contacts.module";
import { ProfileModule } from "./modules/profile/profile.module";
import { JournalsModule } from "./modules/journals/journals.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { SafetyCountdownsModule } from "./modules/safety-countdowns/safety-countdowns.module";
import { LocationRequestsModule } from "./modules/location-requests/location-requests.module";
import { MessagesModule } from "./modules/messages/messages.module";
import { BystanderModule } from "./modules/bystander/bystander.module";
import { AlertsGateway } from "./gateways/alerts.gateway";
import { HealthController } from "./health.controller";
import { ConfigController } from "./config.controller";
import { CoverageService } from "./common/auth/coverage.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../.env"],
    }),
    PrismaModule,
    MailModule,
    RealtimeModule,
    AuthModule,
    AlertsModule,
    ContactsModule,
    ProfileModule,
    JournalsModule,
    NotificationsModule,
    DashboardModule,
    UploadsModule,
    JobsModule,
    SafetyCountdownsModule,
    LocationRequestsModule,
    MessagesModule,
    BystanderModule,
  ],
  controllers: [HealthController, ConfigController],
  providers: [AlertsGateway, CoverageService],
})
export class AppModule {}
