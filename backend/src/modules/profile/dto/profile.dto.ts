import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayMaxSize, IsArray, IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { PROFILE_PHOTO_LIMIT } from "../profile.constants";

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: "Sarah Johnson" })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "Name is required" })
  fullName?: string;

  @ApiPropertyOptional({ example: "1998-05-14" })
  @IsOptional()
  @IsString()
  dob?: string;

  @ApiPropertyOptional({ example: "sarah.johnson@example.com" })
  @IsOptional()
  @IsEmail({}, { message: "Invalid email address" })
  email?: string;

  @ApiPropertyOptional({ example: "+1 (555) 234-5678" })
  @IsOptional()
  @IsString()
  @MinLength(7, { message: "Enter a valid phone number" })
  phone?: string;

  @ApiPropertyOptional({ example: "New York, NY", description: "Address field" })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: "White" })
  @IsOptional()
  @IsString()
  race?: string;

  @ApiPropertyOptional({ example: "James Johnson" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: "+1 (555) 987-6543" })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ example: "Father" })
  @IsOptional()
  @IsString()
  emergencyContactRelation?: string;

  @ApiPropertyOptional({
    type: [String],
    description: "Up to 3 profile photos (Figma 0/3 required)",
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(PROFILE_PHOTO_LIMIT)
  @IsString({ each: true })
  profilePhotos?: string[];

  @ApiPropertyOptional({ example: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" })
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class UpdatePhotosDto {
  @ApiProperty({
    type: [String],
    example: ["https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300"],
  })
  @IsArray()
  @ArrayMaxSize(PROFILE_PHOTO_LIMIT)
  @IsString({ each: true })
  photos!: string[];
}

export class DeleteAccountDto {
  @ApiProperty({ example: "4821", description: "Confirm with the account 4-digit PIN" })
  @IsString()
  @Matches(/^\d{4}$/, { message: "PIN must be exactly 4 digits" })
  pin!: string;
}

export class SubscribeDto {
  @ApiPropertyOptional({ example: "plan-pro", description: "Defaults to Premium" })
  @IsOptional()
  @IsString()
  planId?: string;
}

export class CancelSubscriptionDto {
  @ApiPropertyOptional({ example: "Too expensive" })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comments?: string;

  @ApiPropertyOptional({ example: "Too expensive", description: "Alias of comments" })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;

  @ApiPropertyOptional({ example: "Too expensive", description: "Alias of comments" })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feedback?: string;
}
