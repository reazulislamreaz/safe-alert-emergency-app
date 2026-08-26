import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { Severity } from "@prisma/client";

export class CreateEmergencyTypeDto {
  @ApiProperty({ example: "Flood / Water Rescue" })
  @IsString()
  @MinLength(1)
  label!: string;

  @ApiPropertyOptional({ example: "FLOOD" })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiPropertyOptional({ enum: Severity, example: Severity.URGENT })
  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @ApiPropertyOptional({ example: "ShieldAlert" })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: "Rapid water rise or trapped occupants" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateEmergencyTypeDto {
  @ApiPropertyOptional({ example: "Flood / Water Rescue" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  label?: string;

  @ApiPropertyOptional({ example: "ShieldAlert" })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: "Rapid water rise or trapped occupants" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: Severity, example: Severity.HIGH })
  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
