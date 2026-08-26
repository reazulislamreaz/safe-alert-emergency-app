import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length, Matches, MinLength } from "class-validator";

export class ForgotPasswordDto {
  @ApiProperty({ example: "admin@safealert.app" })
  @IsEmail({}, { message: "Please enter a valid email address" })
  email!: string;
}

export class VerifyResetOtpDto {
  @ApiProperty({ example: "admin@safealert.app" })
  @IsEmail({}, { message: "Please enter a valid email address" })
  email!: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @Length(6, 6, { message: "Verification code must be 6 digits" })
  @Matches(/^\d{6}$/, { message: "Verification code must be 6 digits" })
  code!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: "admin@safealert.app" })
  @IsEmail({}, { message: "Please enter a valid email address" })
  email!: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @Length(6, 6, { message: "Verification code must be 6 digits" })
  @Matches(/^\d{6}$/, { message: "Verification code must be 6 digits" })
  code!: string;

  @ApiProperty({ example: "adminpassword" })
  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters" })
  newPassword!: string;
}
