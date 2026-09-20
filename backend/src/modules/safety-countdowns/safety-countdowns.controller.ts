import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../../config/env";
import { SafetyCountdownService } from "./safety-countdown.service";
import { StartSafetyCountdownDto } from "./dto/safety-countdown.dto";

@ApiTags("Safety Countdowns")
@ApiBearerAuth("access-token")
@Controller("api/safety-countdowns")
@UseGuards(JwtAuthGuard)
export class SafetyCountdownsController {
  constructor(private readonly service: SafetyCountdownService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Start a 30-minute safety countdown" })
  async start(@CurrentUser() user: JwtPayload, @Body() dto: StartSafetyCountdownDto) {
    const data = await this.service.start(user.sub, dto);
    return { success: true, data };
  }

  @Get("current")
  @ApiOperation({ summary: "Get the active safety countdown (server-authoritative)" })
  async current(@CurrentUser() user: JwtPayload) {
    const data = await this.service.current(user.sub);
    return { success: true, data };
  }

  @Post(":id/confirm-safe")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Confirm safe before countdown expires" })
  async confirmSafe(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    const data = await this.service.confirmSafe(user.sub, id);
    return { success: true, data };
  }

  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel an active safety countdown" })
  async cancel(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    const data = await this.service.cancel(user.sub, id);
    return { success: true, data };
  }
}
