import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsNumber,
  IsIn,
  Min,
  Max,
  IsDateString,
} from "class-validator";
import { Transform } from "class-transformer";

export class AuditQueryDto {
  @ApiPropertyOptional({
    description: "Start date for filtering (ISO string)",
    example: "2025-01-01T00:00:00.000Z",
  })
  @IsOptional()
  @IsDateString({}, { message: "Start date must be a valid ISO date string" })
  startDate?: string;

  @ApiPropertyOptional({
    description: "End date for filtering (ISO string)",
    example: "2025-12-31T23:59:59.999Z",
  })
  @IsOptional()
  @IsDateString({}, { message: "End date must be a valid ISO date string" })
  endDate?: string;

  @ApiPropertyOptional({
    description: "Comma-separated event types to filter by",
    example: "LOGIN_SUCCESS,LOGIN_FAILED,DATA_READ",
  })
  @IsOptional()
  @IsString({ message: "Event types must be a string" })
  eventTypes?: string;

  @ApiPropertyOptional({
    description: "Comma-separated severities to filter by",
    example: "LOW,MEDIUM,HIGH",
  })
  @IsOptional()
  @IsString({ message: "Severities must be a string" })
  severities?: string;

  @ApiPropertyOptional({
    description: "Comma-separated statuses to filter by",
    example: "SUCCESS,ERROR,WARNING",
  })
  @IsOptional()
  @IsString({ message: "Statuses must be a string" })
  statuses?: string;

  @ApiPropertyOptional({
    description: "Comma-separated user IDs to filter by",
    example: "user1,user2,user3",
  })
  @IsOptional()
  @IsString({ message: "User IDs must be a string" })
  userIds?: string;

  @ApiPropertyOptional({
    description: "Comma-separated services to filter by",
    example: "identity-service,sports-service,web-client",
  })
  @IsOptional()
  @IsString({ message: "Services must be a string" })
  services?: string;

  @ApiPropertyOptional({
    description: "Search term for message and description fields",
    example: "authentication failed",
  })
  @IsOptional()
  @IsString({ message: "Search term must be a string" })
  searchTerm?: string;

  @ApiPropertyOptional({
    description: "Maximum number of results to return",
    example: 100,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: "Limit must be a number" })
  @Min(1, { message: "Limit must be at least 1" })
  @Max(1000, { message: "Limit cannot exceed 1000" })
  limit?: number;

  @ApiPropertyOptional({
    description: "Offset for pagination",
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: "Offset must be a number" })
  @Min(0, { message: "Offset cannot be negative" })
  offset?: number;

  @ApiPropertyOptional({
    description: "Field to sort by",
    example: "timestamp",
    enum: ["timestamp", "severity", "eventType"],
  })
  @IsOptional()
  @IsIn(["timestamp", "severity", "eventType"], {
    message: "Sort by must be one of: timestamp, severity, eventType",
  })
  sortBy?: "timestamp" | "severity" | "eventType";

  @ApiPropertyOptional({
    description: "Sort order",
    example: "DESC",
    enum: ["ASC", "DESC"],
  })
  @IsOptional()
  @IsIn(["ASC", "DESC"], {
    message: "Sort order must be either ASC or DESC",
  })
  sortOrder?: "ASC" | "DESC";
}
