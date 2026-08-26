import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class DashboardLoginDto {
  @ApiProperty({ example: "admin@safealert.app" })
  @IsEmail({}, { message: "A valid admin email is required." })
  email!: string;

  @ApiProperty({ example: "adminpassword" })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters." })
  password!: string;
}
