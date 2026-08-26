import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { AlertService } from "./alert.service";
import { ResolveAlertDto, TelemetryDto, TriggerAlertDto } from "./dto/alert.dto";
import { OptionalJwtGuard } from "../../common/guards/optional-jwt.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../../config/env";

@ApiTags("Alerts")
@ApiBearerAuth("access-token")
@Controller("api/alerts")
@UseGuards(OptionalJwtGuard)
export class AlertsController {
  constructor(private readonly alertService: AlertService) {}

  @Get("active")
  @ApiOperation({ summary: "List broadcasting SOS alerts" })
  async getActive() {
    const data = await this.alertService.getActiveAlerts();
    return { success: true, data };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one alert by id" })
  @ApiParam({ name: "id", example: "alt-active-991" })
  @ApiNotFoundResponse({ description: "Alert not found" })
  async getById(@Param("id") id: string) {
    const alert = await this.alertService.getActiveAlertById(id);
    if (!alert) {
      throw new NotFoundException("Alert not found");
    }
    return { success: true, data: alert };
  }

  @Post("trigger")
  @ApiOperation({ summary: "Trigger an SOS broadcast" })
  async trigger(@Body() dto: TriggerAlertDto, @CurrentUser() user?: JwtPayload) {
    const data = await this.alertService.triggerAlert({
      ...dto,
      userId: dto.userId || user?.sub || "usr-sarah-101",
    });
    return { success: true, data };
  }

  @Post(":id/telemetry")
  @ApiOperation({ summary: "Push a GPS / battery telemetry point" })
  @ApiParam({ name: "id", example: "alt-active-991" })
  @ApiNotFoundResponse({ description: "Alert not found" })
  async telemetry(@Param("id") id: string, @Body() dto: TelemetryDto) {
    const updated = await this.alertService.updateTelemetry(id, dto);
    if (!updated) {
      throw new NotFoundException("Alert not found");
    }
    return { success: true, data: updated };
  }

  @Post(":id/resolve")
  @ApiOperation({ summary: "Resolve an alert with the user's PIN" })
  @ApiParam({ name: "id", example: "alt-active-991" })
  async resolve(
    @Param("id") id: string,
    @Body() dto: ResolveAlertDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    const data = await this.alertService.resolveAlert(
      id,
      dto.reason || "SAFE",
      dto.notes || "",
      dto.pin || "",
      dto.userId || user?.sub || "usr-sarah-101",
    );
    return { success: true, data };
  }
}
