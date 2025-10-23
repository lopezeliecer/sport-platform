import {
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SecurityEventType, SecuritySeverity } from '../interfaces/security-event.interface';

export class CreateSecurityEventDto {
  @ApiProperty({
    description: 'Type of security event',
    enum: SecurityEventType,
    example: SecurityEventType.FAILED_LOGIN,
  })
  @IsNotEmpty({ message: 'Event type is required' })
  @IsEnum(SecurityEventType, {
    message: 'Event type must be a valid SecurityEventType',
  })
  type: SecurityEventType;

  @ApiProperty({
    description: 'Severity level of the security event',
    enum: SecuritySeverity,
    example: SecuritySeverity.HIGH,
  })
  @IsNotEmpty({ message: 'Severity is required' })
  @IsEnum(SecuritySeverity, {
    message: 'Severity must be a valid SecuritySeverity',
  })
  severity: SecuritySeverity;

  @ApiProperty({
    description: 'Source IP address where the event originated',
    example: '192.168.1.100',
  })
  @IsNotEmpty({ message: 'Source IP is required' })
  @IsString({ message: 'Source IP must be a string' })
  sourceIp: string;

  @ApiPropertyOptional({
    description: 'User agent string from the request',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  @IsOptional()
  @IsString({ message: 'User agent must be a string' })
  userAgent?: string;

  @ApiPropertyOptional({
    description: 'ID of the user associated with the event',
    example: 'user-123',
  })
  @IsOptional()
  @IsString({ message: 'User ID must be a string' })
  userId?: string;

  @ApiPropertyOptional({
    description: 'ID of the club associated with the event',
    example: 'club-456',
  })
  @IsOptional()
  @IsString({ message: 'Club ID must be a string' })
  clubId?: string;

  @ApiPropertyOptional({
    description: 'Additional details about the security event',
    example: { attemptedPassword: 'hidden', loginMethod: 'email' },
  })
  @IsOptional()
  @IsObject({ message: 'Details must be an object' })
  details?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'API endpoint where the event occurred',
    example: '/auth/login',
  })
  @IsOptional()
  @IsString({ message: 'Endpoint must be a string' })
  endpoint?: string;

  @ApiPropertyOptional({
    description: 'HTTP method used in the request',
    example: 'POST',
  })
  @IsOptional()
  @IsString({ message: 'Method must be a string' })
  method?: string;

  @ApiPropertyOptional({
    description: 'HTTP status code returned',
    example: 401,
    minimum: 100,
    maximum: 599,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Status code must be a number' })
  @Min(100, { message: 'Status code must be at least 100' })
  @Max(599, { message: 'Status code must be at most 599' })
  statusCode?: number;

  @ApiPropertyOptional({
    description: 'Response time in milliseconds',
    example: 250,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Response time must be a number' })
  @Min(0, { message: 'Response time must be non-negative' })
  responseTime?: number;
}
