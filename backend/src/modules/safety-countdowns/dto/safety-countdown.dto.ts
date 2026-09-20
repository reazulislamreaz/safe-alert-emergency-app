import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class StartSafetyCountdownDto {
  @ApiPropertyOptional({ example: "Walking to my car" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
