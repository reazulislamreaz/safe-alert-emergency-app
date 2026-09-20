import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from "class-validator";

export class CreatePromoCodeDto {
  @ApiProperty({ example: "SAFE6MO" })
  @IsString()
  @MinLength(3)
  code!: string;

  @ApiProperty({ example: "Spring Safety Campaign" })
  @IsString()
  @MinLength(2)
  campaignName!: string;

  @ApiProperty({ enum: [6, 12], example: 6 })
  @Type(() => Number)
  @IsInt()
  @IsIn([6, 12])
  durationMonths!: 6 | 12;

  @ApiPropertyOptional({ example: 1, description: "1 = one-time use" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  maxRedemptions?: number;

  @ApiPropertyOptional({ example: "2026-12-31T23:59:59.000Z" })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdatePromoCodeDto {
  @ApiPropertyOptional({ example: "Spring Safety Campaign" })
  @IsOptional()
  @IsString()
  campaignName?: string;

  @ApiPropertyOptional({ enum: ["ACTIVE", "DISABLED", "EXPIRED"] })
  @IsOptional()
  @IsString()
  @IsIn(["ACTIVE", "DISABLED", "EXPIRED"])
  status?: "ACTIVE" | "DISABLED" | "EXPIRED";

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxRedemptions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;
}

export class RedeemPromoDto {
  @ApiProperty({ example: "SAFE6MO" })
  @IsString()
  @MinLength(3)
  code!: string;
}
