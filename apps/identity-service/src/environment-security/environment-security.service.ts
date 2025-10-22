import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createHash, createHmac, randomBytes, scrypt, createCipheriv, createDecipheriv, randomUUID } from 'crypto';
import { promisify } from 'util';
import {
  EnvironmentSecurityConfig,
  EnvironmentType,
  SecurityLevel,
  EnvironmentValidationRule,
  SecurityViolation,
  DatabaseSecurityConfig,
  JwtSecurityConfig,
  RateLimitingConfig,
  EncryptionConfig,
} from './interfaces/environment-security.interface';

const scryptAsync = promisify(scrypt);

@Injectable()
export class EnvironmentSecurityService implements OnModuleInit {
  private readonly logger = new Logger(EnvironmentSecurityService.name);
  private readonly configHash: Map<string, string> = new Map();
  private readonly violations: SecurityViolation[] = [];
  private securityConfig: EnvironmentSecurityConfig;
  private masterKey: Buffer;

  // Environment validation rules
  private readonly validationRules: EnvironmentValidationRule[] = [
    // Core Environment
    { field: 'NODE_ENV', required: true, type: 'string', allowedValues: Object.values(EnvironmentType) },
    { field: 'PORT', required: true, type: 'number', min: 1000, max: 65535 },
    { field: 'HOST', required: false, type: 'string', pattern: /^[a-zA-Z0-9.-]+$/ },
    
    // Security Level
    { field: 'SECURITY_LEVEL', required: true, type: 'string', allowedValues: Object.values(SecurityLevel) },
    { field: 'DEBUG_MODE', required: false, type: 'boolean' },
    
    // Database Security
    { field: 'DATABASE_URL', required: true, type: 'string', pattern: /^postgresql:\/\// },
    { field: 'DATABASE_SSL', required: false, type: 'boolean' },
    { field: 'DATABASE_MAX_CONNECTIONS', required: false, type: 'number', min: 1, max: 1000 },
    
    // JWT Configuration
    { field: 'JWT_SECRET', required: true, type: 'string', min: 32 },
    { field: 'JWT_EXPIRES_IN', required: false, type: 'string', pattern: /^\d+[dhms]$/ },
    { field: 'JWT_REFRESH_EXPIRES_IN', required: false, type: 'string', pattern: /^\d+[dhms]$/ },
    
    // Google OAuth (environment specific)
    {
      field: 'GOOGLE_CLIENT_ID',
      required: false,
      type: 'string',
      environmentSpecific: {
        [EnvironmentType.PRODUCTION]: { required: true },
        [EnvironmentType.STAGING]: { required: true },
      },
    },
    {
      field: 'GOOGLE_CLIENT_SECRET',
      required: false,
      type: 'string',
      environmentSpecific: {
        [EnvironmentType.PRODUCTION]: { required: true },
        [EnvironmentType.STAGING]: { required: true },
      },
    },
    
    // Encryption Settings
    { field: 'ENCRYPTION_KEY', required: true, type: 'string', min: 64 },
    { field: 'ENCRYPTION_ALGORITHM', required: false, type: 'string', allowedValues: ['aes-256-gcm', 'aes-256-cbc'] },
    
    // Rate Limiting
    { field: 'RATE_LIMIT_GLOBAL', required: false, type: 'number', min: 1, max: 10000 },
    { field: 'RATE_LIMIT_AUTH', required: false, type: 'number', min: 1, max: 1000 },
    
    // CORS Configuration
    { field: 'CORS_ORIGIN', required: false, type: 'string' },
    { field: 'CORS_CREDENTIALS', required: false, type: 'boolean' },
    
    // Monitoring & Alerts
    { field: 'ALERT_WEBHOOK_URL', required: false, type: 'string', pattern: /^https?:\/\// },
    { field: 'SLACK_WEBHOOK_URL', required: false, type: 'string', pattern: /^https:\/\/hooks\.slack\.com\// },
  ];

  constructor(private readonly configService: ConfigService) {
    this.logger.log('Environment Security Service initializing...');
  }

  async onModuleInit(): Promise<void> {
    try {
      // Initialize master encryption key
      await this.initializeMasterKey();
      
      // Load and validate environment configuration
      await this.loadSecurityConfiguration();
      
      // Validate all environment variables
      await this.validateEnvironment();
      
      // Create configuration hash for integrity monitoring
      this.createConfigurationHash();
      
      // Log security initialization
      this.logger.log(`Environment Security initialized for ${this.securityConfig.environment} with ${this.securityConfig.securityLevel} security level`);
      
    } catch (error) {
      this.logger.error('Failed to initialize Environment Security Service', error.stack);
      throw error;
    }
  }

  /**
   * Initialize master encryption key from environment
   */
  private async initializeMasterKey(): Promise<void> {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY is required but not provided');
    }

    // Derive master key using scrypt
    const salt = Buffer.from('sports-platform-salt', 'utf8');
    this.masterKey = (await scryptAsync(encryptionKey, salt, 32)) as Buffer;
    
    this.logger.debug('Master encryption key initialized');
  }

  /**
   * Load and construct security configuration from environment
   */
  private async loadSecurityConfiguration(): Promise<void> {
    const environment = this.configService.get<EnvironmentType>('NODE_ENV') || EnvironmentType.DEVELOPMENT;
    const securityLevel = this.configService.get<SecurityLevel>('SECURITY_LEVEL') || SecurityLevel.STANDARD;

    this.securityConfig = {
      // Core Environment
      environment,
      securityLevel,
      debugMode: this.configService.get<boolean>('DEBUG_MODE', false),
      maintenanceMode: this.configService.get<boolean>('MAINTENANCE_MODE', false),
      
      // Service Configuration
      port: this.configService.get<number>('PORT', 3000),
      host: this.configService.get<string>('HOST', 'localhost'),
      baseUrl: this.configService.get<string>('BASE_URL', 'http://localhost:3000'),
      apiVersion: this.configService.get<string>('API_VERSION', 'v1'),
      
      // Security Configurations
      database: this.buildDatabaseConfig(),
      jwt: this.buildJwtConfig(),
      rateLimiting: this.buildRateLimitingConfig(),
      cors: this.buildCorsConfig(),
      encryption: this.buildEncryptionConfig(),
      headers: this.buildSecurityHeadersConfig(),
      audit: this.buildAuditConfig(),
      monitoring: this.buildMonitoringConfig(),
      
      // Feature Flags
      features: {
        apiKeyAuth: this.configService.get<boolean>('FEATURE_API_KEY_AUTH', true),
        socialLogin: this.configService.get<boolean>('FEATURE_SOCIAL_LOGIN', true),
        multiFactorAuth: this.configService.get<boolean>('FEATURE_MFA', false),
        sessionManagement: this.configService.get<boolean>('FEATURE_SESSION_MGMT', true),
        auditLogging: this.configService.get<boolean>('FEATURE_AUDIT_LOGGING', true),
        securityMonitoring: this.configService.get<boolean>('FEATURE_SECURITY_MONITORING', true),
        advancedThreatDetection: this.configService.get<boolean>('FEATURE_ADVANCED_THREATS', securityLevel !== SecurityLevel.MINIMAL),
      },
      
      // External Services
      services: {
        googleOAuth: {
          enabled: !!this.configService.get<string>('GOOGLE_CLIENT_ID'),
          clientId: this.configService.get<string>('GOOGLE_CLIENT_ID'),
          redirectUrl: this.configService.get<string>('GOOGLE_REDIRECT_URL'),
        },
        emailService: {
          enabled: !!this.configService.get<string>('SMTP_HOST'),
          provider: this.configService.get<string>('EMAIL_PROVIDER', 'smtp'),
          smtpHost: this.configService.get<string>('SMTP_HOST'),
          smtpPort: this.configService.get<number>('SMTP_PORT', 587),
          useTLS: this.configService.get<boolean>('SMTP_TLS', true),
        },
        notificationService: {
          enabled: !!this.configService.get<string>('ALERT_WEBHOOK_URL'),
          webhookUrl: this.configService.get<string>('ALERT_WEBHOOK_URL'),
          slackChannel: this.configService.get<string>('SLACK_WEBHOOK_URL'),
        },
      },
      
      // Security Policies
      policies: this.buildSecurityPolicies(securityLevel),
      
      // Compliance Settings
      compliance: this.buildComplianceConfig(environment, securityLevel),
      
      // Development Settings
      development: this.buildDevelopmentConfig(environment),
    };
  }

  /**
   * Build database security configuration
   */
  private buildDatabaseConfig(): DatabaseSecurityConfig {
    const environment = this.configService.get<EnvironmentType>('NODE_ENV');
    const isProduction = environment === EnvironmentType.PRODUCTION;

    return {
      connectionEncrypted: isProduction,
      ssl: this.configService.get<boolean>('DATABASE_SSL', isProduction),
      certificateValidation: this.configService.get<boolean>('DATABASE_CERT_VALIDATION', isProduction),
      connectionPoolSize: this.configService.get<number>('DATABASE_POOL_SIZE', 10),
      queryTimeout: this.configService.get<number>('DATABASE_QUERY_TIMEOUT', 30000),
      maxConnections: this.configService.get<number>('DATABASE_MAX_CONNECTIONS', 100),
    };
  }

  /**
   * Build JWT security configuration
   */
  private buildJwtConfig(): JwtSecurityConfig {
    const environment = this.configService.get<EnvironmentType>('NODE_ENV');
    const isProduction = environment === EnvironmentType.PRODUCTION;

    return {
      algorithm: this.configService.get<string>('JWT_ALGORITHM', 'HS256'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      refreshExpiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      issuer: this.configService.get<string>('JWT_ISSUER', 'sports-platform'),
      audience: this.configService.get<string>('JWT_AUDIENCE', 'sports-platform-api'),
      secretRotationInterval: this.configService.get<number>('JWT_SECRET_ROTATION_HOURS', 168), // 1 week
      requireHttpsOnly: this.configService.get<boolean>('JWT_HTTPS_ONLY', isProduction),
    };
  }

  /**
   * Build rate limiting configuration
   */
  private buildRateLimitingConfig(): RateLimitingConfig {
    const securityLevel = this.configService.get<SecurityLevel>('SECURITY_LEVEL');
    
    const limits = {
      [SecurityLevel.MINIMAL]: { global: 1000, auth: 100 },
      [SecurityLevel.STANDARD]: { global: 500, auth: 50 },
      [SecurityLevel.HIGH]: { global: 200, auth: 20 },
      [SecurityLevel.MAXIMUM]: { global: 100, auth: 10 },
    };

    const config = limits[securityLevel] || limits[SecurityLevel.STANDARD];

    return {
      enabled: this.configService.get<boolean>('RATE_LIMITING_ENABLED', true),
      globalLimit: this.configService.get<number>('RATE_LIMIT_GLOBAL', config.global),
      globalWindow: this.configService.get<number>('RATE_LIMIT_WINDOW', 60), // 1 minute
      authLimit: this.configService.get<number>('RATE_LIMIT_AUTH', config.auth),
      authWindow: this.configService.get<number>('RATE_LIMIT_AUTH_WINDOW', 300), // 5 minutes
      strictMode: securityLevel === SecurityLevel.HIGH || securityLevel === SecurityLevel.MAXIMUM,
      whitelistedIPs: this.parseArrayFromEnv('RATE_LIMIT_WHITELIST_IPS', []),
    };
  }

  /**
   * Build CORS configuration
   */
  private buildCorsConfig() {
    const environment = this.configService.get<EnvironmentType>('NODE_ENV');
    const isProduction = environment === EnvironmentType.PRODUCTION;

    return {
      enabled: this.configService.get<boolean>('CORS_ENABLED', true),
      origin: this.parseCorsOrigin(),
      credentials: this.configService.get<boolean>('CORS_CREDENTIALS', true),
      methods: this.parseArrayFromEnv('CORS_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
      allowedHeaders: this.parseArrayFromEnv('CORS_ALLOWED_HEADERS', ['Content-Type', 'Authorization']),
      maxAge: this.configService.get<number>('CORS_MAX_AGE', 86400),
      preflightContinue: false,
    };
  }

  /**
   * Build encryption configuration
   */
  private buildEncryptionConfig(): EncryptionConfig {
    return {
      algorithm: this.configService.get<string>('ENCRYPTION_ALGORITHM', 'aes-256-gcm'),
      keyDerivationRounds: this.configService.get<number>('ENCRYPTION_KDF_ROUNDS', 100000),
      saltLength: this.configService.get<number>('ENCRYPTION_SALT_LENGTH', 32),
      ivLength: this.configService.get<number>('ENCRYPTION_IV_LENGTH', 16),
      tagLength: this.configService.get<number>('ENCRYPTION_TAG_LENGTH', 16),
      encoding: this.configService.get<'hex' | 'base64'>('ENCRYPTION_ENCODING', 'base64'),
    };
  }

  /**
   * Build security headers configuration
   */
  private buildSecurityHeadersConfig() {
    const environment = this.configService.get<EnvironmentType>('NODE_ENV');
    const isProduction = environment === EnvironmentType.PRODUCTION;

    return {
      helmet: {
        enabled: this.configService.get<boolean>('SECURITY_HEADERS_ENABLED', true),
        contentSecurityPolicy: this.configService.get<boolean>('CSP_ENABLED', isProduction),
        hsts: {
          enabled: this.configService.get<boolean>('HSTS_ENABLED', isProduction),
          maxAge: this.configService.get<number>('HSTS_MAX_AGE', 31536000),
          includeSubDomains: this.configService.get<boolean>('HSTS_INCLUDE_SUBDOMAINS', true),
          preload: this.configService.get<boolean>('HSTS_PRELOAD', false),
        },
        noSniff: this.configService.get<boolean>('NO_SNIFF_ENABLED', true),
        xssFilter: this.configService.get<boolean>('XSS_FILTER_ENABLED', true),
        referrerPolicy: this.configService.get<string>('REFERRER_POLICY', 'strict-origin-when-cross-origin'),
      },
      customHeaders: this.parseCustomHeaders(),
    };
  }

  /**
   * Build audit configuration
   */
  private buildAuditConfig() {
    const securityLevel = this.configService.get<SecurityLevel>('SECURITY_LEVEL');
    const environment = this.configService.get<EnvironmentType>('NODE_ENV');
    
    return {
      enabled: this.configService.get<boolean>('AUDIT_ENABLED', true),
      retentionDays: this.configService.get<number>('AUDIT_RETENTION_DAYS', 365),
      encryptLogs: this.configService.get<boolean>('AUDIT_ENCRYPT_LOGS', environment === EnvironmentType.PRODUCTION),
      realTimeAlerting: this.configService.get<boolean>('AUDIT_REAL_TIME_ALERTS', securityLevel !== SecurityLevel.MINIMAL),
      sensitiveDataRedaction: this.configService.get<boolean>('AUDIT_DATA_REDACTION', true),
      compressionEnabled: this.configService.get<boolean>('AUDIT_COMPRESSION', true),
    };
  }

  /**
   * Build monitoring configuration
   */
  private buildMonitoringConfig() {
    const securityLevel = this.configService.get<SecurityLevel>('SECURITY_LEVEL');
    
    return {
      healthCheckInterval: this.configService.get<number>('MONITORING_HEALTH_INTERVAL', 30),
      securityMetricsInterval: this.configService.get<number>('MONITORING_METRICS_INTERVAL', 60),
      threatDetectionEnabled: this.configService.get<boolean>('MONITORING_THREAT_DETECTION', true),
      anomalyDetectionEnabled: this.configService.get<boolean>('MONITORING_ANOMALY_DETECTION', securityLevel !== SecurityLevel.MINIMAL),
      alertThresholds: {
        failedLogins: this.configService.get<number>('ALERT_THRESHOLD_FAILED_LOGINS', 5),
        rateLimitViolations: this.configService.get<number>('ALERT_THRESHOLD_RATE_LIMIT', 10),
        suspiciousIPs: this.configService.get<number>('ALERT_THRESHOLD_SUSPICIOUS_IPS', 3),
        criticalErrors: this.configService.get<number>('ALERT_THRESHOLD_CRITICAL_ERRORS', 1),
      },
    };
  }

  /**
   * Build security policies based on security level
   */
  private buildSecurityPolicies(securityLevel: SecurityLevel) {
    const policies = {
      [SecurityLevel.MINIMAL]: {
        passwordPolicy: { minLength: 6, requireUppercase: false, requireLowercase: false, requireNumbers: false, requireSpecialChars: false, preventReuse: 0, maxAge: 0 },
        sessionPolicy: { maxDuration: 24, maxConcurrentSessions: 10, requireReauthentication: 24, idleTimeout: 480 },
        accessPolicy: { maxFailedAttempts: 10, lockoutDuration: 5, requireIPWhitelist: false, allowedIPs: [], geoRestrictions: [] },
      },
      [SecurityLevel.STANDARD]: {
        passwordPolicy: { minLength: 8, requireUppercase: true, requireLowercase: true, requireNumbers: true, requireSpecialChars: false, preventReuse: 3, maxAge: 90 },
        sessionPolicy: { maxDuration: 8, maxConcurrentSessions: 5, requireReauthentication: 8, idleTimeout: 120 },
        accessPolicy: { maxFailedAttempts: 5, lockoutDuration: 15, requireIPWhitelist: false, allowedIPs: [], geoRestrictions: [] },
      },
      [SecurityLevel.HIGH]: {
        passwordPolicy: { minLength: 12, requireUppercase: true, requireLowercase: true, requireNumbers: true, requireSpecialChars: true, preventReuse: 5, maxAge: 60 },
        sessionPolicy: { maxDuration: 4, maxConcurrentSessions: 3, requireReauthentication: 4, idleTimeout: 60 },
        accessPolicy: { maxFailedAttempts: 3, lockoutDuration: 30, requireIPWhitelist: false, allowedIPs: [], geoRestrictions: [] },
      },
      [SecurityLevel.MAXIMUM]: {
        passwordPolicy: { minLength: 16, requireUppercase: true, requireLowercase: true, requireNumbers: true, requireSpecialChars: true, preventReuse: 10, maxAge: 30 },
        sessionPolicy: { maxDuration: 2, maxConcurrentSessions: 1, requireReauthentication: 2, idleTimeout: 30 },
        accessPolicy: { maxFailedAttempts: 2, lockoutDuration: 60, requireIPWhitelist: true, allowedIPs: this.parseArrayFromEnv('ALLOWED_IPS', []), geoRestrictions: this.parseArrayFromEnv('GEO_RESTRICTIONS', []) },
      },
    };

    return policies[securityLevel] || policies[SecurityLevel.STANDARD];
  }

  /**
   * Build compliance configuration
   */
  private buildComplianceConfig(environment: EnvironmentType, securityLevel: SecurityLevel) {
    const isProduction = environment === EnvironmentType.PRODUCTION;
    
    return {
      gdprCompliant: this.configService.get<boolean>('COMPLIANCE_GDPR', isProduction),
      dataRetentionDays: this.configService.get<number>('DATA_RETENTION_DAYS', 365),
      rightToErasure: this.configService.get<boolean>('RIGHT_TO_ERASURE', isProduction),
      dataPortability: this.configService.get<boolean>('DATA_PORTABILITY', isProduction),
      consentManagement: this.configService.get<boolean>('CONSENT_MANAGEMENT', isProduction),
      privacyByDesign: this.configService.get<boolean>('PRIVACY_BY_DESIGN', securityLevel !== SecurityLevel.MINIMAL),
    };
  }

  /**
   * Build development configuration
   */
  private buildDevelopmentConfig(environment: EnvironmentType) {
    const isDevelopment = environment === EnvironmentType.DEVELOPMENT;
    
    return {
      seedDatabase: this.configService.get<boolean>('DEV_SEED_DATABASE', isDevelopment),
      enableMocks: this.configService.get<boolean>('DEV_ENABLE_MOCKS', isDevelopment),
      disableAuth: this.configService.get<boolean>('DEV_DISABLE_AUTH', false),
      verboseLogging: this.configService.get<boolean>('DEV_VERBOSE_LOGGING', isDevelopment),
      enableTestEndpoints: this.configService.get<boolean>('DEV_TEST_ENDPOINTS', isDevelopment),
      allowInsecureConnections: this.configService.get<boolean>('DEV_ALLOW_INSECURE', isDevelopment),
    };
  }

  /**
   * Validate all environment variables against rules
   */
  private async validateEnvironment(): Promise<void> {
    const environment = this.configService.get<EnvironmentType>('NODE_ENV');
    const violations: string[] = [];

    for (const rule of this.validationRules) {
      try {
        const value = this.configService.get(rule.field);
        const envSpecific = rule.environmentSpecific?.[environment];
        
        // Check if field is required
        const isRequired = envSpecific?.required ?? rule.required;
        if (isRequired && (value === undefined || value === null || value === '')) {
          violations.push(`Required field '${rule.field}' is missing or empty`);
          continue;
        }
        
        // Skip validation if field is optional and not provided
        if (!isRequired && (value === undefined || value === null || value === '')) {
          continue;
        }
        
        // Type validation
        if (!this.validateType(value, rule.type)) {
          violations.push(`Field '${rule.field}' has invalid type. Expected ${rule.type}, got ${typeof value}`);
          continue;
        }
        
        // Convert value to proper type for further validation
        let convertedValue = value;
        if (rule.type === 'number' && typeof value === 'string') {
          convertedValue = Number(value);
        } else if (rule.type === 'boolean' && typeof value === 'string') {
          convertedValue = value === 'true';
        }
        
        // Pattern validation
        if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
          violations.push(`Field '${rule.field}' does not match required pattern`);
          continue;
        }
        
        // Range validation
        if (rule.min !== undefined && typeof convertedValue === 'number' && convertedValue < rule.min) {
          violations.push(`Field '${rule.field}' is below minimum value ${rule.min}`);
          continue;
        }
        
        if (rule.max !== undefined && typeof convertedValue === 'number' && convertedValue > rule.max) {
          violations.push(`Field '${rule.field}' exceeds maximum value ${rule.max}`);
          continue;
        }
        
        if (rule.min !== undefined && rule.type === 'string' && typeof value === 'string' && value.length < rule.min) {
          violations.push(`Field '${rule.field}' is shorter than minimum length ${rule.min}`);
          continue;
        }
        
        if (rule.max !== undefined && rule.type === 'string' && typeof value === 'string' && value.length > rule.max) {
          violations.push(`Field '${rule.field}' exceeds maximum length ${rule.max}`);
          continue;
        }
        
        // Allowed values validation
        if (rule.allowedValues && !rule.allowedValues.includes(value)) {
          violations.push(`Field '${rule.field}' has invalid value. Allowed values: ${rule.allowedValues.join(', ')}`);
          continue;
        }
        
      } catch (error) {
        violations.push(`Error validating field '${rule.field}': ${error.message}`);
      }
    }

    if (violations.length > 0) {
      this.logger.error('Environment validation failed:');
      violations.forEach(violation => this.logger.error(`  - ${violation}`));
      throw new Error(`Environment validation failed with ${violations.length} violations`);
    }

    this.logger.log('Environment validation completed successfully');
  }

  /**
   * Validate value type
   */
  private validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        // Handle string numbers from environment variables
        if (typeof value === 'string') {
          const parsed = Number(value);
          return !isNaN(parsed) && isFinite(parsed);
        }
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean' || value === 'true' || value === 'false';
      case 'array':
        return Array.isArray(value) || typeof value === 'string';
      case 'object':
        return typeof value === 'object' && value !== null;
      default:
        return true;
    }
  }

  /**
   * Create configuration hash for integrity monitoring
   */
  private createConfigurationHash(): void {
    const configString = JSON.stringify(this.securityConfig, null, 0);
    const hash = createHash('sha256').update(configString).digest('hex');
    this.configHash.set('main', hash);
    
    this.logger.debug(`Configuration hash created: ${hash.substring(0, 16)}...`);
  }

  /**
   * Parse CORS origin from environment
   */
  private parseCorsOrigin(): string | string[] | boolean {
    const origin = this.configService.get<string>('CORS_ORIGIN');
    
    if (!origin || origin === 'false') return false;
    if (origin === 'true' || origin === '*') return true;
    if (origin.includes(',')) return origin.split(',').map(o => o.trim());
    
    return origin;
  }

  /**
   * Parse array from environment variable
   */
  private parseArrayFromEnv(key: string, defaultValue: string[]): string[] {
    const value = this.configService.get<string>(key);
    if (!value) return defaultValue;
    
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }

  /**
   * Parse custom headers from environment
   */
  private parseCustomHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    const customHeadersStr = this.configService.get<string>('CUSTOM_SECURITY_HEADERS');
    
    if (customHeadersStr) {
      try {
        const parsed = JSON.parse(customHeadersStr);
        Object.assign(headers, parsed);
      } catch (error) {
        this.logger.warn('Failed to parse CUSTOM_SECURITY_HEADERS, using empty object');
      }
    }
    
    return headers;
  }

  /**
   * Get current security configuration
   */
  getSecurityConfig(): EnvironmentSecurityConfig {
    return { ...this.securityConfig };
  }

  /**
   * Get specific configuration section
   */
  getDatabaseConfig(): DatabaseSecurityConfig {
    return { ...this.securityConfig.database };
  }

  getJwtConfig(): JwtSecurityConfig {
    return { ...this.securityConfig.jwt };
  }

  getRateLimitingConfig(): RateLimitingConfig {
    return { ...this.securityConfig.rateLimiting };
  }

  getEncryptionConfig(): EncryptionConfig {
    return { ...this.securityConfig.encryption };
  }

  /**
   * Encrypt sensitive data using master key
   */
  async encryptSensitiveData(data: string): Promise<string> {
    try {
      // Ensure configuration is loaded
      if (!this.securityConfig) {
        await this.loadSecurityConfiguration();
      }

      // Ensure master key is initialized
      if (!this.masterKey) {
        await this.initializeMasterKey();
      }

      const algorithm = this.securityConfig.encryption.algorithm;
      const iv = randomBytes(this.securityConfig.encryption.ivLength);
      const cipher = createCipheriv(algorithm, this.masterKey, iv);
      
      let encrypted = cipher.update(data, 'utf8', this.securityConfig.encryption.encoding);
      encrypted += cipher.final(this.securityConfig.encryption.encoding);
      
      // For GCM mode, include auth tag
      const authTag = algorithm.includes('gcm') ? (cipher as any).getAuthTag() : null;
      
      const result = {
        iv: iv.toString(this.securityConfig.encryption.encoding),
        data: encrypted,
        ...(authTag && { authTag: authTag.toString(this.securityConfig.encryption.encoding) }),
      };
      
      return Buffer.from(JSON.stringify(result)).toString('base64');
    } catch (error) {
      this.logger.error('Failed to encrypt sensitive data', error.stack);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive data using master key
   */
  async decryptSensitiveData(encryptedData: string): Promise<string> {
    try {
      // Ensure configuration is loaded
      if (!this.securityConfig) {
        await this.loadSecurityConfiguration();
      }

      // Ensure master key is initialized
      if (!this.masterKey) {
        await this.initializeMasterKey();
      }

      const decoded = JSON.parse(Buffer.from(encryptedData, 'base64').toString('utf8'));
      const algorithm = this.securityConfig.encryption.algorithm;
      const iv = Buffer.from(decoded.iv, this.securityConfig.encryption.encoding);
      const decipher = createDecipheriv(algorithm, this.masterKey, iv);
      
      // For GCM mode, set auth tag
      if (algorithm.includes('gcm') && decoded.authTag) {
        const authTag = Buffer.from(decoded.authTag, this.securityConfig.encryption.encoding);
        (decipher as any).setAuthTag(authTag);
      }
      
      let decrypted = decipher.update(decoded.data, this.securityConfig.encryption.encoding, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error('Failed to decrypt sensitive data', error.stack);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Monitor configuration integrity (run every 5 minutes)
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async monitorConfigurationIntegrity(): Promise<void> {
    try {
      const currentConfig = JSON.stringify(this.securityConfig, null, 0);
      const currentHash = createHash('sha256').update(currentConfig).digest('hex');
      const storedHash = this.configHash.get('main');

      if (currentHash !== storedHash) {
        const violation: SecurityViolation = {
          id: randomUUID(),
          timestamp: new Date(),
          type: 'CONFIGURATION_TAMPER',
          severity: 'CRITICAL',
          field: 'environment_configuration',
          expectedValue: storedHash,
          actualValue: currentHash,
          source: 'configuration_monitor',
          remediationAction: 'ALERT_SECURITY_TEAM',
          autoFixed: false,
        };

        this.violations.push(violation);
        this.logger.error('Configuration integrity violation detected!', {
          violationId: violation.id,
          expectedHash: storedHash?.substring(0, 16),
          actualHash: currentHash.substring(0, 16),
        });

        // Re-validate environment to check for specific changes
        await this.validateEnvironment();
      }
    } catch (error) {
      this.logger.error('Configuration integrity monitoring failed', error.stack);
    }
  }

  /**
   * Get security violations
   */
  getSecurityViolations(): SecurityViolation[] {
    return [...this.violations];
  }

  /**
   * Clear resolved security violations
   */
  clearResolvedViolations(violationIds: string[]): void {
    violationIds.forEach(id => {
      const index = this.violations.findIndex(v => v.id === id);
      if (index !== -1) {
        this.violations.splice(index, 1);
      }
    });
  }

  /**
   * Check if environment is production
   */
  isProduction(): boolean {
    return this.securityConfig.environment === EnvironmentType.PRODUCTION;
  }

  /**
   * Check if security feature is enabled
   */
  isFeatureEnabled(feature: keyof EnvironmentSecurityConfig['features']): boolean {
    return this.securityConfig.features[feature];
  }

  /**
   * Get security level
   */
  getSecurityLevel(): SecurityLevel {
    return this.securityConfig.securityLevel;
  }
}