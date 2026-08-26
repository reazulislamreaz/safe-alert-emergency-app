import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { AlertMode } from "@prisma/client";

export class TriggerAlertDto {
  @ApiPropertyOptional({ example: "usr-sarah-101" })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: "et-assault" })
  @IsOptional()
  @IsString()
  emergencyTypeId?: string;

  @ApiPropertyOptional({ enum: AlertMode, example: AlertMode.EMERGENCY })
  @IsOptional()
  @IsEnum(AlertMode)
  mode?: AlertMode;

  @ApiPropertyOptional({ example: 40.712776 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -74.005974 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: "123 Main St, New York, NY 10001" })
  @IsOptional()
  @IsString()
  address?: string;
}

export class TelemetryDto {
  @ApiProperty({ example: 40.71285 })
  @Type(() => Number)
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: -74.00602 })
  @Type(() => Number)
  @IsNumber()
  longitude!: number;

  @ApiPropertyOptional({ example: 1.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  speed?: number;

  @ApiPropertyOptional({ example: 95 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  heading?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  accuracy?: number;

  @ApiPropertyOptional({ example: 84 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  batteryLevel?: number;
}

export class ResolveAlertDto {
  @ApiPropertyOptional({ enum: ["SAFE", "FALSE_ALARM", "TEST"], example: "SAFE" })
  @IsOptional()
  @IsString()
  reason?: "SAFE" | "FALSE_ALARM" | "TEST";

  @ApiPropertyOptional({ example: "Reached a safe location." })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: "1234", description: "User's 4-digit PIN" })
  @IsOptional()
  @IsString()
  pin?: string;

  @ApiPropertyOptional({ example: "usr-sarah-101" })
  @IsOptional()
  @IsString()
  userId?: string;
}
