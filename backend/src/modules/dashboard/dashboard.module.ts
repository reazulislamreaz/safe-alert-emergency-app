import { Module } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { DashboardController } from "./dashboard.controller";
import { CatalogController } from "./catalog.controller";

@Module({
  controllers: [DashboardController, CatalogController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
