import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export enum CompetitionStatus {
  PLANNING = 'PLANNING',
  REGISTRATION = 'REGISTRATION',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class CreateCompetitionDto {
  @ApiProperty({ description: 'Competition name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Competition description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: CompetitionStatus, description: 'Status' })
  @IsEnum(CompetitionStatus)
  @IsNotEmpty()
  status: CompetitionStatus;

  @ApiProperty({ description: 'Start date' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'End date' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({ description: 'Location' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Organizing body' })
  @IsString()
  @IsOptional()
  organizer?: string;

  @ApiProperty({ description: 'Number of participants' })
  @IsNumber()
  @IsOptional()
  expectedParticipants?: number;
}

export class RegisterAthleteCompetitionDto {
  @ApiProperty({ description: 'Athlete ID' })
  @IsString()
  @IsNotEmpty()
  athleteId: string;

  @ApiProperty({ description: 'Competition ID' })
  @IsString()
  @IsNotEmpty()
  competitionId: string;

  @ApiProperty({ description: 'Category or division' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ description: 'Target time/performance' })
  @IsString()
  @IsOptional()
  targetPerformance?: string;
}

export class RecordCompetitionResultDto {
  @ApiProperty({ description: 'Athlete ID' })
  @IsString()
  @IsNotEmpty()
  athleteId: string;

  @ApiProperty({ description: 'Competition ID' })
  @IsString()
  @IsNotEmpty()
  competitionId: string;

  @ApiProperty({ description: 'Final time/score' })
  @IsString()
  @IsNotEmpty()
  finalPerformance: string;

  @ApiProperty({ description: 'Position/Placement' })
  @IsNumber()
  @IsOptional()
  position?: number;

  @ApiProperty({ description: 'Did athlete qualify for next round' })
  @IsString()
  @IsOptional()
  qualified?: boolean;

  @ApiProperty({ description: 'Notes about the performance' })
  @IsBoolean()
  @IsOptional()
  notes?: string;
}
