import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, MinLength } from "class-validator";

export class SendOtpDto {
  @ApiProperty({ example: "+1 (555) 234-5678" })
  @IsString()
  @MinLength(7, { message: "Valid phone number is required" })
  phone!: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: "+1 (555) 234-5678" })
  @IsString()
  @MinLength(7, { message: "Valid phone number is required" })
  phone!: string;

  @ApiProperty({ example: "123456", description: "Demo code for Sarah's phone is 123456" })
  @IsString()
  @Length(6, 6, { message: "Verification code must be 6 digits" })
  code!: string;
}
