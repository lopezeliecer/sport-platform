import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  MinLength,
} from "class-validator";
import {
  AuditEventType,
  AuditSeverity,
} from "../../../../../libs/shared/common/src/audit/audit-log.interface";

export class ManualAuditLogDto {
  @ApiProperty({
    description: "Type of audit event",
    example: "DATA_CREATED",
    enum: AuditEventType,
  })
  @IsNotEmpty({ message: "Event type is required" })
  @IsEnum(AuditEventType, {
    message: "Event type must be a valid AuditEventType",
  })
  eventType: AuditEventType;

  @ApiProperty({
    description: "Severity level of the audit event",
    example: "MEDIUM",
    enum: AuditSeverity,
  })
  @IsNotEmpty({ message: "Severity is required" })
  @IsEnum(AuditSeverity, {
    message: "Severity must be a valid AuditSeverity",
  })
  severity: AuditSeverity;

  @ApiProperty({
    description: "Main message describing the audit event",
    example: "User created new training session",
    minLength: 1,
    maxLength: 500,
  })
  @IsNotEmpty({ message: "Message is required" })
  @IsString({ message: "Message must be a string" })
  @MinLength(1, { message: "Message cannot be empty" })
  @MaxLength(500, { message: "Message cannot exceed 500 characters" })
  message: string;

  @ApiPropertyOptional({
    description: "Detailed description of the audit event",
    example: "Training session created for swimming team with 10 participants",
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: "Description must be a string" })
  @MaxLength(1000, { message: "Description cannot exceed 1000 characters" })
  description?: string;

  @ApiPropertyOptional({
    description: "Type of resource affected by the event",
    example: "training_session",
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: "Resource type must be a string" })
  @MaxLength(100, { message: "Resource type cannot exceed 100 characters" })
  resourceType?: string;

  @ApiPropertyOptional({
    description: "ID of the resource affected by the event",
    example: "training_123",
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: "Resource ID must be a string" })
  @MaxLength(100, { message: "Resource ID cannot exceed 100 characters" })
  resourceId?: string;
}
