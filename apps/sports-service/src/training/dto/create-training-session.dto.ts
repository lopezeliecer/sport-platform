import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export enum SessionType {
  TRAINING = 'TRAINING',
  COMPETITION = 'COMPETITION',
  FRIENDLY = 'FRIENDLY',
  TECHNIQUE = 'TECHNIQUE',
  RECOVERY = 'RECOVERY',
}

export enum SessionIntensity {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
}

export class CreateTrainingSessionDto {
  @ApiProperty({ description: 'Session title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Session description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: SessionType, description: 'Type of session' })
  @IsEnum(SessionType)
  @IsNotEmpty()
  type: SessionType;

  @ApiProperty({ enum: SessionIntensity, description: 'Intensity level' })
  @IsEnum(SessionIntensity)
  @IsNotEmpty()
  intensity: SessionIntensity;

  @ApiProperty({ description: 'Session start date and time' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ description: 'Session end date and time' })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ description: 'Location or pool where session occurs' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Coach/instructor ID' })
  @IsString()
  @IsNotEmpty()
  coachId: string;

  @ApiProperty({ description: 'Array of athlete IDs assigned to this session', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  athleteIds?: string[];

  @ApiProperty({ description: 'Planned duration in minutes' })
  @IsNumber()
  @Min(5)
  @Max(300)
  @IsOptional()
  plannedDuration?: number;

  @ApiProperty({ description: 'Session notes or agenda' })
  @IsString()
  @IsOptional()
  notes?: string;
}
