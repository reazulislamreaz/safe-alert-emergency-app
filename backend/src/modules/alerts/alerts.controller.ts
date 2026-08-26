import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { AlertService } from "./alert.service";
import {
  QuickResponseDto,
  ResolveAlertDto,
  SendAlertMessageDto,
  TelemetryDto,
  TriggerAlertDto,
  UpdateParticipantDto,
} from "./dto/alert.dto";
import { OptionalJwtGuard } from "../../common/guards/optional-jwt.guard";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../../config/env";

@ApiTags("Alerts")
@ApiBearerAuth("access-token")
@Controller("api/alerts")
@UseGuards(OptionalJwtGuard)
export class AlertsController {
  constructor(private readonly alertService: AlertService) {}

  @Get("home")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Home: SOS, status, recent activity, Create Emergency Alert" })
  async home(@CurrentUser() user: JwtPayload) {
    const data = await this.alertService.getHome(user.sub);
    return { success: true, data };
  }

  @Get("modes")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Alert Mode — Emergency vs Silent" })
  modes() {
    return { success: true, data: this.alertService.getModes() };
  }

  @Get("cancel-reasons")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Why are you Cancelling? — I'm Safe, False Alert, Test" })
  cancelReasons() {
    return { success: true, data: this.alertService.getCancelReasons() };
  }

  @Get("quick-responses")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Live call quick responses: Need Help, Send Location, I'm Safe" })
  quickResponses() {
    return { success: true, data: this.alertService.getQuickResponses() };
  }

  @Get("current")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Current broadcasting alert for the signed-in user" })
  async current(@CurrentUser() user: JwtPayload) {
    const data = await this.alertService.getCurrent(user.sub);
    return { success: true, data };
  }

  @Get("active")
  @ApiOperation({ summary: "List broadcasting SOS alerts" })
  async getActive() {
    const data = await this.alertService.getActiveAlerts();
    return { success: true, data };
  }

  @Post("trigger")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create Emergency Alert / Quick / SOS / Test — notify groups" })
  async trigger(@Body() dto: TriggerAlertDto, @CurrentUser() user: JwtPayload) {
    const isAdmin = user.role === "OPS_ADMIN" || user.role === "SUPER_ADMIN";
    const data = await this.alertService.triggerAlert({
      ...dto,
      userId: isAdmin && dto.userId ? dto.userId : user.sub,
    });
    return { success: true, data };
  }

  @Post("direct")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Direct Emergency Alert — SOS hold or Quick Emergency, skip confirmation",
  })
  async direct(@Body() dto: TriggerAlertDto, @CurrentUser() user: JwtPayload) {
    const isAdmin = user.role === "OPS_ADMIN" || user.role === "SUPER_ADMIN";
    const data = await this.alertService.triggerDirect({
      ...dto,
      userId: isAdmin && dto.userId ? dto.userId : user.sub,
    });
    return { success: true, data };
  }

  @Get(":id/live")
  @ApiOperation({ summary: "View Live Session — map, type, mode, responding contacts" })
  @ApiParam({ name: "id", example: "alt-active-991" })
  @ApiNotFoundResponse({ description: "Alert not found" })
  async live(@Param("id") id: string) {
    const data = await this.alertService.getLiveSession(id);
    return { success: true, data };
  }

  @Get(":id/call")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Start Group Video Call — Zeegocloud room + token" })
  @ApiParam({ name: "id", example: "alt-active-991" })
  async call(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    const data = await this.alertService.getCallSession(id, user.sub);
    return { success: true, data };
  }

  @Get(":id/messages")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Emergency group chat (Figma Message — Family, Online)" })
  @ApiParam({ name: "id", example: "alt-active-991" })
  @ApiQuery({ name: "groupId", required: false, example: "grp-family-01" })
  async messages(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Query("groupId") groupId?: string,
  ) {
    const data = await this.alertService.getMessages(id, user.sub, groupId);
    return { success: true, data };
  }

  @Post(":id/messages")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Send a group chat message" })
  @ApiParam({ name: "id", example: "alt-active-991" })
  async sendMessage(
    @Param("id") id: string,
    @Body() dto: SendAlertMessageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.alertService.sendMessage(id, user.sub, dto);
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

  @Post(":id/quick-response")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Need Help / Send Location / I'm Safe" })
  @ApiParam({ name: "id", example: "alt-active-991" })
  async quickResponse(
    @Param("id") id: string,
    @Body() dto: QuickResponseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.alertService.quickResponse(id, user.sub, dto);
    return { success: true, data };
  }

  @Post(":id/participants")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update a call participant (joined / calling)" })
  @ApiParam({ name: "id", example: "alt-active-991" })
  async participants(
    @Param("id") id: string,
    @Body() dto: UpdateParticipantDto,
  ) {
    const data = await this.alertService.updateParticipant(id, dto);
    return { success: true, data };
  }

  @Post(":id/cancel")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel Alert — I'm Safe, False Alert, or Test" })
  @ApiParam({ name: "id", example: "alt-active-991" })
  async cancel(
    @Param("id") id: string,
    @Body() dto: ResolveAlertDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.alertService.cancelAlert(
      id,
      user.sub,
      dto.reason,
      dto.notes,
      dto.pin,
    );
    return { success: true, data };
  }

  @Post(":id/resolve")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Resolve / cancel an alert (optional PIN)" })
  @ApiParam({ name: "id", example: "alt-active-991" })
  async resolve(
    @Param("id") id: string,
    @Body() dto: ResolveAlertDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.alertService.resolveAlert(
      id,
      dto.reason || "SAFE",
      dto.notes || "",
      dto.pin || "",
      user.sub,
    );
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
}
