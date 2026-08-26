import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { DashboardService } from "../dashboard/dashboard.service";

@ApiTags("Catalog")
@Controller("api")
export class CatalogController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("emergency-types")
  @ApiOperation({ summary: "Public emergency type catalog" })
  async emergencyTypes() {
    const data = await this.dashboardService.getEmergencyTypes();
    return { success: true, data };
  }
}
