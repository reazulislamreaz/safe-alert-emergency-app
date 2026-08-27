import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsEmail, IsOptional, IsString, Length, Matches, MinLength } from "class-validator";

export class BiometricDto {
  @ApiProperty({ example: true, description: "Face ID registered (client-side)" })
  @Type(() => Boolean)
  @IsBoolean()
  enabled!: boolean;

  @ApiPropertyOptional({
    example: "faceid_credential_abc123",
    description: "WebAuthn / local Face ID credential id bound to this user",
  })
  @IsOptional()
  @IsString()
  @MinLength(4, { message: "Face ID credential id is required when enabling biometrics" })
  credentialId?: string;
}

export class SetupPinDto {
  @ApiProperty({ example: "3", description: "Exactly 1-digit PIN (0-9)" })
  @IsString()
  @Matches(/^\d$/, { message: "Security PIN must be exactly 1 digit" })
  pin!: string;
}

export class ForgotPinDto {
  @ApiProperty({ example: "jordan.lee@example.com" })
  @IsEmail({}, { message: "Valid email address is required" })
  email!: string;
}

export class VerifyPinResetDto {
  @ApiProperty({ example: "jordan.lee@example.com" })
  @IsEmail({}, { message: "Valid email address is required" })
  email!: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @Length(6, 6, { message: "Verification code must be 6 digits" })
  @Matches(/^\d{6}$/, { message: "Verification code must be 6 digits" })
  code!: string;
}

export class ResetPinDto {
  @ApiProperty({ example: "jordan.lee@example.com" })
  @IsEmail({}, { message: "Valid email address is required" })
  email!: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @Length(6, 6, { message: "Verification code must be 6 digits" })
  @Matches(/^\d{6}$/, { message: "Verification code must be 6 digits" })
  code!: string;

  @ApiProperty({ example: "3", description: "Exactly 1-digit PIN (0-9)" })
  @IsString()
  @Matches(/^\d$/, { message: "Security PIN must be exactly 1 digit" })
  newPin!: string;
}

export class VerifyPinDto {
  @ApiPropertyOptional({
    example: "usr-sarah-101",
    description: "Admin-only override. Citizens always verify their own PIN.",
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ example: "3" })
  @IsString()
  @Matches(/^\d$/, { message: "Security PIN must be exactly 1 digit" })
  pin!: string;
}

export class BiometricLoginDto {
  @ApiProperty({ example: "jordan.lee@example.com" })
  @IsEmail({}, { message: "Valid email address is required" })
  email!: string;

  @ApiProperty({
    example: "faceid_credential_abc123",
    description: "Credential id from Face ID / WebAuthn authentication",
  })
  @IsString()
  @MinLength(4, { message: "Face ID credential id is required" })
  credentialId!: string;
}
