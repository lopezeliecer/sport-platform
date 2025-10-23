import { IsString, IsOptional, IsEmail, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export class CreateAthleteDto {
  @ApiProperty({ description: 'Athlete first name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Athlete last name' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ description: 'Athlete email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Athlete phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Athlete gender' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Date of birth' })
  @IsOptional()
  dateOfBirth?: Date;
}

export class UpdateAthleteDto {
  @ApiPropertyOptional({ description: 'Athlete first name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Athlete last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Athlete email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Athlete phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Athlete gender' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Date of birth' })
  @IsOptional()
  dateOfBirth?: Date;
}

export class AthleteResponseDto {
  @ApiProperty({ description: 'Athlete ID' })
  id: string;

  @ApiProperty({ description: 'Athlete first name' })
  firstName: string;

  @ApiProperty({ description: 'Athlete last name' })
  lastName: string;

  @ApiPropertyOptional({ description: 'Athlete email' })
  email?: string;

  @ApiPropertyOptional({ description: 'Athlete phone number' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Athlete gender' })
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Date of birth' })
  dateOfBirth?: Date;

  @ApiPropertyOptional({ description: 'Athlete status' })
  status?: string;

  @ApiPropertyOptional({ description: 'Associated club information' })
  club?: {
    id: string;
    name: string;
  };

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class AthleteSearchDto {
  @ApiPropertyOptional({ description: 'Search term for name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Page offset' })
  @IsOptional()
  @IsNumber()
  offset?: number;

  @ApiPropertyOptional({ description: 'Page limit' })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
