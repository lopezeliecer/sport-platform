import {
  IsEmail,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum AuthProvider {
  GOOGLE = "GOOGLE",
  EMAIL = "EMAIL",
  APPLE = "APPLE",
}

export enum UserRole {
  CLUB_ADMIN = "CLUB_ADMIN",
  COACH = "COACH",
  ATHLETE = "ATHLETE",
  MEDICAL_STAFF = "MEDICAL_STAFF",
  PARENT = "PARENT",
  CLUB_DIRECTOR = "CLUB_DIRECTOR",
}

export class LoginDto {
  @ApiProperty({ description: "User email" })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: "Password for email login" })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: "Google OAuth access token" })
  @IsOptional()
  @IsString()
  googleToken?: string;

  @ApiPropertyOptional({ description: "Device information" })
  @IsOptional()
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    deviceType?: string;
    appVersion?: string;
  };
}

export class GoogleAuthDto {
  @ApiProperty({ description: "Google OAuth access token" })
  @IsString()
  accessToken: string;

  @ApiPropertyOptional({ description: "Device information" })
  @IsOptional()
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    deviceType?: string;
    appVersion?: string;
  };
}

export class RefreshTokenDto {
  @ApiProperty({ description: "Refresh token" })
  @IsString()
  refreshToken: string;
}

export class UserInfoDto {
  @ApiProperty({ description: "User ID" })
  id: string;

  @ApiProperty({ description: "Email address" })
  email: string;

  @ApiProperty({ description: "First name" })
  firstName: string;

  @ApiProperty({ description: "Last name" })
  lastName: string;

  @ApiPropertyOptional({ description: "Profile picture URL" })
  @IsOptional()
  profilePicture?: string;

  @ApiProperty({ description: "Email verification status" })
  emailVerified: boolean;

  @ApiProperty({ description: "Authentication provider" })
  authProvider: AuthProvider;

  @ApiProperty({ description: "Account active status" })
  isActive: boolean;

  @ApiPropertyOptional({ description: "Last login timestamp" })
  @IsOptional()
  lastLoginAt?: Date;
}

export class ClubMembershipDto {
  @ApiProperty({ description: "Club ID" })
  clubId: string;

  @ApiProperty({ description: "Club name" })
  clubName: string;

  @ApiProperty({ description: "Club slug" })
  clubSlug: string;

  @ApiPropertyOptional({ description: "Club logo URL" })
  @IsOptional()
  clubLogo?: string;

  @ApiProperty({ description: "User role in this club" })
  role: UserRole;

  @ApiProperty({ description: "Membership active status" })
  isActive: boolean;

  @ApiProperty({ description: "Permissions in this club" })
  permissions: string[];

  @ApiPropertyOptional({ description: "Role expiration date" })
  @IsOptional()
  expiresAt?: Date;
}

export class AuthResponseDto {
  @ApiProperty({ description: "Access token (JWT)" })
  accessToken: string;

  @ApiProperty({ description: "Refresh token" })
  refreshToken: string;

  @ApiProperty({ description: "Token expiration time in seconds" })
  expiresIn: number;

  @ApiProperty({ description: "Token type" })
  tokenType: string = "Bearer";

  @ApiProperty({ description: "User information" })
  user: UserInfoDto;

  @ApiProperty({ description: "Available clubs for the user" })
  clubs: ClubMembershipDto[];

  @ApiPropertyOptional({ description: "Default club ID" })
  @IsOptional()
  defaultClubId?: string;
}

export class SwitchClubDto {
  @ApiProperty({ description: "Target club ID" })
  @IsUUID()
  clubId: string;
}

export class LogoutDto {
  @ApiPropertyOptional({ description: "Logout from all devices" })
  @IsOptional()
  @IsBoolean()
  allDevices?: boolean = false;
}

export class RevokeSessionDto {
  @ApiProperty({ description: "Session ID to revoke" })
  @IsUUID()
  sessionId: string;

  @ApiPropertyOptional({ description: "Reason for revocation" })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SessionInfoDto {
  @ApiProperty({ description: "Session ID" })
  id: string;

  @ApiProperty({ description: "Device information" })
  deviceInfo: any;

  @ApiPropertyOptional({ description: "IP address" })
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: "User agent" })
  @IsOptional()
  userAgent?: string;

  @ApiProperty({ description: "Session status" })
  status: string;

  @ApiProperty({ description: "Last activity timestamp" })
  lastActivityAt: Date;

  @ApiProperty({ description: "Session creation timestamp" })
  createdAt: Date;

  @ApiProperty({ description: "Session expiration timestamp" })
  expiresAt: Date;

  @ApiProperty({ description: "Is current session" })
  isCurrent: boolean;
}
