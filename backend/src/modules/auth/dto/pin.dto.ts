import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsOptional, IsString, Length, Matches, MinLength } from "class-validator";

export class BiometricDto {
  @ApiProperty({ example: true, description: "Face ID registered (client-side)" })
  @Type(() => Boolean)
  @IsBoolean()
  enabled!: boolean;
}

export class SetupPinDto {
  @ApiProperty({ example: "3", description: "1-digit to 4-digit PIN" })
  @IsString()
  @Matches(/^\d{1,4}$/, { message: "Security PIN must be 1 to 4 digits" })
  pin!: string;
}

export class ForgotPinDto {
  @ApiProperty({ example: "+1 (555) 234-5678" })
  @IsString()
  @MinLength(7, { message: "Valid phone number is required" })
  phone!: string;
}

export class VerifyPinResetDto {
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

export class ResetPinDto {
  @ApiProperty({ example: "+1 (555) 234-5678" })
  @IsString()
  @MinLength(7, { message: "Valid phone number is required" })
  phone!: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @Length(6, 6, { message: "Verification code must be 6 digits" })
  @Matches(/^\d{6}$/, { message: "Verification code must be 6 digits" })
  code!: string;

  @ApiProperty({ example: "3", description: "1-digit to 4-digit PIN" })
  @IsString()
  @Matches(/^\d{1,4}$/, { message: "Security PIN must be 1 to 4 digits" })
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
  @Matches(/^\d{1,4}$/, { message: "Security PIN must be 1 to 4 digits" })
  pin!: string;
}
