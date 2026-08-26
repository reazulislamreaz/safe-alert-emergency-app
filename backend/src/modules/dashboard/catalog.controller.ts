import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { DashboardService } from "../dashboard/dashboard.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

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

  @Get("journals")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPS_ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Historical incident journals" })
  async journals() {
    const data = await this.dashboardService.getJournals();
    return { success: true, data };
  }
}
