import { Module } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { DashboardController } from "./dashboard.controller";
import { CatalogController } from "./catalog.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [DashboardController, CatalogController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
