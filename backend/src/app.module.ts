import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AlertsModule } from "./modules/alerts/alerts.module";
import { ContactsModule } from "./modules/contacts/contacts.module";
import { ProfileModule } from "./modules/profile/profile.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { AlertsGateway } from "./gateways/alerts.gateway";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RealtimeModule,
    AuthModule,
    AlertsModule,
    ContactsModule,
    ProfileModule,
    DashboardModule,
  ],
  controllers: [HealthController],
  providers: [AlertsGateway],
})
export class AppModule {}
