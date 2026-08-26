import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class PresignUploadDto {
  @ApiProperty({ example: "image/jpeg" })
  @IsString()
  contentType!: string;

  @ApiPropertyOptional({ example: "profile.jpg" })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  fileName?: string;
}
