import { Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { NotificationService } from "./notification.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../../config/env";

@ApiTags("Notifications")
@ApiBearerAuth("access-token")
@Controller("api/notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: "Notification inbox — search, empty 'No Notification Yet'" })
  @ApiQuery({ name: "q", required: false, example: "alert" })
  @ApiQuery({ name: "limit", required: false, example: 20 })
  async list(
    @CurrentUser() user: JwtPayload,
    @Query("q") query?: string,
    @Query("limit") limit?: string,
  ) {
    const parsed = limit ? Number.parseInt(limit, 10) : 20;
    const data = await this.notificationService.list(
      user.sub,
      query,
      Number.isFinite(parsed) ? parsed : 20,
    );
    return { success: true, data };
  }

  @Post("read-all")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mark all notifications read" })
  async readAll(@CurrentUser() user: JwtPayload) {
    const data = await this.notificationService.markAllRead(user.sub);
    return { success: true, data };
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark one notification read" })
  @ApiParam({ name: "id", example: "ntf-direct-01" })
  async read(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    const data = await this.notificationService.markRead(user.sub, id);
    return { success: true, data };
  }
}
