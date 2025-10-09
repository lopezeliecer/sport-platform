// Shared common library exports
export * from "./dto/base.dto";

// Security exports
export * from "./security/throttler.config";
export * from "./security/custom-throttler.guard";
export * from "./security/throttle.decorators";
export * from "./security/security.config";
export * from "./validation/sanitization.service";
export * from "./validation/security-validation.pipe";

// Re-export commonly used classes (not as types)
export {
  PaginationDto,
  SearchDto,
  ResponseMetaDto,
  PaginationMetaDto,
  ApiResponseDto,
  PaginatedResponseDto,
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  CreateClubDto,
  UpdateClubDto,
  ClubResponseDto,
  CreateAthleteDto,
  UpdateAthleteDto,
  AthleteResponseDto,
  AthleteSearchDto,
  ClubSearchDto,
} from "./dto/base.dto";

// Re-export enums
export {
  UserRole,
  Gender,
  Sport,
  AthleteLevel,
  SessionStatus,
  AttendanceStatus,
  PaymentStatus,
  PaymentType,
} from "./dto/base.dto";
