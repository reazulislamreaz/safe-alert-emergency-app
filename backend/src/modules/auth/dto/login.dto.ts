import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({
    example: "sarah.johnson@example.com",
    description: "Email address or phone number",
  })
  @IsString()
  @MinLength(3, { message: "Email or phone number is required" })
  emailOrPhone!: string;

  @ApiPropertyOptional({
    example: "3",
    description: "Citizen PIN (1 to 4 digits). Send this or password, not both required.",
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,4}$/, { message: "PIN must be 1 to 4 digits" })
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
