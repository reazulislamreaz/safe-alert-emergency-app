import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateLocationRequestDto {
  @ApiProperty({ example: "usr-target-01" })
  @IsString()
  targetUserId!: string;

  @ApiProperty({ example: "grp-family-01" })
  @IsString()
  groupId!: string;
}

export class RespondLocationRequestDto {
  @ApiProperty({ enum: ["APPROVE", "DECLINE"] })
  @IsString()
  @IsIn(["APPROVE", "DECLINE"])
  action!: "APPROVE" | "DECLINE";

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

  @ApiPropertyOptional({ example: "123 Main St" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;
}
