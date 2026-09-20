import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ContactService } from "./contact.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../../config/env";

@ApiTags("Contacts")
@Controller("api/contacts")
export class ContactReferralController {
  constructor(private readonly contactService: ContactService) {}

  @Get("referral/:token")
  @ApiOperation({ summary: "Resolve a referral/invite token (public)" })
  async resolve(@Param("token") token: string) {
    const data = await this.contactService.resolveReferralToken(token);
    return { success: true, data };
  }

  @Post("referral/:token/claim")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Claim a referral token after sign-up (authenticated)" })
  async claim(@Param("token") token: string, @CurrentUser() user: JwtPayload) {
    const data = await this.contactService.claimReferralToken(user.sub, token);
    return { success: true, data };
  }
}
