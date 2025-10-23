import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createCipheriv, createDecipheriv, randomBytes, randomUUID, scrypt } from 'crypto';
import { promisify } from 'util';
import {
  SecretType,
  SecretMetadata,
  EncryptedSecret,
  SecretAccessLog,
  SecretRotationStatus,
  SecretRotationConfig,
  SecretValidationRule,
} from './interfaces/secrets.interface';
import { EnvironmentSecurityService } from './environment-security.service';

const scryptAsync = promisify(scrypt);

@Injectable()
export class SecretsManagementService implements OnModuleInit {
  private readonly logger = new Logger(SecretsManagementService.name);
  private readonly secrets: Map<string, EncryptedSecret> = new Map();
  private readonly accessLogs: SecretAccessLog[] = [];
  private readonly encryptionKeys: Map<number, Buffer> = new Map();
  private currentKeyVersion: number = 1;
  private masterSalt: Buffer;

  // Secret validation rules
  private readonly validationRules: Map<SecretType, SecretValidationRule> = new Map([
    [
      SecretType.DATABASE_CREDENTIAL,
      {
        type: SecretType.DATABASE_CREDENTIAL,
        minLength: 12,
        maxLength: 256,
        requirePattern: /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?\/]+$/,
        entropyThreshold: 3.0,
      },
    ],
    [
      SecretType.JWT_SECRET,
      {
        type: SecretType.JWT_SECRET,
        minLength: 32,
        maxLength: 256,
        entropyThreshold: 4.5,
        customValidator: (value: string) => {
          // JWT secrets should be high-entropy cryptographic keys
          const lower = value.toLowerCase();

          // Reject common weak patterns
          if (
            lower.includes('secret') ||
            lower.includes('password') ||
            lower.includes('jwt') ||
            lower.includes('token') ||
            lower.includes('key') ||
            lower.includes('dev') ||
            lower.includes('test') ||
            lower.includes('demo')
          ) {
            return false;
          }

          // Reject sequential or repeated patterns
          if (
            /(.)\1{3,}/.test(value) || // 4+ repeated chars
            /012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(
              value,
            )
          ) {
            return false;
          }

          // Require good character diversity
          const hasLower = /[a-z]/.test(value);
          const hasUpper = /[A-Z]/.test(value);
          const hasNumber = /[0-9]/.test(value);
          const hasSpecial = /[^a-zA-Z0-9]/.test(value);

          const diversity = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
          return diversity >= 3; // At least 3 different character types
        },
      },
    ],
    [
      SecretType.API_KEY,
      {
        type: SecretType.API_KEY,
        minLength: 32,
        maxLength: 128,
        requirePattern: /^[A-Za-z0-9_-]+$/,
        entropyThreshold: 3.8,
      },
    ],
    [
      SecretType.OAUTH_SECRET,
      {
        type: SecretType.OAUTH_SECRET,
        minLength: 24,
        maxLength: 128,
        entropyThreshold: 3.5,
      },
    ],
    [
      SecretType.ENCRYPTION_KEY,
      {
        type: SecretType.ENCRYPTION_KEY,
        minLength: 64,
        maxLength: 128,
        entropyThreshold: 4.5,
        forbiddenPatterns: [/^[0-9]+$/, /^[a-z]+$/, /^[A-Z]+$/],
      },
    ],
    [
      SecretType.WEBHOOK_SECRET,
      {
        type: SecretType.WEBHOOK_SECRET,
        minLength: 16,
        maxLength: 64,
        entropyThreshold: 3.0,
      },
    ],
    [
      SecretType.THIRD_PARTY_TOKEN,
      {
        type: SecretType.THIRD_PARTY_TOKEN,
        minLength: 20,
        maxLength: 256,
        entropyThreshold: 3.2,
      },
    ],
    [
      SecretType.EMAIL_CREDENTIAL,
      {
        type: SecretType.EMAIL_CREDENTIAL,
        minLength: 8,
        maxLength: 128,
        entropyThreshold: 2.8,
      },
    ],
  ]);

  // Default rotation configurations
  private readonly rotationConfigs: Map<SecretType, SecretRotationConfig> = new Map([
    [
      SecretType.JWT_SECRET,
      {
        enabled: true,
        automaticRotation: true,
        rotationInterval: 30, // 30 days
        gracePeriod: 7, // 7 days
        maxVersions: 3,
        notifyBeforeRotation: 24, // 24 hours
        rotationSchedule: '0 2 * * 0', // Sunday 2 AM
      },
    ],
    [
      SecretType.API_KEY,
      {
        enabled: true,
        automaticRotation: true,
        rotationInterval: 90, // 90 days
        gracePeriod: 14, // 14 days
        maxVersions: 2,
        notifyBeforeRotation: 48, // 48 hours
      },
    ],
    [
      SecretType.ENCRYPTION_KEY,
      {
        enabled: true,
        automaticRotation: true,
        rotationInterval: 365, // 1 year
        gracePeriod: 30, // 30 days
        maxVersions: 2,
        notifyBeforeRotation: 168, // 7 days
      },
    ],
    [
      SecretType.DATABASE_CREDENTIAL,
      {
        enabled: false, // Manual rotation only
        automaticRotation: false,
        rotationInterval: 180, // 6 months
        gracePeriod: 7, // 7 days
        maxVersions: 2,
        notifyBeforeRotation: 72, // 72 hours
      },
    ],
  ]);

  constructor(
    private readonly configService: ConfigService,
    private readonly environmentSecurity: EnvironmentSecurityService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      // Initialize encryption infrastructure
      await this.initializeEncryptionInfrastructure();

      // Load existing secrets from secure storage
      await this.loadSecretsFromEnvironment();

      // Validate all loaded secrets
      await this.validateAllSecrets();

      this.logger.log('Secrets Management Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Secrets Management Service', error.stack);
      throw error;
    }
  }

  /**
   * Initialize encryption infrastructure
   */
  private async initializeEncryptionInfrastructure(): Promise<void> {
    // Generate or load master salt
    const saltConfig = this.configService.get<string>('SECRETS_MASTER_SALT');
    if (saltConfig) {
      this.masterSalt = Buffer.from(saltConfig, 'hex');
    } else {
      this.masterSalt = randomBytes(32);
      this.logger.warn('SECRETS_MASTER_SALT not configured, generated new salt (not persistent)');
    }

    // Initialize encryption keys
    const masterKey = await this.environmentSecurity.encryptSensitiveData('master-key');
    const derivedKey = (await scryptAsync(masterKey, this.masterSalt, 32)) as Buffer;
    this.encryptionKeys.set(this.currentKeyVersion, derivedKey);

    this.logger.debug(
      `Encryption infrastructure initialized with key version ${this.currentKeyVersion}`,
    );
  }

  /**
   * Load secrets from environment variables and configuration
   */
  private async loadSecretsFromEnvironment(): Promise<void> {
    const secretMappings = [
      { env: 'DATABASE_URL', type: SecretType.DATABASE_CREDENTIAL, name: 'database_url' },
      { env: 'JWT_SECRET', type: SecretType.JWT_SECRET, name: 'jwt_secret' },
      { env: 'GOOGLE_CLIENT_SECRET', type: SecretType.OAUTH_SECRET, name: 'google_oauth_secret' },
      { env: 'ENCRYPTION_KEY', type: SecretType.ENCRYPTION_KEY, name: 'master_encryption_key' },
      {
        env: 'ALERT_WEBHOOK_SECRET',
        type: SecretType.WEBHOOK_SECRET,
        name: 'alert_webhook_secret',
      },
      { env: 'EMAIL_PASSWORD', type: SecretType.EMAIL_CREDENTIAL, name: 'email_smtp_password' },
    ];

    for (const mapping of secretMappings) {
      const value = this.configService.get<string>(mapping.env);
      if (value) {
        await this.storeSecret(mapping.name, value, mapping.type, {
          description: `${mapping.type} loaded from ${mapping.env}`,
          tags: ['environment', 'startup'],
        });
      }
    }

    this.logger.debug(`Loaded ${this.secrets.size} secrets from environment`);
  }

  /**
   * Store a secret securely
   */
  async storeSecret(
    name: string,
    value: string,
    type: SecretType,
    options: {
      description?: string;
      tags?: string[];
      expiresAt?: Date;
      rotationInterval?: number;
    } = {},
  ): Promise<string> {
    try {
      // Validate the secret value
      this.validateSecret(value, type);

      // Check if secret already exists and increment version
      const existingSecret = Array.from(this.secrets.values()).find(
        (s) => s.metadata.name === name,
      );
      const version = existingSecret ? existingSecret.metadata.version + 1 : 1;

      // Create metadata
      const metadata: SecretMetadata = {
        id: randomUUID(),
        name,
        type,
        description: options.description,
        version,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: options.expiresAt,
        rotationStatus: SecretRotationStatus.ACTIVE,
        rotationInterval: options.rotationInterval,
        nextRotationAt: this.calculateNextRotation(type, options.rotationInterval),
        tags: options.tags || [],
        environment: this.environmentSecurity.getSecurityConfig().environment,
        service: 'identity-service',
        encrypted: true,
        compressionEnabled: false,
      };

      // Encrypt the secret
      const encryptedSecret = await this.encryptSecret(value, metadata);

      // Store the secret
      this.secrets.set(metadata.id, encryptedSecret);

      // Log access
      await this.logSecretAccess(metadata.id, name, 'WRITE', true);

      // Mark old version as deprecated if exists
      if (existingSecret) {
        existingSecret.metadata.rotationStatus = SecretRotationStatus.DEPRECATED;
      }

      this.logger.debug(`Secret '${name}' stored successfully (version ${version})`);
      return metadata.id;
    } catch (error) {
      await this.logSecretAccess('unknown', name, 'WRITE', false, error.message);
      this.logger.error(`Failed to store secret '${name}'`, error.stack);
      throw error;
    }
  }

  /**
   * Retrieve a secret by name
   */
  async getSecret(name: string): Promise<string> {
    try {
      // Find active secret by name
      const secret = Array.from(this.secrets.values()).find(
        (s) =>
          s.metadata.name === name && s.metadata.rotationStatus === SecretRotationStatus.ACTIVE,
      );

      if (!secret) {
        throw new Error(`Secret '${name}' not found or not active`);
      }

      // Check if secret is expired
      if (secret.metadata.expiresAt && secret.metadata.expiresAt < new Date()) {
        throw new Error(`Secret '${name}' has expired`);
      }

      // Decrypt the secret
      const decryptedValue = await this.decryptSecret(secret);

      // Update last used timestamp
      secret.metadata.lastUsedAt = new Date();

      // Log access
      await this.logSecretAccess(secret.metadata.id, name, 'READ', true);

      return decryptedValue;
    } catch (error) {
      await this.logSecretAccess('unknown', name, 'READ', false, error.message);
      this.logger.error(`Failed to retrieve secret '${name}'`, error.stack);
      throw error;
    }
  }

  /**
   * Rotate a secret (create new version)
   */
  async rotateSecret(name: string, newValue?: string): Promise<string> {
    try {
      const existingSecret = Array.from(this.secrets.values()).find(
        (s) =>
          s.metadata.name === name && s.metadata.rotationStatus === SecretRotationStatus.ACTIVE,
      );

      if (!existingSecret) {
        throw new Error(`Secret '${name}' not found for rotation`);
      }

      // Mark existing secret as rotating
      existingSecret.metadata.rotationStatus = SecretRotationStatus.ROTATING;

      // Generate new value if not provided
      let rotatedValue = newValue;
      if (!rotatedValue) {
        rotatedValue = await this.generateSecretValue(existingSecret.metadata.type);
      }

      // Store new version
      const newSecretId = await this.storeSecret(name, rotatedValue, existingSecret.metadata.type, {
        description: `Rotated version of ${name}`,
        tags: [...existingSecret.metadata.tags, 'rotated'],
        rotationInterval: existingSecret.metadata.rotationInterval,
      });

      // Schedule deprecation of old version after grace period
      const rotationConfig = this.rotationConfigs.get(existingSecret.metadata.type);
      if (rotationConfig?.gracePeriod) {
        setTimeout(
          () => {
            existingSecret.metadata.rotationStatus = SecretRotationStatus.DEPRECATED;
            this.logger.debug(
              `Secret '${name}' old version marked as deprecated after grace period`,
            );
          },
          rotationConfig.gracePeriod * 24 * 60 * 60 * 1000,
        );
      }

      // Log rotation
      await this.logSecretAccess(newSecretId, name, 'ROTATE', true);

      this.logger.log(`Secret '${name}' rotated successfully`);
      return newSecretId;
    } catch (error) {
      await this.logSecretAccess('unknown', name, 'ROTATE', false, error.message);
      this.logger.error(`Failed to rotate secret '${name}'`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a secret
   */
  async deleteSecret(name: string): Promise<void> {
    try {
      const secretsToDelete = Array.from(this.secrets.entries()).filter(
        ([, s]) => s.metadata.name === name,
      );

      if (secretsToDelete.length === 0) {
        throw new Error(`Secret '${name}' not found`);
      }

      // Remove all versions
      for (const [id, secret] of secretsToDelete) {
        this.secrets.delete(id);
        await this.logSecretAccess(id, name, 'DELETE', true);
      }

      this.logger.log(`Secret '${name}' deleted successfully (${secretsToDelete.length} versions)`);
    } catch (error) {
      await this.logSecretAccess('unknown', name, 'DELETE', false, error.message);
      this.logger.error(`Failed to delete secret '${name}'`, error.stack);
      throw error;
    }
  }

  /**
   * List all secrets metadata (without values)
   */
  listSecrets(includeDeprecated: boolean = false): SecretMetadata[] {
    return Array.from(this.secrets.values())
      .filter(
        (s) => includeDeprecated || s.metadata.rotationStatus !== SecretRotationStatus.DEPRECATED,
      )
      .map((s) => ({ ...s.metadata }));
  }

  /**
   * Get secret metadata by name
   */
  getSecretMetadata(name: string): SecretMetadata | undefined {
    const secret = Array.from(this.secrets.values()).find(
      (s) => s.metadata.name === name && s.metadata.rotationStatus === SecretRotationStatus.ACTIVE,
    );
    return secret ? { ...secret.metadata } : undefined;
  }

  /**
   * Check if a secret exists and is active
   */
  hasSecret(name: string): boolean {
    return Array.from(this.secrets.values()).some(
      (s) => s.metadata.name === name && s.metadata.rotationStatus === SecretRotationStatus.ACTIVE,
    );
  }

  /**
   * Validate secret value against rules
   */
  private validateSecret(value: string, type: SecretType): void {
    const rule = this.validationRules.get(type);
    if (!rule) {
      throw new Error(`No validation rule found for secret type: ${type}`);
    }

    this.logger.debug(`Validating secret: type=${type}, length=${value.length}`);

    // Length validation
    if (value.length < rule.minLength) {
      this.logger.error(`Secret too short: ${value.length} < ${rule.minLength}`);
      throw new Error(`Secret too short. Minimum length: ${rule.minLength}`);
    }

    if (value.length > rule.maxLength) {
      this.logger.error(`Secret too long: ${value.length} > ${rule.maxLength}`);
      throw new Error(`Secret too long. Maximum length: ${rule.maxLength}`);
    }

    // Pattern validation
    if (rule.requirePattern && !rule.requirePattern.test(value)) {
      this.logger.error(`Secret does not match required pattern: ${rule.requirePattern}`);
      throw new Error('Secret does not match required pattern');
    }

    // Forbidden patterns
    if (rule.forbiddenPatterns) {
      for (const pattern of rule.forbiddenPatterns) {
        if (pattern.test(value)) {
          this.logger.error(`Secret matches forbidden pattern: ${pattern}`);
          throw new Error('Secret matches forbidden pattern');
        }
      }
    }

    // Entropy validation
    if (rule.entropyThreshold && this.calculateEntropy(value) < rule.entropyThreshold) {
      throw new Error(`Secret entropy too low. Minimum: ${rule.entropyThreshold}`);
    }

    // Custom validation
    if (rule.customValidator && !rule.customValidator(value)) {
      throw new Error('Secret failed custom validation');
    }
  }

  /**
   * Calculate entropy of a string
   */
  private calculateEntropy(str: string): number {
    const freq: { [key: string]: number } = {};

    for (const char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }

    let entropy = 0;
    const length = str.length;

    for (const count of Object.values(freq)) {
      const p = count / length;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  /**
   * Encrypt a secret
   */
  private async encryptSecret(value: string, metadata: SecretMetadata): Promise<EncryptedSecret> {
    const algorithm = 'aes-256-gcm';
    const key = this.encryptionKeys.get(this.currentKeyVersion);
    if (!key) {
      throw new Error('Encryption key not available');
    }

    const iv = randomBytes(16);
    const salt = randomBytes(32);
    const cipher = createCipheriv(algorithm, key, iv);

    cipher.update(value, 'utf8');
    const encrypted = cipher.final();
    const tag = (cipher as any).getAuthTag();

    return {
      metadata,
      encryptedValue: encrypted.toString('base64'),
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      algorithm,
      keyVersion: this.currentKeyVersion,
    };
  }

  /**
   * Decrypt a secret
   */
  private async decryptSecret(secret: EncryptedSecret): Promise<string> {
    const key = this.encryptionKeys.get(secret.keyVersion);
    if (!key) {
      throw new Error(`Encryption key version ${secret.keyVersion} not available`);
    }

    const algorithm = secret.algorithm;
    const iv = Buffer.from(secret.iv, 'base64');
    const tag = Buffer.from(secret.tag, 'base64');
    const encrypted = Buffer.from(secret.encryptedValue, 'base64');

    const decipher = createDecipheriv(algorithm, key, iv);
    (decipher as any).setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return decrypted.toString('utf8');
  }

  /**
   * Generate a secure secret value for a given type
   */
  private async generateSecretValue(type: SecretType): Promise<string> {
    const rule = this.validationRules.get(type);
    const length = rule ? Math.min(rule.maxLength, Math.max(rule.minLength, 64)) : 64;

    switch (type) {
      case SecretType.JWT_SECRET:
        return randomBytes(32).toString('base64url');

      case SecretType.API_KEY:
        return 'sk_' + randomBytes(32).toString('base64url').replace(/[+/=]/g, '');

      case SecretType.ENCRYPTION_KEY:
        return randomBytes(64).toString('hex');

      case SecretType.WEBHOOK_SECRET:
        return randomBytes(24).toString('base64url');

      default:
        return randomBytes(Math.ceil(length / 2)).toString('base64url');
    }
  }

  /**
   * Calculate next rotation date
   */
  private calculateNextRotation(type: SecretType, customInterval?: number): Date | undefined {
    const config = this.rotationConfigs.get(type);
    if (!config?.enabled) {
      return undefined;
    }

    const interval = customInterval || config.rotationInterval;
    const nextRotation = new Date();
    nextRotation.setDate(nextRotation.getDate() + interval);

    return nextRotation;
  }

  /**
   * Validate all secrets
   */
  private async validateAllSecrets(): Promise<void> {
    let validCount = 0;
    let invalidCount = 0;

    for (const secret of this.secrets.values()) {
      try {
        // Check if metadata is valid first
        if (!secret.metadata.name || !secret.metadata.type) {
          throw new Error('Invalid metadata');
        }

        // Skip decryption validation for newly created secrets (within last 5 seconds)
        const secretAge = Date.now() - secret.metadata.createdAt.getTime();
        if (secretAge < 5000) {
          this.logger.debug(
            `Skipping decryption validation for newly created secret: ${secret.metadata.name}`,
          );
          validCount++;
          continue;
        }

        // Check if secret can be decrypted for older secrets
        await this.decryptSecret(secret);
        validCount++;
      } catch (error) {
        invalidCount++;
        // Only log as debug for newly created secrets, warn for older ones
        const secretAge = Date.now() - secret.metadata.createdAt.getTime();
        if (secretAge < 5000) {
          this.logger.debug(
            `Newly created secret validation skipped: ${secret.metadata.name} - ${error.message}`,
          );
          validCount++; // Don't count as invalid for new secrets
          invalidCount--; // Adjust count
        } else {
          this.logger.warn(`Invalid secret detected: ${secret.metadata.name} - ${error.message}`);
        }
      }
    }

    this.logger.log(`Secret validation complete: ${validCount} valid, ${invalidCount} invalid`);

    if (invalidCount > 0) {
      this.logger.warn(`Found ${invalidCount} invalid secrets that may need attention`);
    }
  }

  /**
   * Log secret access
   */
  private async logSecretAccess(
    secretId: string,
    secretName: string,
    operation: SecretAccessLog['operation'],
    success: boolean,
    errorMessage?: string,
  ): Promise<void> {
    const logEntry: SecretAccessLog = {
      id: randomUUID(),
      secretId,
      secretName,
      accessedAt: new Date(),
      accessedBy: 'secrets-management-service',
      operation,
      success,
      errorMessage,
      requestId: randomUUID(),
    };

    this.accessLogs.push(logEntry);

    // Keep only recent logs (last 1000 entries)
    if (this.accessLogs.length > 1000) {
      this.accessLogs.splice(0, this.accessLogs.length - 1000);
    }
  }

  /**
   * Get secret access logs
   */
  getAccessLogs(secretName?: string, limit: number = 100): SecretAccessLog[] {
    let logs = [...this.accessLogs];

    if (secretName) {
      logs = logs.filter((log) => log.secretName === secretName);
    }

    return logs.sort((a, b) => b.accessedAt.getTime() - a.accessedAt.getTime()).slice(0, limit);
  }

  /**
   * Automatic secret rotation (run daily)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async performAutomaticRotation(): Promise<void> {
    this.logger.log('Starting automatic secret rotation check...');

    try {
      const now = new Date();
      let rotatedCount = 0;

      for (const secret of this.secrets.values()) {
        if (
          secret.metadata.rotationStatus === SecretRotationStatus.ACTIVE &&
          secret.metadata.nextRotationAt &&
          secret.metadata.nextRotationAt <= now
        ) {
          const config = this.rotationConfigs.get(secret.metadata.type);

          if (config?.automaticRotation) {
            try {
              await this.rotateSecret(secret.metadata.name);
              rotatedCount++;
              this.logger.log(`Automatically rotated secret: ${secret.metadata.name}`);
            } catch (error) {
              this.logger.error(
                `Failed to auto-rotate secret: ${secret.metadata.name}`,
                error.stack,
              );
            }
          } else {
            // Mark as pending rotation for manual intervention
            secret.metadata.rotationStatus = SecretRotationStatus.PENDING_ROTATION;
            this.logger.warn(`Secret ${secret.metadata.name} requires manual rotation`);
          }
        }
      }

      this.logger.log(`Automatic rotation complete. Rotated ${rotatedCount} secrets.`);
    } catch (error) {
      this.logger.error('Automatic rotation process failed', error.stack);
    }
  }

  /**
   * Cleanup expired and deprecated secrets (run weekly)
   */
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupOldSecrets(): Promise<void> {
    this.logger.log('Starting secret cleanup process...');

    try {
      const now = new Date();
      let cleanedCount = 0;

      for (const [id, secret] of this.secrets.entries()) {
        const shouldCleanup =
          // Expired secrets
          (secret.metadata.expiresAt && secret.metadata.expiresAt < now) ||
          // Deprecated secrets older than 30 days
          (secret.metadata.rotationStatus === SecretRotationStatus.DEPRECATED &&
            now.getTime() - secret.metadata.updatedAt.getTime() > 30 * 24 * 60 * 60 * 1000);

        if (shouldCleanup) {
          this.secrets.delete(id);
          cleanedCount++;
          this.logger.debug(
            `Cleaned up secret: ${secret.metadata.name} (version ${secret.metadata.version})`,
          );
        }
      }

      // Cleanup old access logs (keep only last 30 days)
      const logRetention = 30 * 24 * 60 * 60 * 1000;
      const oldLogCount = this.accessLogs.length;
      this.accessLogs.splice(
        0,
        this.accessLogs.findIndex((log) => now.getTime() - log.accessedAt.getTime() < logRetention),
      );

      const cleanedLogs = oldLogCount - this.accessLogs.length;

      this.logger.log(
        `Cleanup complete. Removed ${cleanedCount} secrets and ${cleanedLogs} old access logs.`,
      );
    } catch (error) {
      this.logger.error('Secret cleanup process failed', error.stack);
    }
  }

  /**
   * Get secrets health status
   */
  getHealthStatus(): {
    totalSecrets: number;
    activeSecrets: number;
    pendingRotation: number;
    deprecated: number;
    expired: number;
    recentAccesses: number;
  } {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats = {
      totalSecrets: this.secrets.size,
      activeSecrets: 0,
      pendingRotation: 0,
      deprecated: 0,
      expired: 0,
      recentAccesses: this.accessLogs.filter((log) => log.accessedAt > oneDayAgo).length,
    };

    for (const secret of this.secrets.values()) {
      switch (secret.metadata.rotationStatus) {
        case SecretRotationStatus.ACTIVE:
          stats.activeSecrets++;
          break;
        case SecretRotationStatus.PENDING_ROTATION:
          stats.pendingRotation++;
          break;
        case SecretRotationStatus.DEPRECATED:
          stats.deprecated++;
          break;
      }

      if (secret.metadata.expiresAt && secret.metadata.expiresAt < now) {
        stats.expired++;
      }
    }

    return stats;
  }
}
