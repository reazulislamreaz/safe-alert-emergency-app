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
import { LocationRequestService } from "./location-request.service";
import {
  CreateLocationRequestDto,
  RespondLocationRequestDto,
} from "./dto/location-request.dto";

@ApiTags("Location Requests")
@ApiBearerAuth("access-token")
@Controller("api/location-requests")
@UseGuards(JwtAuthGuard)
export class LocationRequestsController {
  constructor(private readonly service: LocationRequestService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Request location within a Family/Friends Safety Circle" })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateLocationRequestDto) {
    const data = await this.service.create(user.sub, dto);
    return { success: true, data };
  }

  @Get("inbox")
  @ApiOperation({ summary: "Incoming and outgoing location requests" })
  async inbox(@CurrentUser() user: JwtPayload) {
    const data = await this.service.inbox(user.sub);
    return { success: true, data };
  }

  @Post(":id/respond")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Approve or decline a location request" })
  async respond(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: RespondLocationRequestDto,
  ) {
    const data = await this.service.respond(user.sub, id, dto);
    return { success: true, data };
  }
}
