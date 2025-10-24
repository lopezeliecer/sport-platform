import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
  INJURED = 'INJURED',
}

export class RecordAttendanceDto {
  @ApiProperty({ description: 'Athlete ID' })
  @IsString()
  @IsNotEmpty()
  athleteId: string;

  @ApiProperty({ description: 'Training session ID' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ enum: AttendanceStatus, description: 'Attendance status' })
  @IsEnum(AttendanceStatus)
  @IsNotEmpty()
  status: AttendanceStatus;

  @ApiProperty({ description: 'Check-in time' })
  @IsDateString()
  @IsOptional()
  checkInTime?: string;

  @ApiProperty({ description: 'Check-out time' })
  @IsDateString()
  @IsOptional()
  checkOutTime?: string;

  @ApiProperty({ description: 'Notes about attendance' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class SessionAttendanceDto {
  @ApiProperty({ description: 'Session ID' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: 'Date of the session' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ description: 'Number of athletes present' })
  @IsNumber()
  @Min(0)
  presentCount: number;

  @ApiProperty({ description: 'Total athletes assigned' })
  @IsNumber()
  @Min(0)
  totalCount: number;

  @ApiProperty({ description: 'Attendance percentage' })
  @IsNumber()
  @Min(0)
  attendanceRate: number;
}
