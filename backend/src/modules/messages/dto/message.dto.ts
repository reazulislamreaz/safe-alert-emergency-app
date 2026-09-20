import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class StartConversationDto {
  @ApiProperty({ example: "usr-peer-01" })
  @IsString()
  peerUserId!: string;
}

export class SendDirectMessageDto {
  @ApiPropertyOptional({ example: "Are you OK?" })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  text?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiPropertyOptional({ enum: ["IMAGE", "VIDEO", "NONE"] })
  @IsOptional()
  @IsString()
  mediaType?: "IMAGE" | "VIDEO" | "NONE";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mimeType?: string;
}
