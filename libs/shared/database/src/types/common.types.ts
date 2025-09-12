// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================================================
// FILTER AND SEARCH TYPES
// ============================================================================

export interface DateRangeFilter {
  from?: Date | string;
  to?: Date | string;
}

export interface SearchOptions {
  query?: string;
  filters?: Record<string, any>;
  dateRange?: DateRangeFilter;
  sport?: string;
  category?: string;
  level?: string;
  isActive?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface BulkOperationResult {
  total: number;
  successful: number;
  failed: number;
  errors?: Array<{
    index: number;
    error: string;
  }>;
}

// ============================================================================
// MULTI-TENANCY TYPES
// ============================================================================

export interface ClubContext {
  clubId: string;
  clubSlug: string;
  userRole: string;
  permissions: string[];
}

export interface UserContext {
  userId: string;
  email: string;
  name: string;
  roles: Array<{
    clubId: string;
    role: string;
    permissions: string[];
  }>;
  currentClub?: ClubContext;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  value: any;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// QUERY BUILDER TYPES
// ============================================================================

export interface QueryCondition {
  field: string;
  operator:
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in"
    | "nin"
    | "like"
    | "ilike"
    | "between";
  value: any;
}

export interface QueryOptions {
  where?: QueryCondition[];
  orderBy?: Array<{
    field: string;
    direction: "asc" | "desc";
  }>;
  include?: string[];
  select?: string[];
  groupBy?: string[];
  having?: QueryCondition[];
}

// ============================================================================
// AUDIT AND LOGGING TYPES
// ============================================================================

export interface AuditEntry {
  id: string;
  userId?: string;
  clubId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    timestamp: string;
  };
}

export interface SystemEvent {
  type: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  category: string;
  message: string;
  data?: Record<string, any>;
  timestamp: string;
  source: string;
}

// ============================================================================
// PERFORMANCE MONITORING TYPES
// ============================================================================

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface DatabaseStats {
  connectionCount: number;
  activeQueries: number;
  slowQueries: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface NotificationTemplate {
  id: string;
  name: string;
  type: "email" | "sms" | "push" | "in_app";
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
}

export interface NotificationQueue {
  id: string;
  templateId: string;
  recipientId: string;
  channel: "email" | "sms" | "push" | "in_app";
  priority: "low" | "normal" | "high" | "urgent";
  scheduledAt?: string;
  sentAt?: string;
  status: "pending" | "sent" | "failed" | "cancelled";
  retryCount: number;
  data: Record<string, any>;
}

// ============================================================================
// CACHING TYPES
// ============================================================================

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  ttl: number; // seconds
  createdAt: string;
  tags?: string[];
}

export interface CacheOptions {
  ttl?: number; // seconds
  tags?: string[];
  refreshCallback?: () => Promise<any>;
}

// ============================================================================
// FILE PROCESSING TYPES
// ============================================================================

export interface FileUploadOptions {
  maxSize?: number; // bytes
  allowedTypes?: string[];
  generateThumbnail?: boolean;
  virusScan?: boolean;
  compressionQuality?: number;
}

export interface FileProcessingJob {
  id: string;
  fileId: string;
  type: "thumbnail" | "compression" | "virus_scan" | "format_conversion";
  status: "pending" | "processing" | "completed" | "failed";
  progress: number; // 0-100
  result?: any;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// ============================================================================
// IMPORT/EXPORT TYPES
// ============================================================================

export interface ImportOptions {
  format: "csv" | "excel" | "json" | "xml";
  hasHeaders?: boolean;
  mapping?: Record<string, string>; // column name to field name
  validation?: {
    required?: string[];
    unique?: string[];
    format?: Record<string, string>;
  };
  batchSize?: number;
}

export interface ExportOptions {
  format: "csv" | "excel" | "json" | "pdf";
  fields?: string[];
  filters?: Record<string, any>;
  template?: string;
  includeHeaders?: boolean;
}

export interface ImportResult {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: Array<{
    row: number;
    field?: string;
    value?: any;
    error: string;
  }>;
  warnings: Array<{
    row: number;
    message: string;
  }>;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  connectionPoolSize?: number;
  connectionTimeout?: number;
  queryTimeout?: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  database?: number;
  keyPrefix?: string;
  maxRetries?: number;
}

export interface StorageConfig {
  provider: "local" | "s3" | "gcs" | "azure";
  bucket?: string;
  region?: string;
  accessKey?: string;
  secretKey?: string;
  basePath?: string;
  publicUrl?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

export type WithTimestamps<T> = T & {
  createdAt: Date;
  updatedAt: Date;
};

export type WithSoftDelete<T> = T & {
  isActive: boolean;
  deletedAt?: Date;
};

export type EntityId = string;
export type ClubId = string;
export type UserId = string;
export type AthleteId = string;

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface AppError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
  timestamp: string;
  path?: string;
  method?: string;
}

export interface DatabaseError extends AppError {
  query?: string;
  parameters?: any[];
  constraint?: string;
  table?: string;
  column?: string;
}

export interface ValidationErrorDetail {
  field: string;
  value: any;
  constraints: Record<string, string>;
}

// ============================================================================
// BUSINESS LOGIC TYPES
// ============================================================================

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  condition: string; // JavaScript expression
  action: string; // Action to take when condition is met
  priority: number;
  isActive: boolean;
  appliesTo: string[]; // Entity types this rule applies to
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: "approval" | "notification" | "automation" | "validation";
  config: Record<string, any>;
  nextSteps: string[];
  timeout?: number; // seconds
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  triggerEvents: string[];
  steps: WorkflowStep[];
  isActive: boolean;
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, any>;
  signature?: string;
  version: string;
}

export interface ExternalApiCredentials {
  provider: string;
  apiKey?: string;
  secretKey?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  baseUrl?: string;
  rateLimits?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
}
