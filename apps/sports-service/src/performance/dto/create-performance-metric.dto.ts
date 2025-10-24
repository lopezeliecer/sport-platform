import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  IsObject,
} from 'class-validator';

export class CreatePerformanceMetricDto {
  @ApiProperty({ description: 'Athlete ID' })
  @IsString()
  @IsNotEmpty()
  athleteId: string;

  @ApiProperty({ description: 'Training session ID (optional)' })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiProperty({ description: 'Type of metric (e.g., time, distance, speed)' })
  @IsString()
  @IsNotEmpty()
  metricType: string;

  @ApiProperty({ description: 'Metric value' })
  @IsNumber()
  @IsNotEmpty()
  value: number;

  @ApiProperty({ description: 'Unit of measurement' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ description: 'Recording date and time' })
  @IsDateString()
  @IsNotEmpty()
  recordedAt: string;

  @ApiProperty({ description: 'Notes or context' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Sport-specific metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class GetPerformanceSummaryDto {
  @ApiProperty({ description: 'Start date for summary (ISO 8601)' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'End date for summary (ISO 8601)' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({ description: 'Metric type to summarize' })
  @IsString()
  @IsOptional()
  metricType?: string;
}

export class PersonalRecordDto {
  @ApiProperty({ description: 'Metric type' })
  metricType: string;

  @ApiProperty({ description: 'Personal record value' })
  value: number;

  @ApiProperty({ description: 'Unit' })
  unit: string;

  @ApiProperty({ description: 'Date achieved' })
  achievedAt: Date;

  @ApiProperty({ description: 'Session context' })
  sessionId?: string;
}

export class PerformanceTrendDto {
  @ApiProperty({ description: 'Date' })
  date: Date;

  @ApiProperty({ description: 'Average value for period' })
  averageValue: number;

  @ApiProperty({ description: 'Min value' })
  minValue: number;

  @ApiProperty({ description: 'Max value' })
  maxValue: number;

  @ApiProperty({ description: 'Number of records' })
  recordCount: number;

  @ApiProperty({ description: 'Trend direction (up/down/stable)' })
  trend: 'up' | 'down' | 'stable';
}
