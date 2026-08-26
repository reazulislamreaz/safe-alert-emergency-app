import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
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
import { ForgotPinDto, ResetPinDto, SetupPinDto, VerifyPinDto, VerifyPinResetDto, BiometricDto } from "./dto/pin.dto";
import { ForgotPasswordDto, ResetPasswordDto, VerifyResetOtpDto } from "./dto/password-reset.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../../config/env";
import { RACE_OPTIONS } from "./auth.constants";

@ApiTags("Auth")
@Controller("api/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("races")
  @ApiOperation({ summary: "Race(Optional) dropdown for Create Account / Edit Profile" })
  races() {
    return {
      success: true,
      data: {
        label: "Race(Optional)",
        options: RACE_OPTIONS.map((item) => ({ ...item })),
      },
    };
  }

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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Set or update a 4-digit security PIN" })
  async setupPin(@Body() dto: SetupPinDto, @CurrentUser() user: JwtPayload) {
    const data = await this.authService.setupPin(user.sub, dto.pin);
    return { success: true, data };
  }

  @Post("biometric")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Face ID registered / skip for now" })
  async biometric(@Body() dto: BiometricDto, @CurrentUser() user: JwtPayload) {
    const data = await this.authService.setFaceId(user.sub, dto.enabled);
    return { success: true, data };
  }

  @Post("pin/forgot")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request a PIN-reset OTP by phone" })
  async forgotPin(@Body() dto: ForgotPinDto) {
    const data = await this.authService.requestPinReset(dto.phone);
    return {
      success: true,
      message: "If an account exists for this phone, a verification code has been sent.",
      data,
    };
  }

  @Post("pin/verify-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify PIN-reset OTP" })
  async verifyPinResetOtp(@Body() dto: VerifyPinResetDto) {
    const data = await this.authService.verifyPinResetOtp(dto.phone, dto.code);
    return { success: true, data };
  }

  @Post("pin/reset")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Set a new 4-digit PIN with a verified OTP" })
  async resetPin(@Body() dto: ResetPinDto) {
    const data = await this.authService.resetPin(dto.phone, dto.code, dto.newPin);
    return { success: true, data };
  }

  @Post("pin/verify")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Verify PIN for delete account / logout" })
  async verifyPin(@Body() dto: VerifyPinDto, @CurrentUser() user: JwtPayload) {
    const isAdmin = user.role === "OPS_ADMIN" || user.role === "SUPER_ADMIN";
    const userId = isAdmin && dto.userId ? dto.userId : user.sub;
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

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Log out — invalidate the current session token" })
  async logout(@Headers("authorization") authorization?: string) {
    const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
    const data = await this.authService.logout(token);
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
