export enum SecurityEventType {
  FAILED_LOGIN = "FAILED_LOGIN",
  MULTIPLE_FAILED_LOGINS = "MULTIPLE_FAILED_LOGINS",
  SUSPICIOUS_IP = "SUSPICIOUS_IP",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  PRIVILEGE_ESCALATION = "PRIVILEGE_ESCALATION",
  INVALID_TOKEN = "INVALID_TOKEN",
  EXPIRED_TOKEN = "EXPIRED_TOKEN",
  SQL_INJECTION_ATTEMPT = "SQL_INJECTION_ATTEMPT",
  XSS_ATTEMPT = "XSS_ATTEMPT",
  INVALID_INPUT = "INVALID_INPUT",
  API_KEY_MISUSE = "API_KEY_MISUSE",
  UNUSUAL_USER_BEHAVIOR = "UNUSUAL_USER_BEHAVIOR",
  BRUTE_FORCE_ATTACK = "BRUTE_FORCE_ATTACK",
  ACCOUNT_LOCKOUT = "ACCOUNT_LOCKOUT",
  SUSPICIOUS_LOCATION = "SUSPICIOUS_LOCATION",
}

export enum SecuritySeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum SecurityActionType {
  ALERT = "ALERT",
  BLOCK_IP = "BLOCK_IP",
  LOCK_ACCOUNT = "LOCK_ACCOUNT",
  NOTIFY_ADMIN = "NOTIFY_ADMIN",
  RATE_LIMIT = "RATE_LIMIT",
  LOG_ONLY = "LOG_ONLY",
}

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: Date;
  sourceIp: string;
  userAgent?: string;
  userId?: string;
  clubId?: string;
  details: Record<string, any>;
  metadata: {
    requestId?: string;
    endpoint?: string;
    method?: string;
    statusCode?: number;
    responseTime?: number;
    location?: {
      country?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
    };
  };
}

export interface SecurityAlert {
  id: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  message: string;
  timestamp: Date;
  sourceIp: string;
  userId?: string;
  clubId?: string;
  actionsTaken: SecurityActionType[];
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  notes?: string;
}

export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<SecuritySeverity, number>;
  uniqueIps: number;
  blockedIps: number;
  alertsGenerated: number;
  alertsResolved: number;
  averageResponseTime: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface ThreatPattern {
  name: string;
  description: string;
  eventTypes: SecurityEventType[];
  conditions: {
    timeWindow: number; // minutes
    threshold: number;
    requireSameIp?: boolean;
    requireSameUser?: boolean;
  };
  severity: SecuritySeverity;
  actions: SecurityActionType[];
}
