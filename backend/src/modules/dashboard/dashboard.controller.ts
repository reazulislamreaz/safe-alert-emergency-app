import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiNotFoundResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { DashboardService } from "./dashboard.service";
import { CreateEmergencyTypeDto } from "./dto/emergency-type.dto";

@ApiTags("Dashboard")
@Controller("api/dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("metrics")
  @ApiOperation({ summary: "Overview KPIs, subscription split, recent alerts" })
  async metrics() {
    const data = await this.dashboardService.getOverviewMetrics();
    return { success: true, data };
  }

  @Get("users")
  @ApiOperation({ summary: "List users (optional search)" })
  @ApiQuery({ name: "q", required: false, example: "sarah" })
  async users(@Query("q") query?: string) {
    const data = await this.dashboardService.getUsers(query);
    return { success: true, data };
  }

  @Patch("users/:id/verify")
  @ApiOperation({ summary: "Toggle user verification" })
  @ApiParam({ name: "id", example: "usr-sarah-101" })
  @ApiNotFoundResponse({ description: "User not found" })
  async toggleVerify(@Param("id") id: string) {
    const updated = await this.dashboardService.toggleUserVerification(id);
    if (!updated) {
      throw new NotFoundException("User not found");
    }
    return { success: true, data: updated };
  }

  @Get("emergency-types")
  @ApiOperation({ summary: "List emergency types for admin" })
  async emergencyTypes() {
    const data = await this.dashboardService.getEmergencyTypes();
    return { success: true, data };
  }

  @Post("emergency-types")
  @ApiOperation({ summary: "Create an emergency type" })
  async createEmergencyType(@Body() dto: CreateEmergencyTypeDto) {
    const data = await this.dashboardService.createEmergencyType(dto);
    return { success: true, data };
  }

  @Patch("emergency-types/:id/toggle")
  @ApiOperation({ summary: "Toggle emergency type active flag" })
  @ApiParam({ name: "id", example: "et-assault" })
  @ApiNotFoundResponse({ description: "Type not found" })
  async toggleEmergencyType(@Param("id") id: string) {
    const updated = await this.dashboardService.toggleEmergencyType(id);
    if (!updated) {
      throw new NotFoundException("Type not found");
    }
    return { success: true, data: updated };
  }

  @Get("subscriptions")
  @ApiOperation({ summary: "List subscription plans" })
  async subscriptions() {
    const data = await this.dashboardService.getSubscriptions();
    return { success: true, data };
  }
}
