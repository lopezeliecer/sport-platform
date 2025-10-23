export enum EnvironmentType {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}

export enum SecurityLevel {
  MINIMAL = 'minimal',
  STANDARD = 'standard',
  HIGH = 'high',
  MAXIMUM = 'maximum',
}

export interface DatabaseSecurityConfig {
  connectionEncrypted: boolean;
  ssl: boolean;
  certificateValidation: boolean;
  connectionPoolSize: number;
  queryTimeout: number;
  maxConnections: number;
}

export interface JwtSecurityConfig {
  algorithm: string;
  expiresIn: string;
  refreshExpiresIn: string;
  issuer: string;
  audience: string;
  secretRotationInterval: number; // hours
  requireHttpsOnly: boolean;
}

export interface RateLimitingConfig {
  enabled: boolean;
  globalLimit: number;
  globalWindow: number; // seconds
  authLimit: number;
  authWindow: number; // seconds
  strictMode: boolean;
  whitelistedIPs: string[];
}

export interface CorsSecurityConfig {
  enabled: boolean;
  origin: string | string[] | boolean;
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
  maxAge: number;
  preflightContinue: boolean;
}

export interface EncryptionConfig {
  algorithm: string;
  keyDerivationRounds: number;
  saltLength: number;
  ivLength: number;
  tagLength: number;
  encoding: 'hex' | 'base64';
}

export interface SecurityHeadersConfig {
  helmet: {
    enabled: boolean;
    contentSecurityPolicy: boolean;
    hsts: {
      enabled: boolean;
      maxAge: number;
      includeSubDomains: boolean;
      preload: boolean;
    };
    noSniff: boolean;
    xssFilter: boolean;
    referrerPolicy: string;
  };
  customHeaders: Record<string, string>;
}

export interface AuditSecurityConfig {
  enabled: boolean;
  retentionDays: number;
  encryptLogs: boolean;
  realTimeAlerting: boolean;
  sensitiveDataRedaction: boolean;
  compressionEnabled: boolean;
}

export interface MonitoringConfig {
  healthCheckInterval: number; // seconds
  securityMetricsInterval: number; // seconds
  threatDetectionEnabled: boolean;
  anomalyDetectionEnabled: boolean;
  alertThresholds: {
    failedLogins: number;
    rateLimitViolations: number;
    suspiciousIPs: number;
    criticalErrors: number;
  };
}

export interface EnvironmentSecurityConfig {
  // Core Environment Settings
  environment: EnvironmentType;
  securityLevel: SecurityLevel;
  debugMode: boolean;
  maintenanceMode: boolean;

  // Service Configuration
  port: number;
  host: string;
  baseUrl: string;
  apiVersion: string;

  // Security Configurations
  database: DatabaseSecurityConfig;
  jwt: JwtSecurityConfig;
  rateLimiting: RateLimitingConfig;
  cors: CorsSecurityConfig;
  encryption: EncryptionConfig;
  headers: SecurityHeadersConfig;
  audit: AuditSecurityConfig;
  monitoring: MonitoringConfig;

  // Feature Flags
  features: {
    apiKeyAuth: boolean;
    socialLogin: boolean;
    multiFactorAuth: boolean;
    sessionManagement: boolean;
    auditLogging: boolean;
    securityMonitoring: boolean;
    advancedThreatDetection: boolean;
  };

  // External Service URLs
  services: {
    googleOAuth: {
      enabled: boolean;
      clientId?: string;
      redirectUrl?: string;
    };
    emailService: {
      enabled: boolean;
      provider: string;
      smtpHost?: string;
      smtpPort?: number;
      useTLS: boolean;
    };
    notificationService: {
      enabled: boolean;
      webhookUrl?: string;
      slackChannel?: string;
    };
  };

  // Security Policies
  policies: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      preventReuse: number;
      maxAge: number; // days
    };
    sessionPolicy: {
      maxDuration: number; // hours
      maxConcurrentSessions: number;
      requireReauthentication: number; // hours
      idleTimeout: number; // minutes
    };
    accessPolicy: {
      maxFailedAttempts: number;
      lockoutDuration: number; // minutes
      requireIPWhitelist: boolean;
      allowedIPs: string[];
      geoRestrictions: string[]; // country codes
    };
  };

  // Compliance Settings
  compliance: {
    gdprCompliant: boolean;
    dataRetentionDays: number;
    rightToErasure: boolean;
    dataPortability: boolean;
    consentManagement: boolean;
    privacyByDesign: boolean;
  };

  // Development/Testing Settings
  development: {
    seedDatabase: boolean;
    enableMocks: boolean;
    disableAuth: boolean;
    verboseLogging: boolean;
    enableTestEndpoints: boolean;
    allowInsecureConnections: boolean;
  };
}

export interface EnvironmentValidationRule {
  field: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  pattern?: RegExp;
  min?: number;
  max?: number;
  allowedValues?: any[];
  dependsOn?: string[];
  environmentSpecific?: {
    [key in EnvironmentType]?: {
      required?: boolean;
      defaultValue?: any;
    };
  };
}

export interface SecurityViolation {
  id: string;
  timestamp: Date;
  type: 'CONFIGURATION_TAMPER' | 'UNAUTHORIZED_ACCESS' | 'POLICY_VIOLATION' | 'SECURITY_BREACH';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  field: string;
  expectedValue: any;
  actualValue: any;
  source: string;
  remediationAction: string;
  autoFixed: boolean;
}
