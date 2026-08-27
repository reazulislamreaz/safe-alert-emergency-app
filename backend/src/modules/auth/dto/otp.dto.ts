import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, Length, Matches, MinLength } from "class-validator";

export class SendEmailOtpDto {
  @ApiProperty({ example: "jordan.lee@example.com" })
  @IsEmail({}, { message: "Valid email address is required" })
  email!: string;
}

export class VerifyEmailOtpDto {
  @ApiProperty({ example: "jordan.lee@example.com" })
  @IsEmail({}, { message: "Valid email address is required" })
  email!: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @Length(6, 6, { message: "Verification code must be 6 digits" })
  @Matches(/^\d{6}$/, { message: "Verification code must be 6 digits" })
  code!: string;
}

/** @deprecated Phone OTP is no longer used for citizen registration. Kept for API compatibility. */
export class SendOtpDto {
  @ApiProperty({ example: "+1 (555) 234-5678" })
  @IsString()
  @MinLength(7, { message: "Valid phone number is required" })
  phone!: string;
}

/** @deprecated Phone OTP is no longer used for citizen registration. Kept for API compatibility. */
export class VerifyOtpDto {
  @ApiProperty({ example: "+1 (555) 234-5678" })
  @IsString()
  @MinLength(7, { message: "Valid phone number is required" })
  phone!: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @Length(6, 6, { message: "Verification code must be 6 digits" })
  @Matches(/^\d{6}$/, { message: "Verification code must be 6 digits" })
  code!: string;
}
