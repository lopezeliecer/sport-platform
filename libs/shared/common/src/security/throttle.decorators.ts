import { SetMetadata } from '@nestjs/common';
import { Throttle as NestThrottle } from '@nestjs/throttler';

export const THROTTLE_SKIP_KEY = 'throttle_skip';

// Simple throttle decorators that override the default (10 req/min)
export const ThrottleStrict = () => NestThrottle({ default: { limit: 5, ttl: 60000 } }); // 5 per minute
export const ThrottleAuth = () => NestThrottle({ default: { limit: 3, ttl: 60000 } }); // 3 per minute
export const ThrottleAPI = () => NestThrottle({ default: { limit: 30, ttl: 60000 } }); // 30 per minute
export const ThrottleHeavy = () => NestThrottle({ default: { limit: 1, ttl: 60000 } }); // 1 per minute

// Skip throttling entirely
export const SkipThrottle = () => SetMetadata(THROTTLE_SKIP_KEY, true);

// Specific operation decorators (using simple overrides)
export const ThrottleLogin = ThrottleAuth; // 3 per minute
export const ThrottleRefreshToken = ThrottleAPI; // 30 per minute
export const ThrottlePasswordReset = ThrottleStrict; // 5 per minute

// API operation decorators
export const ThrottleUserOperations = ThrottleAPI; // 30 per minute
export const ThrottleFileUpload = ThrottleStrict; // 5 per minute
export const ThrottleExportData = ThrottleStrict; // 5 per minute
export const ThrottleBulkOperations = ThrottleStrict; // 5 per minute

// Sports-specific decorators
export const ThrottleTrainingData = ThrottleAPI; // 30 per minute
export const ThrottleClubOperations = ThrottleAPI; // 30 per minute
