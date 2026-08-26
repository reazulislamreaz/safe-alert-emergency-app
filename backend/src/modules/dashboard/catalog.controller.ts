import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { DashboardService } from "../dashboard/dashboard.service";

@ApiTags("Catalog")
@Controller("api")
export class CatalogController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("emergency-types")
  @ApiOperation({ summary: "Emergency Type grid (Assault, Medical, Fire, …)" })
  @ApiQuery({ name: "q", required: false, example: "fire" })
  async emergencyTypes(@Query("q") query?: string) {
    const data = await this.dashboardService.getEmergencyTypes({
      query,
      activeOnly: true,
    });
    return { success: true, data };
  }
}
