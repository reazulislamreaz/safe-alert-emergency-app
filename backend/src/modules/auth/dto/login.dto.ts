import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({
    example: "sarah.johnson@example.com",
    description: "Citizen login email (preferred). Legacy emailOrPhone still accepted.",
  })
  @IsOptional()
  @IsEmail({}, { message: "Valid email address is required" })
  email?: string;

  @ApiPropertyOptional({
    example: "sarah.johnson@example.com",
    description: "Legacy field: email or phone. Prefer email.",
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: "Email or phone number is required" })
  emailOrPhone?: string;

  @ApiPropertyOptional({
    example: "3",
    description: "Citizen 1-digit PIN. Send this or password.",
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d$/, { message: "PIN must be exactly 1 digit" })
  pin?: string;

  @ApiPropertyOptional({
    example: "password123",
    description: "Citizen password login. Super Admin must use POST /api/auth/dashboard/login.",
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;
}
