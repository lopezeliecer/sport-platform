import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsUUID,
  IsEmail,
  IsArray,
  IsObject,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
  Max,
  Length,
  Matches,
  ValidateNested,
  IsNotEmpty,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// ============================================================================
// ENUM DEFINITIONS (matching Prisma enums)
// ============================================================================

export enum UserRole {
  COACH = "COACH",
  ADMIN = "ADMIN",
  ATHLETE = "ATHLETE",
  PARENT = "PARENT",
  MEDICAL = "MEDICAL",
  DIRECTOR = "DIRECTOR",
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export enum Sport {
  SWIMMING = "SWIMMING",
  TRACK_FIELD = "TRACK_FIELD",
  SOCCER = "SOCCER",
  BASKETBALL = "BASKETBALL",
  TENNIS = "TENNIS",
}

export enum AthleteLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
  ELITE = "ELITE",
}

export enum SessionStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  POSTPONED = "POSTPONED",
}

export enum AttendanceStatus {
  SCHEDULED = "SCHEDULED",
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "LATE",
  EARLY_DEPARTURE = "EARLY_DEPARTURE",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
  PARTIAL = "PARTIAL",
}

export enum PaymentType {
  MEMBERSHIP = "MEMBERSHIP",
  TRAINING = "TRAINING",
  COMPETITION = "COMPETITION",
  EQUIPMENT = "EQUIPMENT",
  FACILITY = "FACILITY",
  OTHER = "OTHER",
}

// ============================================================================
// BASE DTOs
// ============================================================================

export class PaginationDto {
  @ApiPropertyOptional({ description: "Page number", minimum: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Items per page",
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: "Sort field", default: "createdAt" })
  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({
    description: "Sort order",
    enum: ["asc", "desc"],
    default: "desc",
  })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";
}

export class SearchDto extends PaginationDto {
  @ApiPropertyOptional({ description: "Search query" })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  query?: string;

  @ApiPropertyOptional({ description: "Start date for date range filter" })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: "End date for date range filter" })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: "Filter by active status" })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  isActive?: boolean;
}

export class ResponseMetaDto {
  @ApiProperty({ description: "Request timestamp" })
  timestamp: string;

  @ApiProperty({ description: "Request ID for tracking" })
  requestId: string;

  @ApiProperty({ description: "API version" })
  version: string;
}

export class PaginationMetaDto {
  @ApiProperty({ description: "Current page number" })
  page: number;

  @ApiProperty({ description: "Items per page" })
  limit: number;

  @ApiProperty({ description: "Total items" })
  total: number;

  @ApiProperty({ description: "Total pages" })
  totalPages: number;

  @ApiProperty({ description: "Has next page" })
  hasNext: boolean;

  @ApiProperty({ description: "Has previous page" })
  hasPrev: boolean;
}

// ============================================================================
// USER DTOs
// ============================================================================

export class CreateUserDto {
  @ApiProperty({ description: "User email address" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: "Google OAuth ID" })
  @IsOptional()
  @IsString()
  googleId?: string;

  @ApiProperty({ description: "Full name" })
  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  name: string;

  @ApiPropertyOptional({ description: "Profile picture URL" })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiPropertyOptional({ description: "Phone number" })
  @IsOptional()
  @IsString()
  @Matches(/^[\+]?[1-9][\d]{0,15}$/, { message: "Invalid phone number format" })
  phone?: string;

  @ApiPropertyOptional({ description: "Emergency contact information" })
  @IsOptional()
  @IsObject()
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };

  @ApiPropertyOptional({ description: "Preferred language", default: "en" })
  @IsOptional()
  @IsString()
  @Length(2, 10)
  preferredLanguage?: string = "en";

  @ApiPropertyOptional({ description: "Timezone", default: "UTC" })
  @IsOptional()
  @IsString()
  timezone?: string = "UTC";
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: "Full name" })
  @IsOptional()
  @IsString()
  @Length(2, 200)
  name?: string;

  @ApiPropertyOptional({ description: "Profile picture URL" })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiPropertyOptional({ description: "Phone number" })
  @IsOptional()
  @IsString()
  @Matches(/^[\+]?[1-9][\d]{0,15}$/, { message: "Invalid phone number format" })
  phone?: string;

  @ApiPropertyOptional({ description: "Emergency contact information" })
  @IsOptional()
  @IsObject()
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };

  @ApiPropertyOptional({ description: "Preferred language" })
  @IsOptional()
  @IsString()
  @Length(2, 10)
  preferredLanguage?: string;

  @ApiPropertyOptional({ description: "Timezone" })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: "Active status" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UserResponseDto {
  @ApiProperty({ description: "User ID" })
  id: string;

  @ApiProperty({ description: "Email address" })
  email: string;

  @ApiProperty({ description: "Full name" })
  name: string;

  @ApiPropertyOptional({ description: "Profile picture URL" })
  profilePicture?: string;

  @ApiPropertyOptional({ description: "Phone number" })
  phone?: string;

  @ApiProperty({ description: "Preferred language" })
  preferredLanguage: string;

  @ApiProperty({ description: "Timezone" })
  timezone: string;

  @ApiProperty({ description: "Active status" })
  isActive: boolean;

  @ApiProperty({ description: "Last login timestamp" })
  lastLoginAt?: Date;

  @ApiProperty({ description: "Created timestamp" })
  createdAt: Date;

  @ApiProperty({ description: "Updated timestamp" })
  updatedAt: Date;
}

// ============================================================================
// CLUB DTOs
// ============================================================================

export class CreateClubDto {
  @ApiProperty({ description: "Club name" })
  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  name: string;

  @ApiProperty({ description: "Club slug (URL-friendly identifier)" })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: "Slug must contain only lowercase letters, numbers, and hyphens",
  })
  @Length(2, 100)
  slug: string;

  @ApiPropertyOptional({ description: "Club description" })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @ApiPropertyOptional({ description: "Club logo URL" })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ description: "Club address" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: "Club phone number" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: "Club email" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: "Club website" })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: "Founded year" })
  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(new Date().getFullYear())
  foundedYear?: number;

  @ApiPropertyOptional({
    description: "Supported sports",
    enum: Sport,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Sport, { each: true })
  sports?: Sport[];

  @ApiPropertyOptional({ description: "Timezone", default: "UTC" })
  @IsOptional()
  @IsString()
  timezone?: string = "UTC";

  @ApiPropertyOptional({ description: "Currency", default: "USD" })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string = "USD";

  @ApiPropertyOptional({ description: "Language", default: "en" })
  @IsOptional()
  @IsString()
  @Length(2, 10)
  language?: string = "en";

  @ApiPropertyOptional({
    description: "Maximum athletes allowed",
    default: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAthletes?: number = 100;
}

export class UpdateClubDto {
  @ApiPropertyOptional({ description: "Club name" })
  @IsOptional()
  @IsString()
  @Length(2, 200)
  name?: string;

  @ApiPropertyOptional({ description: "Club description" })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @ApiPropertyOptional({ description: "Club logo URL" })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ description: "Club address" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: "Club phone number" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: "Club email" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: "Club website" })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: "Founded year" })
  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(new Date().getFullYear())
  foundedYear?: number;

  @ApiPropertyOptional({
    description: "Supported sports",
    enum: Sport,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Sport, { each: true })
  sports?: Sport[];

  @ApiPropertyOptional({ description: "Club settings" })
  @IsOptional()
  @IsObject()
  settings?: any;

  @ApiPropertyOptional({ description: "Active status" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: "Maximum athletes allowed" })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAthletes?: number;
}

export class ClubResponseDto {
  @ApiProperty({ description: "Club ID" })
  id: string;

  @ApiProperty({ description: "Club name" })
  name: string;

  @ApiProperty({ description: "Club slug" })
  slug: string;

  @ApiPropertyOptional({ description: "Club description" })
  description?: string;

  @ApiPropertyOptional({ description: "Club logo URL" })
  logo?: string;

  @ApiPropertyOptional({ description: "Club address" })
  address?: string;

  @ApiPropertyOptional({ description: "Club phone" })
  phone?: string;

  @ApiPropertyOptional({ description: "Club email" })
  email?: string;

  @ApiPropertyOptional({ description: "Club website" })
  website?: string;

  @ApiPropertyOptional({ description: "Founded year" })
  foundedYear?: number;

  @ApiProperty({ description: "Supported sports", enum: Sport, isArray: true })
  sports: Sport[];

  @ApiProperty({ description: "Timezone" })
  timezone: string;

  @ApiProperty({ description: "Currency" })
  currency: string;

  @ApiProperty({ description: "Language" })
  language: string;

  @ApiProperty({ description: "Active status" })
  isActive: boolean;

  @ApiProperty({ description: "Subscription tier" })
  subscriptionTier: string;

  @ApiProperty({ description: "Maximum athletes allowed" })
  maxAthletes: number;

  @ApiProperty({ description: "Created timestamp" })
  createdAt: Date;

  @ApiProperty({ description: "Updated timestamp" })
  updatedAt: Date;
}

// ============================================================================
// ATHLETE DTOs
// ============================================================================

export class CreateAthleteDto {
  @ApiProperty({ description: "Club ID" })
  @IsUUID()
  @IsNotEmpty()
  clubId: string;

  @ApiPropertyOptional({ description: "User ID if athlete has system access" })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: "Unique athlete number within club" })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  athleteNumber?: string;

  @ApiProperty({ description: "First name" })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  firstName: string;

  @ApiProperty({ description: "Last name" })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  lastName: string;

  @ApiPropertyOptional({ description: "Nickname" })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  nickname?: string;

  @ApiPropertyOptional({ description: "Date of birth" })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: "Gender", enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: "Profile picture URL" })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiPropertyOptional({
    description: "Primary sport",
    enum: Sport,
    default: Sport.SWIMMING,
  })
  @IsOptional()
  @IsEnum(Sport)
  sport?: Sport = Sport.SWIMMING;

  @ApiPropertyOptional({ description: "Category (e.g., age group)" })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  category?: string;

  @ApiPropertyOptional({
    description: "Athlete level",
    enum: AthleteLevel,
    default: AthleteLevel.BEGINNER,
  })
  @IsOptional()
  @IsEnum(AthleteLevel)
  level?: AthleteLevel = AthleteLevel.BEGINNER;

  @ApiPropertyOptional({ description: "Date joined the club" })
  @IsOptional()
  @IsDateString()
  joinedAt?: string;

  @ApiPropertyOptional({ description: "Parent/guardian user ID" })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: "Emergency contacts information" })
  @IsOptional()
  @IsObject()
  emergencyContacts?: any;

  @ApiPropertyOptional({ description: "Personal bests records" })
  @IsOptional()
  @IsObject()
  personalBests?: any;

  @ApiPropertyOptional({ description: "Training and competition goals" })
  @IsOptional()
  @IsObject()
  goals?: any;

  @ApiPropertyOptional({ description: "Additional notes" })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAthleteDto {
  @ApiPropertyOptional({ description: "Athlete number" })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  athleteNumber?: string;

  @ApiPropertyOptional({ description: "First name" })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @ApiPropertyOptional({ description: "Last name" })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @ApiPropertyOptional({ description: "Nickname" })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  nickname?: string;

  @ApiPropertyOptional({ description: "Date of birth" })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: "Gender", enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: "Profile picture URL" })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiPropertyOptional({ description: "Primary sport", enum: Sport })
  @IsOptional()
  @IsEnum(Sport)
  sport?: Sport;

  @ApiPropertyOptional({ description: "Category" })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  category?: string;

  @ApiPropertyOptional({ description: "Athlete level", enum: AthleteLevel })
  @IsOptional()
  @IsEnum(AthleteLevel)
  level?: AthleteLevel;

  @ApiPropertyOptional({ description: "Emergency contacts" })
  @IsOptional()
  @IsObject()
  emergencyContacts?: any;

  @ApiPropertyOptional({ description: "Personal bests" })
  @IsOptional()
  @IsObject()
  personalBests?: any;

  @ApiPropertyOptional({ description: "Goals" })
  @IsOptional()
  @IsObject()
  goals?: any;

  @ApiPropertyOptional({ description: "Notes" })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: "Active status" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AthleteResponseDto {
  @ApiProperty({ description: "Athlete ID" })
  id: string;

  @ApiProperty({ description: "Club ID" })
  clubId: string;

  @ApiPropertyOptional({ description: "User ID" })
  userId?: string;

  @ApiPropertyOptional({ description: "Athlete number" })
  athleteNumber?: string;

  @ApiProperty({ description: "First name" })
  firstName: string;

  @ApiProperty({ description: "Last name" })
  lastName: string;

  @ApiPropertyOptional({ description: "Nickname" })
  nickname?: string;

  @ApiPropertyOptional({ description: "Date of birth" })
  dateOfBirth?: Date;

  @ApiPropertyOptional({ description: "Gender", enum: Gender })
  gender?: Gender;

  @ApiPropertyOptional({ description: "Profile picture URL" })
  profilePicture?: string;

  @ApiProperty({ description: "Primary sport", enum: Sport })
  sport: Sport;

  @ApiPropertyOptional({ description: "Category" })
  category?: string;

  @ApiProperty({ description: "Athlete level", enum: AthleteLevel })
  level: AthleteLevel;

  @ApiProperty({ description: "Date joined" })
  joinedAt: Date;

  @ApiProperty({ description: "Active status" })
  isActive: boolean;

  @ApiProperty({ description: "Personal bests" })
  personalBests: any;

  @ApiProperty({ description: "Goals" })
  goals: any;

  @ApiPropertyOptional({ description: "Notes" })
  notes?: string;

  @ApiProperty({ description: "Created timestamp" })
  createdAt: Date;

  @ApiProperty({ description: "Updated timestamp" })
  updatedAt: Date;
}

// ============================================================================
// SEARCH DTOs
// ============================================================================

export class AthleteSearchDto extends SearchDto {
  @ApiPropertyOptional({ description: "Filter by sport", enum: Sport })
  @IsOptional()
  @IsEnum(Sport)
  sport?: Sport;

  @ApiPropertyOptional({ description: "Filter by level", enum: AthleteLevel })
  @IsOptional()
  @IsEnum(AthleteLevel)
  level?: AthleteLevel;

  @ApiPropertyOptional({ description: "Filter by category" })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: "Filter by gender", enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}

export class ClubSearchDto extends SearchDto {
  @ApiPropertyOptional({ description: "Filter by sport", enum: Sport })
  @IsOptional()
  @IsEnum(Sport)
  sport?: Sport;

  @ApiPropertyOptional({ description: "Filter by subscription tier" })
  @IsOptional()
  @IsString()
  subscriptionTier?: string;
}

// ============================================================================
// RESPONSE WRAPPER DTOs
// ============================================================================

export class ApiResponseDto<T> {
  @ApiProperty({ description: "Operation success status" })
  success: boolean;

  @ApiPropertyOptional({ description: "Response data" })
  data?: T;

  @ApiPropertyOptional({ description: "Error information" })
  error?: {
    code: string;
    message: string;
    details?: any;
  };

  @ApiPropertyOptional({ description: "Response metadata" })
  meta?: ResponseMetaDto;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: "Data array" })
  data: T[];

  @ApiProperty({ description: "Pagination metadata" })
  pagination: PaginationMetaDto;
}
