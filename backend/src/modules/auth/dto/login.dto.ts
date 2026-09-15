import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({
    example: "colero1040@dd2car.com",
    description: "Citizen login email",
  })
  @IsEmail({}, { message: "Valid email address is required" })
  email!: string;

  @ApiProperty({
    example: "1234",
    description: "Citizen account password (4-digit PIN from registration)",
  })
  @IsString()
  @MinLength(4, { message: "Password is required" })
  password!: string;
}
