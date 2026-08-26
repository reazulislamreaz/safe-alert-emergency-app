import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({
    example: "admin@safealert.app",
    description: "Email address or phone number",
  })
  @IsString()
  @MinLength(3, { message: "Email or phone number is required" })
  emailOrPhone!: string;

  @ApiPropertyOptional({
    example: "1234",
    description: "Citizen 4-digit PIN. Send this or password, not both required.",
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/, { message: "PIN must be 4 digits" })
  pin?: string;

  @ApiPropertyOptional({
    example: "adminpassword",
    description: "Admin / password login. Use adminpassword or opspassword for demo admins.",
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;
}
