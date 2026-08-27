import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MinLength } from "class-validator";

export class UpdateLegalPageDto {
  @ApiProperty({ example: "Safety Circle is an emergency response platform..." })
  @IsString()
  @MinLength(1)
  body!: string;

  @ApiPropertyOptional({ example: "About Us" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;
}
