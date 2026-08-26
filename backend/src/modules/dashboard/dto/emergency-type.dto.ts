import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";
import { Severity } from "@prisma/client";

export class CreateEmergencyTypeDto {
  @ApiProperty({ example: "FLOOD" })
  @IsString()
  key!: string;

  @ApiProperty({ example: "Flood / Water Rescue" })
  @IsString()
  label!: string;

  @ApiProperty({ enum: Severity, example: Severity.HIGH })
  @IsEnum(Severity)
  severity!: Severity;

  @ApiProperty({ example: "Waves" })
  @IsString()
  icon!: string;

  @ApiProperty({ example: "Rapid water rise or trapped occupants" })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
