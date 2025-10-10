import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { randomUUID } from "crypto";
import {
  AuditLogEntry,
  AuditEventType,
  AuditSeverity,
  AuditStatus,
  AuditContext,
  AuditQueryOptions,
  AuditStatistics,
  AuditAlert,
} from "./audit-log.interface";

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);
  private readonly auditLogs: Map<string, AuditLogEntry> = new Map();
  private readonly alerts: Map<string, AuditAlert> = new Map();
  private readonly maxLogEntries: number;
  private readonly alertThresholds: Map<string, number> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.maxLogEntries = this.configService.get<number>(
      "AUDIT_MAX_ENTRIES",
      50000
    );
    this.initializeAlertThresholds();

    // Log service initialization
    this.logEvent({
      eventType: AuditEventType.SERVICE_STARTED,
      severity: AuditSeverity.LOW,
      status: AuditStatus.SUCCESS,
      message: "Audit logging service started",
      context: {
        service: "audit-log-service",
        maxLogEntries: this.maxLogEntries,
      },
    });
  }

  /**
   * Log an audit event
   */
  async logEvent(params: {
    eventType: AuditEventType;
    severity: AuditSeverity;
    status: AuditStatus;
    message: string;
    description?: string;
    context?: AuditContext;
    resourceType?: string;
    resourceId?: string;
    previousValue?: any;
    newValue?: any;
    errorCode?: string;
    errorMessage?: string;
    stackTrace?: string;
  }): Promise<AuditLogEntry> {
    const entry: AuditLogEntry = {
      id: randomUUID(),
      timestamp: new Date(),
      eventType: params.eventType,
      severity: params.severity,
      status: params.status,
      message: params.message,
      description: params.description,
      context: params.context || {},
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      previousValue: params.previousValue,
      newValue: params.newValue,
      errorCode: params.errorCode,
      errorMessage: params.errorMessage,
      stackTrace: params.stackTrace,
      retentionPolicy: this.determineRetentionPolicy(
        params.eventType,
        params.severity
      ),
      sensitiveData: this.containsSensitiveData(params),
      complianceFlags: this.determineComplianceFlags(params.eventType),
    };

    // Store the log entry
    this.auditLogs.set(entry.id, entry);

    // Check for security alerts
    await this.checkForSecurityAlerts(entry);

    // Log to console for development
    this.logToConsole(entry);

    // Cleanup old entries if needed
    this.cleanupOldEntries();

    this.logger.debug(
      `Audit event logged: ${entry.eventType} - ${entry.message}`
    );
    return entry;
  }

  /**
   * Authentication event logging helpers
   */
  async logAuthenticationSuccess(
    userId: string,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.LOGIN_SUCCESS,
      severity: AuditSeverity.LOW,
      status: AuditStatus.SUCCESS,
      message: `User ${context.userEmail || userId} successfully authenticated`,
      context: { ...context, userId },
      resourceType: "user",
      resourceId: userId,
    });
  }

  async logAuthenticationFailure(
    email: string,
    context: AuditContext,
    reason: string
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.LOGIN_FAILED,
      severity: AuditSeverity.MEDIUM,
      status: AuditStatus.FAILURE,
      message: `Authentication failed for user ${email}`,
      description: reason,
      context: { ...context, userEmail: email },
      resourceType: "user",
      errorMessage: reason,
    });
  }

  async logLogout(userId: string, context: AuditContext): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.LOGOUT,
      severity: AuditSeverity.LOW,
      status: AuditStatus.SUCCESS,
      message: `User ${context.userEmail || userId} logged out`,
      context: { ...context, userId },
      resourceType: "session",
      resourceId: context.sessionId,
    });
  }

  /**
   * Authorization event logging helpers
   */
  async logAccessDenied(
    userId: string,
    resource: string,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.ACCESS_DENIED,
      severity: AuditSeverity.MEDIUM,
      status: AuditStatus.FAILURE,
      message: `Access denied for user ${context.userEmail || userId} to ${resource}`,
      context: { ...context, userId },
      resourceType: "endpoint",
      resourceId: resource,
    });
  }

  async logPermissionCheck(
    userId: string,
    permission: string,
    granted: boolean,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.PERMISSION_CHECK,
      severity: AuditSeverity.LOW,
      status: granted ? AuditStatus.SUCCESS : AuditStatus.FAILURE,
      message: `Permission check for ${permission}: ${granted ? "granted" : "denied"}`,
      context: { ...context, userId },
      resourceType: "permission",
      resourceId: permission,
    });
  }

  /**
   * Security event logging helpers
   */
  async logRateLimitExceeded(context: AuditContext): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
      severity: AuditSeverity.HIGH,
      status: AuditStatus.WARNING,
      message: `Rate limit exceeded from IP ${context.ipAddress}`,
      context,
      resourceType: "rate_limit",
    });
  }

  async logSuspiciousActivity(
    description: string,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
      severity: AuditSeverity.HIGH,
      status: AuditStatus.WARNING,
      message: "Suspicious activity detected",
      description,
      context,
    });
  }

  async logSecurityViolation(
    violation: string,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.SECURITY_VIOLATION,
      severity: AuditSeverity.CRITICAL,
      status: AuditStatus.ERROR,
      message: "Security violation detected",
      description: violation,
      context,
    });
  }

  /**
   * API Key event logging helpers
   */
  async logApiKeyUsage(keyId: string, context: AuditContext): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.API_KEY_USED,
      severity: AuditSeverity.LOW,
      status: AuditStatus.SUCCESS,
      message: `API key used by service ${context.service}`,
      context: { ...context, apiKeyId: keyId },
      resourceType: "api_key",
      resourceId: keyId,
    });
  }

  async logApiKeyCreated(
    keyId: string,
    service: string,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.API_KEY_CREATED,
      severity: AuditSeverity.MEDIUM,
      status: AuditStatus.SUCCESS,
      message: `API key created for service ${service}`,
      context: { ...context, service, apiKeyId: keyId },
      resourceType: "api_key",
      resourceId: keyId,
    });
  }

  /**
   * Data access logging helpers
   */
  async logDataAccess(
    operation: "read" | "create" | "update" | "delete",
    resourceType: string,
    resourceId: string,
    context: AuditContext
  ): Promise<void> {
    const eventTypeMap = {
      read: AuditEventType.DATA_READ,
      create: AuditEventType.DATA_CREATED,
      update: AuditEventType.DATA_UPDATED,
      delete: AuditEventType.DATA_DELETED,
    };

    await this.logEvent({
      eventType: eventTypeMap[operation],
      severity:
        operation === "delete" ? AuditSeverity.MEDIUM : AuditSeverity.LOW,
      status: AuditStatus.SUCCESS,
      message: `${operation.toUpperCase()} operation on ${resourceType}`,
      context,
      resourceType,
      resourceId,
    });
  }

  /**
   * Query audit logs
   */
  async queryLogs(options: AuditQueryOptions = {}): Promise<{
    logs: AuditLogEntry[];
    total: number;
    hasMore: boolean;
  }> {
    let filteredLogs = Array.from(this.auditLogs.values());

    // Apply filters
    if (options.startDate) {
      filteredLogs = filteredLogs.filter(
        (log) => log.timestamp >= options.startDate!
      );
    }
    if (options.endDate) {
      filteredLogs = filteredLogs.filter(
        (log) => log.timestamp <= options.endDate!
      );
    }
    if (options.eventTypes?.length) {
      filteredLogs = filteredLogs.filter((log) =>
        options.eventTypes!.includes(log.eventType)
      );
    }
    if (options.severities?.length) {
      filteredLogs = filteredLogs.filter((log) =>
        options.severities!.includes(log.severity)
      );
    }
    if (options.statuses?.length) {
      filteredLogs = filteredLogs.filter((log) =>
        options.statuses!.includes(log.status)
      );
    }
    if (options.userIds?.length) {
      filteredLogs = filteredLogs.filter((log) =>
        options.userIds!.includes(log.context.userId || "")
      );
    }
    if (options.services?.length) {
      filteredLogs = filteredLogs.filter((log) =>
        options.services!.includes(log.context.service || "")
      );
    }
    if (options.searchTerm) {
      const term = options.searchTerm.toLowerCase();
      filteredLogs = filteredLogs.filter(
        (log) =>
          log.message.toLowerCase().includes(term) ||
          log.description?.toLowerCase().includes(term) ||
          log.context.userEmail?.toLowerCase().includes(term)
      );
    }

    // Sort logs
    const sortBy = options.sortBy || "timestamp";
    const sortOrder = options.sortOrder || "DESC";
    filteredLogs.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "timestamp":
          aValue = a.timestamp.getTime();
          bValue = b.timestamp.getTime();
          break;
        case "severity":
          const severityOrder = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
          aValue = severityOrder[a.severity];
          bValue = severityOrder[b.severity];
          break;
        case "eventType":
          aValue = a.eventType;
          bValue = b.eventType;
          break;
        default:
          aValue = a.timestamp.getTime();
          bValue = b.timestamp.getTime();
      }

      if (sortOrder === "ASC") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const total = filteredLogs.length;
    const offset = options.offset || 0;
    const limit = options.limit || 100;
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      logs: paginatedLogs,
      total,
      hasMore,
    };
  }

  /**
   * Get audit statistics
   */
  async getStatistics(days: number = 30): Promise<AuditStatistics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const recentLogs = Array.from(this.auditLogs.values()).filter(
      (log) => log.timestamp >= startDate
    );

    // Count events by type
    const eventsByType = {} as Record<AuditEventType, number>;
    Object.values(AuditEventType).forEach((type) => {
      eventsByType[type] = 0;
    });
    recentLogs.forEach((log) => {
      eventsByType[log.eventType]++;
    });

    // Count events by severity
    const eventsBySeverity = {} as Record<AuditSeverity, number>;
    Object.values(AuditSeverity).forEach((severity) => {
      eventsBySeverity[severity] = 0;
    });
    recentLogs.forEach((log) => {
      eventsBySeverity[log.severity]++;
    });

    // Count events by status
    const eventsByStatus = {} as Record<AuditStatus, number>;
    Object.values(AuditStatus).forEach((status) => {
      eventsByStatus[status] = 0;
    });
    recentLogs.forEach((log) => {
      eventsByStatus[log.status]++;
    });

    // Events over time (daily)
    const eventsOverTime: Array<{ date: string; count: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const count = recentLogs.filter(
        (log) => log.timestamp.toISOString().split("T")[0] === dateStr
      ).length;

      eventsOverTime.push({ date: dateStr, count });
    }

    // Top users by event count
    const userCounts = new Map<string, { email: string; count: number }>();
    recentLogs.forEach((log) => {
      if (log.context.userId) {
        const existing = userCounts.get(log.context.userId) || {
          email: log.context.userEmail || "Unknown",
          count: 0,
        };
        existing.count++;
        userCounts.set(log.context.userId, existing);
      }
    });
    const topUsers = Array.from(userCounts.entries())
      .map(([userId, data]) => ({
        userId,
        userEmail: data.email,
        eventCount: data.count,
      }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    // Top services by event count
    const serviceCounts = new Map<string, number>();
    recentLogs.forEach((log) => {
      if (log.context.service) {
        serviceCounts.set(
          log.context.service,
          (serviceCounts.get(log.context.service) || 0) + 1
        );
      }
    });
    const topServices = Array.from(serviceCounts.entries())
      .map(([service, eventCount]) => ({ service, eventCount }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    // Security alerts summary
    const securityEventTypes = [
      AuditEventType.RATE_LIMIT_EXCEEDED,
      AuditEventType.SUSPICIOUS_ACTIVITY,
      AuditEventType.SECURITY_VIOLATION,
      AuditEventType.BRUTE_FORCE_ATTEMPT,
      AuditEventType.ACCESS_DENIED,
    ];
    const securityAlerts = securityEventTypes
      .map((eventType) => {
        const events = recentLogs.filter((log) => log.eventType === eventType);
        return {
          alertType: eventType,
          count: events.length,
          lastOccurrence:
            events.length > 0
              ? events.sort(
                  (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
                )[0].timestamp
              : new Date(0),
        };
      })
      .filter((alert) => alert.count > 0);

    return {
      totalEvents: recentLogs.length,
      eventsByType,
      eventsBySeverity,
      eventsByStatus,
      eventsOverTime,
      topUsers,
      topServices,
      securityAlerts,
    };
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<AuditAlert[]> {
    return Array.from(this.alerts.values())
      .filter((alert) => alert.isActive)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Private helper methods
   */
  private initializeAlertThresholds(): void {
    this.alertThresholds.set(AuditEventType.LOGIN_FAILED, 5); // 5 failed logins
    this.alertThresholds.set(AuditEventType.RATE_LIMIT_EXCEEDED, 3); // 3 rate limit hits
    this.alertThresholds.set(AuditEventType.ACCESS_DENIED, 10); // 10 access denied
    this.alertThresholds.set(AuditEventType.SECURITY_VIOLATION, 1); // Any security violation
  }

  private async checkForSecurityAlerts(entry: AuditLogEntry): Promise<void> {
    const threshold = this.alertThresholds.get(entry.eventType);
    if (!threshold) return;

    // Count recent similar events from same IP/user
    const recentEvents = Array.from(this.auditLogs.values()).filter(
      (log) =>
        log.eventType === entry.eventType &&
        log.timestamp.getTime() > Date.now() - 300000 && // Last 5 minutes
        (log.context.ipAddress === entry.context.ipAddress ||
          log.context.userId === entry.context.userId)
    );

    if (recentEvents.length >= threshold) {
      const alert: AuditAlert = {
        id: randomUUID(),
        timestamp: new Date(),
        alertType: `THRESHOLD_EXCEEDED_${entry.eventType}`,
        severity: entry.severity,
        message: `${entry.eventType} threshold exceeded: ${recentEvents.length} events in 5 minutes`,
        triggerCondition: `${threshold} ${entry.eventType} events in 5 minutes`,
        relatedEvents: recentEvents.map((e) => e.id),
        isActive: true,
      };

      this.alerts.set(alert.id, alert);
      this.logger.warn(`Security alert triggered: ${alert.message}`);
    }
  }

  private determineRetentionPolicy(
    eventType: AuditEventType,
    severity: AuditSeverity
  ): string {
    if (severity === AuditSeverity.CRITICAL) return "7_YEARS";
    if (severity === AuditSeverity.HIGH) return "3_YEARS";
    if (eventType.includes("LOGIN") || eventType.includes("ACCESS"))
      return "1_YEAR";
    return "6_MONTHS";
  }

  private containsSensitiveData(params: any): boolean {
    // Check if the event contains sensitive data that needs special handling
    const sensitiveFields = [
      "password",
      "token",
      "secret",
      "key",
      "credential",
    ];
    const dataStr = JSON.stringify(params).toLowerCase();
    return sensitiveFields.some((field) => dataStr.includes(field));
  }

  private determineComplianceFlags(eventType: AuditEventType): string[] {
    const flags = [];

    // GDPR compliance
    if (eventType.includes("USER") || eventType.includes("DATA")) {
      flags.push("GDPR");
    }

    // SOX compliance for financial data
    if (eventType.includes("PAYMENT") || eventType.includes("BILLING")) {
      flags.push("SOX");
    }

    // HIPAA for medical data
    if (eventType.includes("MEDICAL")) {
      flags.push("HIPAA");
    }

    return flags;
  }

  private logToConsole(entry: AuditLogEntry): void {
    const level = this.getSeverityLogLevel(entry.severity);
    const contextStr = entry.context.userId
      ? `[User: ${entry.context.userEmail || entry.context.userId}]`
      : "[System]";

    this.logger[level](`${contextStr} ${entry.eventType}: ${entry.message}`);
  }

  private getSeverityLogLevel(
    severity: AuditSeverity
  ): "log" | "warn" | "error" {
    switch (severity) {
      case AuditSeverity.LOW:
        return "log";
      case AuditSeverity.MEDIUM:
        return "log";
      case AuditSeverity.HIGH:
        return "warn";
      case AuditSeverity.CRITICAL:
        return "error";
      default:
        return "log";
    }
  }

  private cleanupOldEntries(): void {
    if (this.auditLogs.size <= this.maxLogEntries) return;

    // Remove oldest entries when limit is exceeded
    const entries = Array.from(this.auditLogs.entries()).sort(
      ([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    const toRemove = entries.slice(0, entries.length - this.maxLogEntries);
    toRemove.forEach(([id]) => this.auditLogs.delete(id));

    this.logger.debug(`Cleaned up ${toRemove.length} old audit log entries`);
  }

  /**
   * Scheduled task to clean up old alerts every hour
   * Using @nestjs/schedule for proper lifecycle management
   */
  @Cron(CronExpression.EVERY_HOUR)
  handleAlertCleanup() {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const initialAlertCount = this.alerts.size;

      const activeAlerts = Array.from(this.alerts.entries()).filter(
        ([, alert]) => alert.timestamp > oneDayAgo
      );

      this.alerts.clear();
      activeAlerts.forEach(([id, alert]) => this.alerts.set(id, alert));

      const cleanedCount = initialAlertCount - activeAlerts.length;
      if (cleanedCount > 0) {
        this.logger.debug(
          `Scheduled cleanup: removed ${cleanedCount} old alerts`
        );
      }
    } catch (error) {
      this.logger.error("Error during scheduled alert cleanup:", error);
    }
  }
}
