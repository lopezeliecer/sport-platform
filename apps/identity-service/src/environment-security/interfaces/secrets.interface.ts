export enum SecretType {
  DATABASE_CREDENTIAL = 'database_credential',
  JWT_SECRET = 'jwt_secret',
  API_KEY = 'api_key',
  OAUTH_SECRET = 'oauth_secret',
  ENCRYPTION_KEY = 'encryption_key',
  WEBHOOK_SECRET = 'webhook_secret',
  THIRD_PARTY_TOKEN = 'third_party_token',
  EMAIL_CREDENTIAL = 'email_credential',
}

export enum SecretRotationStatus {
  ACTIVE = 'active',
  PENDING_ROTATION = 'pending_rotation',
  ROTATING = 'rotating',
  DEPRECATED = 'deprecated',
  EXPIRED = 'expired',
}

export interface SecretMetadata {
  id: string;
  name: string;
  type: SecretType;
  description?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
  rotationStatus: SecretRotationStatus;
  rotationInterval?: number; // days
  nextRotationAt?: Date;
  tags: string[];
  environment: string;
  service: string;
  encrypted: boolean;
  compressionEnabled: boolean;
}

export interface EncryptedSecret {
  metadata: SecretMetadata;
  encryptedValue: string;
  salt: string;
  iv: string;
  tag: string;
  algorithm: string;
  keyVersion: number;
}

export interface SecretAccessLog {
  id: string;
  secretId: string;
  secretName: string;
  accessedAt: Date;
  accessedBy: string; // service or user
  operation: 'READ' | 'WRITE' | 'UPDATE' | 'DELETE' | 'ROTATE';
  sourceIp?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  requestId?: string;
}

export interface SecretRotationConfig {
  enabled: boolean;
  automaticRotation: boolean;
  rotationInterval: number; // days
  gracePeriod: number; // days - how long old version remains valid
  maxVersions: number;
  notifyBeforeRotation: number; // hours
  rotationSchedule?: string; // cron expression
}

export interface SecretValidationRule {
  type: SecretType;
  minLength: number;
  maxLength: number;
  requirePattern?: RegExp;
  forbiddenPatterns?: RegExp[];
  entropyThreshold?: number;
  customValidator?: (value: string) => boolean;
}