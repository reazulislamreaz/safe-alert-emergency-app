import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ProfileService } from "./profile.service";
import {
  CancelSubscriptionDto,
  DeleteAccountDto,
  SubscribeDto,
  UpdatePhotosDto,
  UpdateProfileDto,
} from "./dto/profile.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../../config/env";

@ApiTags("Profile")
@ApiBearerAuth("access-token")
@Controller("api/profile")
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: "Profile home — user, menu, photos, subscription summary" })
  async getProfile(@CurrentUser() user: JwtPayload) {
    const data = await this.profileService.getProfile(user.sub);
    return { success: true, data };
  }

  @Patch()
  @ApiOperation({ summary: "Update Profile (name, DOB, email, phone, address, emergency contact, photos)" })
  async updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    const data = await this.profileService.updateProfile(user.sub, dto);
    return { success: true, data };
  }

  @Post("photos")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Replace profile photos (max 3)" })
  async updatePhotos(@CurrentUser() user: JwtPayload, @Body() dto: UpdatePhotosDto) {
    const data = await this.profileService.updatePhotos(user.sub, dto.photos);
    return { success: true, data };
  }

  @Delete()
  @ApiOperation({ summary: "Delete Account — requires PIN" })
  async deleteAccount(@CurrentUser() user: JwtPayload, @Body() dto: DeleteAccountDto) {
    const data = await this.profileService.deleteAccount(user.sub, dto.pin);
    return { success: true, data };
  }

  @Get("subscription")
  @ApiOperation({ summary: "My Subscription — current plan, switch plan, cancel CTA" })
  async subscription(@CurrentUser() user: JwtPayload) {
    const data = await this.profileService.getCurrentSubscription(user.sub);
    return { success: true, data };
  }
}

@ApiTags("Subscriptions")
@ApiBearerAuth("access-token")
@Controller("api/subscriptions")
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly profileService: ProfileService) {}

  @Get("plans")
  @ApiOperation({ summary: "Choose Plan — Free $0 forever vs Premium $5.00/month" })
  async plans(@CurrentUser() user: JwtPayload) {
    const data = await this.profileService.getPlans(user.sub);
    return { success: true, data };
  }

  @Get("current")
  @ApiOperation({ summary: "Current subscription status" })
  async current(@CurrentUser() user: JwtPayload) {
    const data = await this.profileService.getCurrentSubscription(user.sub);
    return { success: true, data };
  }

  @Post("subscribe")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Start Premium (7-day free trial)" })
  async subscribe(@CurrentUser() user: JwtPayload, @Body() dto: SubscribeDto) {
    const data = await this.profileService.subscribe(user.sub, dto);
    return { success: true, data };
  }

  @Post("cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel Subscription with comments" })
  async cancel(@CurrentUser() user: JwtPayload, @Body() dto: CancelSubscriptionDto) {
    const data = await this.profileService.cancel(user.sub, dto);
    return { success: true, data };
  }
}

@ApiTags("Legal")
@Controller("api/legal")
export class LegalController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: "About Us, Privacy Policy, Terms & Conditions" })
  async list() {
    const data = await this.profileService.listLegal();
    return { success: true, data };
  }

  @Get(":slug")
  @ApiOperation({ summary: "Get one legal page" })
  @ApiParam({ name: "slug", example: "about", enum: ["about", "privacy", "terms"] })
  async get(@Param("slug") slug: string) {
    const data = await this.profileService.getLegal(slug);
    return { success: true, data };
  }
}
