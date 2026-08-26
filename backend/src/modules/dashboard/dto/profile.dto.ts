import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateDashboardProfileDto {
  @ApiPropertyOptional({ example: "Admin User" })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "Name is required" })
  fullName?: string;

  @ApiPropertyOptional({ example: "admin@safealert.app" })
  @IsOptional()
  @IsEmail({}, { message: "Invalid email address" })
  email?: string;

  @ApiPropertyOptional({ example: "+1 (555) 000-0000" })
  @IsOptional()
  @IsString()
  @MinLength(7, { message: "Enter a valid phone number" })
  phone?: string;
}
