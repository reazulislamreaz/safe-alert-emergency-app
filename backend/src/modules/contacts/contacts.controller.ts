import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { ContactService } from "./contact.service";
import {
  AddMemberDto,
  CreateContactDto,
  CreateGroupDto,
  InviteGroupDto,
  UpdateContactDto,
  UpdateGroupDto,
} from "./dto/contact.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../../config/env";

@ApiTags("Contacts")
@ApiBearerAuth("access-token")
@Controller("api/contacts")
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  @ApiOperation({ summary: "List address-book contacts (All Contacts tab)" })
  @ApiQuery({ name: "q", required: false, example: "james" })
  @ApiQuery({ name: "excludeGroupId", required: false, example: "grp-family-01" })
  @ApiQuery({ name: "excludeIds", required: false, example: "ct-emma-01,ct-james-01" })
  @ApiUnauthorizedResponse({ description: "Missing Bearer token" })
  async listContacts(
    @CurrentUser() user: JwtPayload,
    @Query("q") query?: string,
    @Query("excludeGroupId") excludeGroupId?: string,
    @Query("excludeIds") excludeIds?: string,
  ) {
    const data = await this.contactService.listContacts(user.sub, {
      query,
      excludeGroupId,
      excludeIds: excludeIds?.split(",").map((id) => id.trim()).filter(Boolean),
    });
    return { success: true, data };
  }

  @Get("users/search")
  @ApiOperation({ summary: "Search registered users by name or email (Add Contact)" })
  @ApiQuery({ name: "q", required: true, example: "sarah@gmail.com" })
  async searchUsers(@CurrentUser() user: JwtPayload, @Query("q") query?: string) {
    const data = await this.contactService.searchRegisteredUsers(user.sub, query || "");
    return { success: true, data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add a contact (Add Contact modal)" })
  async createContact(@CurrentUser() user: JwtPayload, @Body() dto: CreateContactDto) {
    const data = await this.contactService.createContact(user.sub, dto);
    return { success: true, data };
  }

  @Get("referral")
  @ApiOperation({ summary: "Referral share payload (Invite / Share referral link)" })
  async referral(@CurrentUser() user: JwtPayload) {
    const data = await this.contactService.getReferral(user.sub);
    return { success: true, data };
  }

  @Get("statuses")
  @ApiOperation({ summary: "Status dropdown values for Add Contact" })
  async statuses() {
    return { success: true, data: this.contactService.getStatuses() };
  }

  @Get("colors")
  @ApiOperation({ summary: "Group color picker presets (Create/Edit Group)" })
  async colors() {
    return { success: true, data: this.contactService.getColors() };
  }

  @Get("plan")
  @ApiOperation({ summary: "Current group/member plan limits" })
  async plan(@CurrentUser() user: JwtPayload) {
    const data = await this.contactService.getPlanUsage(user.sub);
    return { success: true, data };
  }

  @Get("groups")
  @ApiOperation({ summary: "List groups with plan limits (Groups tab)" })
  async getGroups(@CurrentUser() user: JwtPayload) {
    const data = await this.contactService.getGroups(user.sub);
    return { success: true, data };
  }

  @Post("groups")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a group (Save Group)" })
  async createGroup(@CurrentUser() user: JwtPayload, @Body() dto: CreateGroupDto) {
    const data = await this.contactService.createGroup(user.sub, dto);
    return { success: true, data };
  }

  @Get("groups/:id")
  @ApiOperation({ summary: "Get one group with members (Edit Group)" })
  @ApiParam({ name: "id", example: "grp-family-01" })
  async getGroup(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    const data = await this.contactService.getGroup(user.sub, id);
    return { success: true, data };
  }

  @Patch("groups/:id")
  @ApiOperation({ summary: "Update a group (Update Group)" })
  @ApiParam({ name: "id", example: "grp-family-01" })
  async updateGroup(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateGroupDto,
  ) {
    const data = await this.contactService.updateGroup(user.sub, id, dto);
    return { success: true, data };
  }

  @Delete("groups/:id")
  @ApiOperation({ summary: "Delete a group" })
  @ApiParam({ name: "id", example: "grp-family-01" })
  async deleteGroup(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    const data = await this.contactService.deleteGroup(user.sub, id);
    return { success: true, data };
  }

  @Post("groups/:id/invite")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Invite friends to a group (Groups Invite CTA)" })
  @ApiParam({ name: "id", example: "grp-family-01" })
  async invite(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: InviteGroupDto,
  ) {
    const data = await this.contactService.inviteToGroup(user.sub, id, dto);
    return { success: true, data };
  }

  @Get("invitations")
  @ApiOperation({ summary: "Pending group invitations for the signed-in user" })
  async invitations(@CurrentUser() user: JwtPayload) {
    const data = await this.contactService.listInvitations(user.sub);
    return { success: true, data };
  }

  @Post("invitations/:id/accept")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Accept & Join a group invitation" })
  @ApiParam({ name: "id", example: "inv-family-01" })
  async acceptInvite(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    const data = await this.contactService.acceptInvitation(user.sub, id);
    return { success: true, data };
  }

  @Post("invitations/:id/decline")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Decline a group invitation" })
  @ApiParam({ name: "id", example: "inv-family-01" })
  async declineInvite(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    const data = await this.contactService.declineInvitation(user.sub, id);
    return { success: true, data };
  }

  @Get("groups/:id/suggestions")
  @ApiOperation({ summary: "Suggested from contacts (Create/Edit Group)" })
  @ApiParam({ name: "id", example: "grp-family-01" })
  @ApiQuery({ name: "q", required: false, example: "james" })
  async suggestMembers(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Query("q") query?: string,
  ) {
    const data = await this.contactService.suggestMembers(user.sub, id, query);
    return { success: true, data };
  }

  @Post("groups/:id/members")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add a suggested or searched contact to a group" })
  @ApiParam({ name: "id", example: "grp-family-01" })
  async addGroupMember(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: AddMemberDto,
  ) {
    const data = await this.contactService.addMember(user.sub, id, dto);
    return { success: true, data };
  }

  @Delete("groups/:id/members/:memberId")
  @ApiOperation({ summary: "Remove a member chip from a group" })
  @ApiParam({ name: "id", example: "grp-family-01" })
  @ApiParam({ name: "memberId", example: "mem-02" })
  async deleteGroupMember(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Param("memberId") memberId: string,
  ) {
    const group = await this.contactService.getGroup(user.sub, id);
    const belongs = group.members.some((member) => member.id === memberId);
    if (!belongs) {
      throw new BadRequestException("That member is not in this group.");
    }
    const data = await this.contactService.deleteMember(user.sub, memberId);
    return { success: true, data };
  }

  @Post("members")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add a member to a group (contactId, name search, or name + phone)" })
  async addMember(@CurrentUser() user: JwtPayload, @Body() dto: AddMemberDto) {
    if (!dto.groupId) {
      throw new BadRequestException("groupId is required.");
    }
    const data = await this.contactService.addMember(user.sub, dto.groupId, dto);
    return { success: true, data };
  }

  @Delete("members/:id")
  @ApiOperation({ summary: "Remove a group member" })
  @ApiParam({ name: "id", example: "mem-05" })
  async deleteMember(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    const data = await this.contactService.deleteMember(user.sub, id);
    return { success: true, data };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one contact" })
  @ApiParam({ name: "id", example: "ct-james-01" })
  async getContact(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    const data = await this.contactService.getContact(user.sub, id);
    return { success: true, data };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a contact" })
  @ApiParam({ name: "id", example: "ct-james-01" })
  async updateContact(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateContactDto,
  ) {
    const data = await this.contactService.updateContact(user.sub, id, dto);
    return { success: true, data };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a contact" })
  @ApiParam({ name: "id", example: "ct-james-01" })
  async deleteContact(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    const data = await this.contactService.deleteContact(user.sub, id);
    return { success: true, data };
  }
}
