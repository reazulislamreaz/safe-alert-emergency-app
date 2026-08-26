import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEmail, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "Jordan Lee" })
  @IsString()
  @MinLength(2, { message: "Full name must be at least 2 characters" })
  fullName!: string;

  @ApiProperty({ example: "jordan.lee@example.com" })
  @IsEmail({}, { message: "Invalid email address" })
  email!: string;

  @ApiProperty({ example: "+1 (555) 321-0987" })
  @IsString()
  @MinLength(7, { message: "Invalid phone number format" })
  phone!: string;

  @ApiPropertyOptional({ example: "1998-05-14" })
  @IsOptional()
  @IsString()
  dob?: string;

  @ApiPropertyOptional({ example: "White" })
  @IsOptional()
  @IsString()
  race?: string;

  @ApiPropertyOptional({ example: "New York, NY" })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: "James Johnson" })
  @IsString()
  @MinLength(2, { message: "Emergency contact name required" })
  emergencyContactName!: string;

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
    example: ["https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  profilePhotos?: string[];

  @ApiPropertyOptional({ example: "1234", description: "4-digit de-escalation PIN" })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/, { message: "PIN must be a 4-digit number" })
  pin?: string;

  @ApiPropertyOptional({ example: "password123" })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters" })
  password?: string;
}
