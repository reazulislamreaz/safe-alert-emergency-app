import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../../config/env";
import { BystanderService } from "./bystander.service";
import { BystanderRelayDto } from "./dto/bystander.dto";

@ApiTags("Bystander")
@ApiBearerAuth("access-token")
@Controller("api/bystander")
@UseGuards(JwtAuthGuard)
export class BystanderController {
  constructor(private readonly service: BystanderService) {}

  @Post("relay")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Send a one-time bystander-assisted message to a Safety Circle contact",
  })
  async relay(@CurrentUser() user: JwtPayload, @Body() dto: BystanderRelayDto) {
    const data = await this.service.relay(user.sub, dto);
    return { success: true, data };
  }
}
