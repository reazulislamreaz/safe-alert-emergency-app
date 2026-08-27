import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { DashboardLoginDto } from "./dto/dashboard-login.dto";
import { SendEmailOtpDto, SendOtpDto, VerifyEmailOtpDto, VerifyOtpDto } from "./dto/otp.dto";
import {
  ForgotPinDto,
  ResetPinDto,
  SetupPinDto,
  VerifyPinDto,
  VerifyPinResetDto,
  BiometricDto,
  BiometricLoginDto,
} from "./dto/pin.dto";
import { ForgotPasswordDto, ResetPasswordDto, VerifyResetOtpDto } from "./dto/password-reset.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../../config/env";
import { RACE_OPTIONS } from "./auth.constants";
import { isDashboardSession, tokenAudience } from "../../common/auth/dashboard-admin";

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
  @ApiOperation({ summary: "Register a citizen account (email required, phone optional)" })
  @ApiCreatedResponse({ description: "Account created; email OTP dispatched" })
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return {
      success: true,
      message: data.delivered
        ? "Account created successfully. Verification OTP sent to your email."
        : "Account created successfully. Verification OTP generated (email delivery not configured).",
      data,
    };
  }

  @Post("otp/email/send")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send a 6-digit email verification OTP (citizen registration)" })
  @ApiOkResponse({ description: "OTP generated and emailed when SMTP is configured" })
  async sendEmailOtp(@Body() dto: SendEmailOtpDto) {
    const data = await this.authService.sendEmailVerificationOtp(dto.email);
    return {
      success: true,
      message: data.delivered
        ? `Verification code sent to ${dto.email}`
        : "Verification code generated. Email delivery is not configured.",
      data,
    };
  }

  @Post("otp/email/verify")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify email OTP for citizen registration" })
  async verifyEmailOtp(@Body() dto: VerifyEmailOtpDto) {
    const data = await this.authService.verifyEmailOtp(dto.email, dto.code);
    return { success: true, data };
  }

  @Post("otp/send")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Legacy: send phone OTP (not used by citizen registration)" })
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
  @ApiOperation({ summary: "Legacy: verify phone OTP (not used by citizen registration)" })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const data = await this.authService.verifyPhoneOtp(dto.phone, dto.code);
    return { success: true, data };
  }

  @Post("pin/setup")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Set a mandatory 4-digit security PIN" })
  async setupPin(@Body() dto: SetupPinDto, @CurrentUser() user: JwtPayload) {
    const data = await this.authService.setupPin(user.sub, dto.pin);
    return { success: true, data };
  }

  @Post("biometric")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Register or disable Face ID for the current citizen" })
  async biometric(@Body() dto: BiometricDto, @CurrentUser() user: JwtPayload) {
    const data = await this.authService.setFaceId(user.sub, dto.enabled, dto.credentialId);
    return { success: true, data };
  }

  @Post("pin/forgot")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request a PIN-reset OTP by email (citizen)" })
  async forgotPin(@Body() dto: ForgotPinDto) {
    const data = await this.authService.requestPinReset(dto.email);
    return {
      success: true,
      message: data.delivered
        ? "If an account exists for this email, a verification code has been sent."
        : "Verification code generated. Email delivery is not configured.",
      data,
    };
  }

  @Post("pin/verify-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify PIN-reset OTP (email)" })
  async verifyPinResetOtp(@Body() dto: VerifyPinResetDto) {
    const data = await this.authService.verifyPinResetOtp(dto.email, dto.code);
    return { success: true, data };
  }

  @Post("pin/reset")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Set a new 4-digit PIN with a verified email OTP" })
  async resetPin(@Body() dto: ResetPinDto) {
    const data = await this.authService.resetPin(dto.email, dto.code, dto.newPin);
    return { success: true, data };
  }

  @Post("pin/verify")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Verify PIN for delete account / logout" })
  async verifyPin(@Body() dto: VerifyPinDto, @CurrentUser() user: JwtPayload) {
    const userId = isDashboardSession(user) && dto.userId ? dto.userId : user.sub;
    const data = await this.authService.verifyPin(userId, dto.pin);
    return { success: true, data };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Citizen login with email + 4-digit PIN (or password)" })
  @ApiUnauthorizedResponse({ description: "Invalid credentials" })
  @ApiForbiddenResponse({ description: "Super Admin must use dashboard login" })
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return { success: true, data };
  }

  @Post("login/biometric")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Citizen login with email + Face ID credential" })
  @ApiUnauthorizedResponse({ description: "Invalid Face ID credentials" })
  async loginBiometric(@Body() dto: BiometricLoginDto) {
    const data = await this.authService.loginWithBiometric(dto.email, dto.credentialId);
    return { success: true, data };
  }

  @Post("dashboard/login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Dashboard Super Admin login — designated Super Admin account only" })
  @ApiUnauthorizedResponse({ description: "Invalid credentials" })
  @ApiForbiddenResponse({ description: "Caller is not the designated Super Admin" })
  async dashboardLogin(@Body() dto: DashboardLoginDto) {
    const data = await this.authService.loginDashboard(dto);
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
  @ApiOperation({ summary: "Request a password-reset OTP sent by email" })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const data = await this.authService.requestPasswordReset(dto.email);
    return {
      success: true,
      message: data.delivered
        ? "If an account exists for this email, a verification code has been sent."
        : "Verification code generated. Email delivery is not configured.",
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
    const data = await this.authService.getMe(user.sub, tokenAudience(user));
    return { success: true, data };
  }
}
