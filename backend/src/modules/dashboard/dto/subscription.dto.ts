import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: "Premium" })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ example: 5, description: "Monthly price in USD" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMonthly?: number;

  @ApiPropertyOptional({ example: ["SOS alerts", "Unlimited groups"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  maxContacts?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  maxGroups?: number;
}

export class UpdateSubscriptionPlanDto {
  @ApiPropertyOptional({ example: "Premium" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMonthly?: number;

  @ApiPropertyOptional({ example: ["SOS alerts"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  maxContacts?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  maxGroups?: number;
}
