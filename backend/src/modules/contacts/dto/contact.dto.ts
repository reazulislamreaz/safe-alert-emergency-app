import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class CreateGroupDto {
  @ApiPropertyOptional({ example: "usr-sarah-101" })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ example: "Close Friends" })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: "#3A67D5" })
  @IsOptional()
  @IsString()
  color?: string;
}

export class AddMemberDto {
  @ApiProperty({ example: "grp-family-01" })
  @IsString()
  groupId!: string;

  @ApiProperty({ example: "Alex Rivera" })
  @IsString()
  name!: string;

  @ApiProperty({ example: "+1 (555) 222-1111" })
  @IsString()
  phone!: string;

  @ApiProperty({ example: "Friend" })
  @IsString()
  relationship!: string;
}
