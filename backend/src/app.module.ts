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
import { AlertsGateway } from "./gateways/alerts.gateway";
import { HealthController } from "./health.controller";
import { ConfigController } from "./config.controller";

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
  ],
  controllers: [HealthController, ConfigController],
  providers: [AlertsGateway],
})
export class AppModule {}
