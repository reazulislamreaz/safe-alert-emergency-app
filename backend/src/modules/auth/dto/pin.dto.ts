import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches } from "class-validator";

export class SetupPinDto {
  @ApiProperty({ example: "usr-sarah-101" })
  @IsString()
  userId!: string;

  @ApiProperty({ example: "1234" })
  @IsString()
  @Matches(/^\d{4}$/, { message: "Security PIN must be exactly 4 digits" })
  pin!: string;
}

export class VerifyPinDto {
  @ApiPropertyOptional({
    example: "usr-sarah-101",
    description: "Defaults to the JWT subject, then Sarah's demo user.",
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ example: "1234" })
  @IsString()
  @Matches(/^\d{4}$/, { message: "Security PIN must be exactly 4 digits" })
  pin!: string;
}
