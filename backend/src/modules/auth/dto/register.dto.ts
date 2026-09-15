import { ApiProperty } from "@nestjs/swagger";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsString, Matches, MinLength } from "class-validator";

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

  @ApiProperty({
    example: "1234",
    description: "Citizen 4-digit PIN used as the account password",
  })
  @IsString()
  @Matches(/^\d{4}$/, { message: "Password must be an exactly 4-digit PIN" })
  password!: string;

  @ApiProperty({ example: "WHITE" })
  @IsString()
  @MinLength(1, { message: "Race is required" })
  race!: string;

  @ApiProperty({ example: "+1 (555) 987-6543" })
  @IsString()
  @MinLength(7, { message: "Invalid emergency contact phone number" })
  emergencyContactPhone!: string;

  @ApiProperty({ example: "1998-05-14T00:00:00.000Z" })
  @IsString()
  @MinLength(4, { message: "Date of birth is required" })
  dob!: string;

  @ApiProperty({ example: "New York, NY" })
  @IsString()
  @MinLength(1, { message: "Location is required" })
  location!: string;

  @ApiProperty({
    type: [String],
    example: ["https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300"],
  })
  @IsArray()
  @ArrayMinSize(3, { message: "Profile Photos * — 3/3 required" })
  @ArrayMaxSize(3, { message: "Profile Photos * — max 3" })
  @IsString({ each: true })
  profilePhotos!: string[];
}
