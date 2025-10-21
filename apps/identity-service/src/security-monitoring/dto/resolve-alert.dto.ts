import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ResolveAlertDto {
  @ApiProperty({
    description: "ID of the user resolving the alert",
    example: "user-admin-123",
  })
  @IsNotEmpty({ message: "Resolved by is required" })
  @IsString({ message: "Resolved by must be a string" })
  @MinLength(1, { message: "Resolved by cannot be empty" })
  @MaxLength(100, { message: "Resolved by cannot exceed 100 characters" })
  resolvedBy: string;

  @ApiPropertyOptional({
    description: "Optional notes about the resolution",
    example: "False positive - legitimate user activity verified",
  })
  @IsOptional()
  @IsString({ message: "Notes must be a string" })
  @MaxLength(1000, { message: "Notes cannot exceed 1000 characters" })
  notes?: string;
}
