import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class BystanderRelayDto {
  @ApiProperty({ example: "grp-family-01" })
  @IsString()
  groupId!: string;

  @ApiPropertyOptional({ example: "member-uuid", description: "ContactMember id" })
  @IsOptional()
  @IsString()
  targetMemberId?: string;

  @ApiPropertyOptional({ example: "+1 555 000 1111" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: "Miles is with me and needs help. Please call him." })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message!: string;

  @ApiPropertyOptional({ example: "alt-active-991" })
  @IsOptional()
  @IsString()
  alertId?: string;
}
