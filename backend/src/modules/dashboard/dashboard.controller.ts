import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { CreateEmergencyTypeDto, UpdateEmergencyTypeDto } from "./dto/emergency-type.dto";
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from "./dto/subscription.dto";
import { UpdateLegalPageDto } from "./dto/legal.dto";
import { DashboardService } from "./dashboard.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { DashboardAdminGuard } from "../../common/guards/dashboard-admin.guard";

@ApiTags("Dashboard")
@ApiBearerAuth("access-token")
@ApiUnauthorizedResponse({ description: "Authentication required" })
@ApiForbiddenResponse({ description: "USER tokens cannot access the Dashboard" })
@Controller("api/dashboard")
@UseGuards(JwtAuthGuard, DashboardAdminGuard)
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

  @Patch("emergency-types/:id")
  @ApiOperation({ summary: "Update an emergency type" })
  @ApiParam({ name: "id", example: "et-assault" })
  @ApiNotFoundResponse({ description: "Type not found" })
  async updateEmergencyType(@Param("id") id: string, @Body() dto: UpdateEmergencyTypeDto) {
    const updated = await this.dashboardService.updateEmergencyType(id, dto);
    if (!updated) {
      throw new NotFoundException("Type not found");
    }
    return { success: true, data: updated };
  }

  @Delete("emergency-types/:id")
  @ApiOperation({ summary: "Delete an unused emergency type" })
  @ApiParam({ name: "id", example: "et-assault" })
  @ApiNotFoundResponse({ description: "Type not found" })
  async deleteEmergencyType(@Param("id") id: string) {
    const deleted = await this.dashboardService.deleteEmergencyType(id);
    if (!deleted) {
      throw new NotFoundException("Type not found");
    }
    return { success: true, data: deleted };
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
  @ApiOperation({ summary: "List subscription plans and derived transactions" })
  async subscriptions() {
    const data = await this.dashboardService.getSubscriptions();
    return { success: true, data };
  }

  @Post("subscriptions")
  @ApiOperation({ summary: "Create a subscription plan" })
  async createSubscription(@Body() dto: CreateSubscriptionPlanDto) {
    const data = await this.dashboardService.createSubscriptionPlan(dto);
    return { success: true, data };
  }

  @Patch("subscriptions/:id")
  @ApiOperation({ summary: "Update a subscription plan" })
  @ApiParam({ name: "id", example: "plan-pro" })
  @ApiNotFoundResponse({ description: "Plan not found" })
  async updateSubscription(@Param("id") id: string, @Body() dto: UpdateSubscriptionPlanDto) {
    const updated = await this.dashboardService.updateSubscriptionPlan(id, dto);
    if (!updated) {
      throw new NotFoundException("Plan not found");
    }
    return { success: true, data: updated };
  }

  @Delete("subscriptions/:id")
  @ApiOperation({ summary: "Delete a subscription plan" })
  @ApiParam({ name: "id", example: "plan-pro" })
  @ApiNotFoundResponse({ description: "Plan not found" })
  async deleteSubscription(@Param("id") id: string) {
    const deleted = await this.dashboardService.deleteSubscriptionPlan(id);
    if (!deleted) {
      throw new NotFoundException("Plan not found");
    }
    return { success: true, data: deleted };
  }

  @Get("live-groups")
  @ApiOperation({ summary: "Live contact groups with SOS status and members" })
  async liveGroups() {
    const data = await this.dashboardService.getLiveGroups();
    return { success: true, data };
  }

  @Patch("legal/:slug")
  @ApiOperation({ summary: "Update a legal page (about, privacy, terms)" })
  @ApiParam({ name: "slug", example: "about", enum: ["about", "privacy", "terms"] })
  @ApiNotFoundResponse({ description: "Page not found" })
  async updateLegal(@Param("slug") slug: string, @Body() dto: UpdateLegalPageDto) {
    const data = await this.dashboardService.updateLegalPage(slug, dto);
    return { success: true, data };
  }

  @Get("journals")
  @ApiOperation({ summary: "Historical incident journals (all users)" })
  async journals() {
    const data = await this.dashboardService.getJournals();
    return { success: true, data };
  }
}
