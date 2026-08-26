import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { SendOtpDto, VerifyOtpDto } from "./dto/otp.dto";
import { SetupPinDto, VerifyPinDto } from "./dto/pin.dto";
import { ForgotPasswordDto, ResetPasswordDto, VerifyResetOtpDto } from "./dto/password-reset.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { OptionalJwtGuard } from "../../common/guards/optional-jwt.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../../config/env";

@ApiTags("Auth")
@Controller("api/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register a citizen account" })
  @ApiCreatedResponse({ description: "Account created; OTP dispatched" })
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return {
      success: true,
      message: "Account created successfully. Verification OTP dispatched.",
      data,
    };
  }

  @Post("otp/send")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send a 6-digit phone verification OTP" })
  @ApiOkResponse({ description: "OTP generated (returned in data for demo)" })
  async sendOtp(@Body() dto: SendOtpDto) {
    const data = await this.authService.sendPhoneOtp(dto.phone);
    return {
      success: true,
      message: `Verification code sent to ${dto.phone}`,
      data,
    };
  }

  @Post("otp/verify")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify phone OTP" })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const data = await this.authService.verifyPhoneOtp(dto.phone, dto.code);
    return { success: true, data };
  }

  @Post("pin/setup")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Set or update a 4-digit security PIN" })
  async setupPin(@Body() dto: SetupPinDto) {
    const data = await this.authService.setupPin(dto.userId, dto.pin);
    return { success: true, data };
  }

  @Post("pin/verify")
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Verify PIN (optional JWT)" })
  async verifyPin(@Body() dto: VerifyPinDto, @CurrentUser() user?: JwtPayload) {
    const userId = dto.userId || user?.sub || "usr-sarah-101";
    const data = await this.authService.verifyPin(userId, dto.pin);
    return { success: true, data };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email/phone + password or PIN" })
  @ApiUnauthorizedResponse({ description: "Invalid credentials" })
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return { success: true, data };
  }

  @Post("password/forgot")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request a password-reset OTP" })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const data = await this.authService.requestPasswordReset(dto.email);
    return {
      success: true,
      message: "If an account exists for this email, a verification code has been sent.",
      data,
    };
  }

  @Post("password/verify-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify password-reset OTP" })
  async verifyResetOtp(@Body() dto: VerifyResetOtpDto) {
    const data = await this.authService.verifyPasswordResetOtp(dto.email, dto.code);
    return { success: true, data };
  }

  @Post("password/reset")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Set a new password with a verified OTP" })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const data = await this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
    return { success: true, data };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Current user, groups, and active alerts" })
  @ApiUnauthorizedResponse({ description: "Missing or invalid Bearer token" })
  async me(@CurrentUser() user: JwtPayload) {
    const data = await this.authService.getMe(user.sub);
    return { success: true, data };
  }
}
