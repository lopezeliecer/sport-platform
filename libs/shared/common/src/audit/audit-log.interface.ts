export enum AuditEventType {
  // Authentication Events
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Authorization Events
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_CHECK = 'PERMISSION_CHECK',
  ROLE_CHANGED = 'ROLE_CHANGED',

  // User Management Events
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ACTIVATED = 'USER_ACTIVATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',

  // Club Management Events
  CLUB_JOINED = 'CLUB_JOINED',
  CLUB_LEFT = 'CLUB_LEFT',
  CLUB_SWITCHED = 'CLUB_SWITCHED',
  CLUB_ROLE_GRANTED = 'CLUB_ROLE_GRANTED',
  CLUB_ROLE_REVOKED = 'CLUB_ROLE_REVOKED',

  // API Key Events
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_USED = 'API_KEY_USED',
  API_KEY_ROTATED = 'API_KEY_ROTATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',
  API_KEY_EXPIRED = 'API_KEY_EXPIRED',

  // Security Events
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // Data Access Events
  DATA_READ = 'DATA_READ',
  DATA_CREATED = 'DATA_CREATED',
  DATA_UPDATED = 'DATA_UPDATED',
  DATA_DELETED = 'DATA_DELETED',
  BULK_OPERATION = 'BULK_OPERATION',

  // System Events
  SERVICE_STARTED = 'SERVICE_STARTED',
  SERVICE_STOPPED = 'SERVICE_STOPPED',
  CONFIG_CHANGED = 'CONFIG_CHANGED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  HEALTH_CHECK = 'HEALTH_CHECK',
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AuditStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export interface AuditContext {
  // User Information
  userId?: string;
  userEmail?: string;
  sessionId?: string;
  clubId?: string;
  userRole?: string;

  // Request Information
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;

  // Service Information
  service?: string;
  apiKeyId?: string;

  // Additional metadata
  [key: string]: any;
}

export interface AuditLogEntry {
  // Core identifiers
  id: string;
  timestamp: Date;

  // Event classification
  eventType: AuditEventType;
  severity: AuditSeverity;
  status: AuditStatus;

  // Event details
  message: string;
  description?: string;

  // Context information
  context: AuditContext;

  // Technical details
  resourceType?: string;
  resourceId?: string;
  previousValue?: any;
  newValue?: any;

  // Error information (if applicable)
  errorCode?: string;
  errorMessage?: string;
  stackTrace?: string;

  // Compliance and retention
  retentionPolicy?: string;
  sensitiveData?: boolean;
  complianceFlags?: string[];
}

export interface AuditQueryOptions {
  // Time range
  startDate?: Date;
  endDate?: Date;

  // Filters
  eventTypes?: AuditEventType[];
  severities?: AuditSeverity[];
  statuses?: AuditStatus[];
  userIds?: string[];
  services?: string[];
  clubIds?: string[];

  // Search
  searchTerm?: string;

  // Pagination
  limit?: number;
  offset?: number;

  // Sorting
  sortBy?: 'timestamp' | 'severity' | 'eventType';
  sortOrder?: 'ASC' | 'DESC';
}

export interface AuditStatistics {
  totalEvents: number;
  eventsByType: Record<AuditEventType, number>;
  eventsBySeverity: Record<AuditSeverity, number>;
  eventsByStatus: Record<AuditStatus, number>;
  eventsOverTime: Array<{
    date: string;
    count: number;
  }>;
  topUsers: Array<{
    userId: string;
    userEmail: string;
    eventCount: number;
  }>;
  topServices: Array<{
    service: string;
    eventCount: number;
  }>;
  securityAlerts: Array<{
    alertType: string;
    count: number;
    lastOccurrence: Date;
  }>;
}

export interface AuditAlert {
  id: string;
  timestamp: Date;
  alertType: string;
  severity: AuditSeverity;
  message: string;
  triggerCondition: string;
  relatedEvents: string[]; // Array of audit log entry IDs
  isActive: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}
