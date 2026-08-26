import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MinLength } from "class-validator";

export class CreateJournalDto {
  @ApiPropertyOptional({ example: "Was followed home from the subway. Got home safely" })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "Describe the incident or update." })
  body?: string;

  @ApiPropertyOptional({ description: "Alias of body (Figma composer)" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @ApiPropertyOptional({
    example: "Incident",
    description: "Incident | Test | Update (defaults to Update)",
  })
  @IsOptional()
  @IsString()
  type?: string;
}

export class UpdateJournalDto {
  @ApiPropertyOptional({ example: "Was followed home from the subway. Got home safely" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: "Update" })
  @IsOptional()
  @IsString()
  type?: string;
}
