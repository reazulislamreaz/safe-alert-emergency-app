import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { ContactService } from "./contact.service";
import { AddMemberDto, CreateGroupDto } from "./dto/contact.dto";
import { OptionalJwtGuard } from "../../common/guards/optional-jwt.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../../config/env";

@ApiTags("Contacts")
@ApiBearerAuth("access-token")
@Controller("api/contacts")
@UseGuards(OptionalJwtGuard)
export class ContactsController {
  constructor(private readonly contactService: ContactService) {}

  @Get("groups")
  @ApiOperation({ summary: "List contact groups (with members)" })
  @ApiQuery({
    name: "userId",
    required: false,
    example: "usr-sarah-101",
    description: "Defaults to JWT subject, then Sarah's demo user",
  })
  async getGroups(@Query("userId") userId?: string, @CurrentUser() user?: JwtPayload) {
    const data = await this.contactService.getGroups(
      userId || user?.sub || "usr-sarah-101",
    );
    return { success: true, data };
  }

  @Post("groups")
  @ApiOperation({ summary: "Create a contact group" })
  async createGroup(@Body() dto: CreateGroupDto, @CurrentUser() user?: JwtPayload) {
    const data = await this.contactService.createGroup(
      dto.userId || user?.sub || "usr-sarah-101",
      dto.name,
      dto.color,
    );
    return { success: true, data };
  }

  @Post("members")
  @ApiOperation({ summary: "Add a member to a group" })
  async addMember(@Body() dto: AddMemberDto) {
    const data = await this.contactService.addMember(
      dto.groupId,
      dto.name,
      dto.phone,
      dto.relationship,
    );
    return { success: true, data };
  }

  @Delete("members/:id")
  @ApiOperation({ summary: "Remove a group member" })
  @ApiParam({ name: "id", example: "mem-06" })
  async deleteMember(@Param("id") id: string) {
    const success = await this.contactService.deleteMember(id);
    return { success };
  }
}
