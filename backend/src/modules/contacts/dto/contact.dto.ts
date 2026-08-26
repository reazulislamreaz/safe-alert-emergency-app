import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString, MinLength } from "class-validator";

export class AddMemberDto {
  @ApiPropertyOptional({ example: "grp-family-01" })
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiPropertyOptional({ example: "ct-james-01", description: "Existing address-book contact" })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({
    example: "James Johnson",
    description: "Match an existing contact by name (Create/Edit Group search + Add)",
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "+1 (555) 222-1111" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: "Friend" })
  @IsOptional()
  @IsString()
  relationship?: string;
}

export class CreateContactDto {
  @ApiProperty({ example: "James Johnson" })
  @IsString()
  @MinLength(2, { message: "Contact name is required" })
  name!: string;

  @ApiPropertyOptional({
    example: "Father",
    description: "Relationship / Status dropdown (Father, Sister, Friend, Colleague, Neighbor)",
  })
  @IsOptional()
  @IsString()
  relationship?: string;

  @ApiPropertyOptional({ example: "Father", description: "Alias for relationship (Figma Status field)" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ example: "+1 (555) 111-2222" })
  @IsString()
  @MinLength(7, { message: "Enter a valid phone number" })
  phone!: string;

  @ApiPropertyOptional({ example: "grp-family-01" })
  @IsOptional()
  @IsString()
  groupId?: string;
}

export class UpdateContactDto {
  @ApiPropertyOptional({ example: "James Johnson" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: "Father" })
  @IsOptional()
  @IsString()
  relationship?: string;

  @ApiPropertyOptional({ example: "Father" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: "+1 (555) 111-2222" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: "grp-family-01" })
  @IsOptional()
  @IsString()
  groupId?: string;
}

export class CreateGroupDto {
  @ApiProperty({ example: "Family" })
  @IsString()
  @MinLength(1, { message: "Group name is required" })
  name!: string;

  @ApiPropertyOptional({ example: "#3A67D5" })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ["ct-james-01"],
    description: "Contact IDs to add as members (capped by plan, 5 on Free)",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];
}

export class UpdateGroupDto {
  @ApiPropertyOptional({ example: "Family" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: "#3A67D5" })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ type: [String], example: ["ct-james-01"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];
}
