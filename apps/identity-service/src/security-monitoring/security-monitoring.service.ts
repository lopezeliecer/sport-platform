import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  SecurityEvent,
  SecurityAlert,
  SecurityEventType,
  SecuritySeverity,
  SecurityActionType,
  ThreatPattern,
  SecurityMetrics,
} from "./interfaces/security-event.interface";
import { AuditLogService } from "../../../../libs/shared/common/src/audit/audit-log.service";
import {
  AuditEventType,
  AuditSeverity,
  AuditStatus,
} from "../../../../libs/shared/common/src/audit/audit-log.interface";

@Injectable()
export class SecurityMonitoringService {
  private readonly logger = new Logger(SecurityMonitoringService.name);
  private readonly events: Map<string, SecurityEvent> = new Map();
  private readonly alerts: Map<string, SecurityAlert> = new Map();
  private readonly blockedIps: Set<string> = new Set();
  private readonly suspiciousIps: Map<
    string,
    { count: number; lastSeen: Date }
  > = new Map();
  private readonly userFailureCount: Map<
    string,
    { count: number; lastAttempt: Date }
  > = new Map();

  // Threat detection patterns
  private readonly threatPatterns: ThreatPattern[] = [
    {
      name: "Brute Force Attack",
      description: "Multiple failed login attempts from same IP",
      eventTypes: [SecurityEventType.FAILED_LOGIN],
      conditions: {
        timeWindow: 5, // 5 minutes
        threshold: 5,
        requireSameIp: true,
      },
      severity: SecuritySeverity.HIGH,
      actions: [
        SecurityActionType.BLOCK_IP,
        SecurityActionType.ALERT,
        SecurityActionType.NOTIFY_ADMIN,
      ],
    },
    {
      name: "Account Takeover Attempt",
      description: "Multiple failed logins for same user from different IPs",
      eventTypes: [SecurityEventType.FAILED_LOGIN],
      conditions: {
        timeWindow: 10, // 10 minutes
        threshold: 3,
        requireSameUser: true,
      },
      severity: SecuritySeverity.CRITICAL,
      actions: [
        SecurityActionType.LOCK_ACCOUNT,
        SecurityActionType.ALERT,
        SecurityActionType.NOTIFY_ADMIN,
      ],
    },
    {
      name: "Rate Limit Abuse",
      description: "Excessive rate limit violations",
      eventTypes: [SecurityEventType.RATE_LIMIT_EXCEEDED],
      conditions: {
        timeWindow: 5, // 5 minutes
        threshold: 10,
        requireSameIp: true,
      },
      severity: SecuritySeverity.MEDIUM,
      actions: [SecurityActionType.BLOCK_IP, SecurityActionType.ALERT],
    },
    {
      name: "Injection Attack Pattern",
      description: "Multiple injection attempts detected",
      eventTypes: [
        SecurityEventType.SQL_INJECTION_ATTEMPT,
        SecurityEventType.XSS_ATTEMPT,
      ],
      conditions: {
        timeWindow: 15, // 15 minutes
        threshold: 3,
        requireSameIp: true,
      },
      severity: SecuritySeverity.HIGH,
      actions: [
        SecurityActionType.BLOCK_IP,
        SecurityActionType.ALERT,
        SecurityActionType.NOTIFY_ADMIN,
      ],
    },
  ];

  constructor(private readonly auditLogService: AuditLogService) {
    this.logger.log("Security Monitoring Service initialized");
  }

  /**
   * Record a security event and analyze for threats
   */
  async recordSecurityEvent(
    event: Omit<SecurityEvent, "id" | "timestamp">
  ): Promise<void> {
    const securityEvent: SecurityEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    // Store event
    this.events.set(securityEvent.id, securityEvent);

    // Log security event for audit trail
    await this.auditLogService.logEvent({
      eventType: AuditEventType.SECURITY_VIOLATION,
      severity: AuditSeverity.HIGH,
      status: AuditStatus.WARNING,
      message: `Security event detected: ${securityEvent.type}`,
      context: {
        userId: securityEvent.userId,
        clubId: securityEvent.clubId,
        ipAddress: securityEvent.sourceIp,
        userAgent: securityEvent.userAgent,
      },
      resourceType: "security_event",
      resourceId: securityEvent.id,
      newValue: {
        securityEventType: securityEvent.type,
        severity: securityEvent.severity,
        sourceIp: securityEvent.sourceIp,
        details: securityEvent.details,
      },
    });

    // Track IP reputation
    this.updateIpReputation(securityEvent.sourceIp);

    // Track user failure patterns
    if (
      securityEvent.type === SecurityEventType.FAILED_LOGIN &&
      securityEvent.userId
    ) {
      this.updateUserFailureCount(securityEvent.userId);
    }

    // Analyze for threat patterns
    await this.analyzeThreatPatterns(securityEvent);

    this.logger.debug(
      `Security event recorded: ${securityEvent.type} from ${securityEvent.sourceIp}`
    );
  }

  /**
   * Analyze security events for threat patterns
   */
  private async analyzeThreatPatterns(event: SecurityEvent): Promise<void> {
    for (const pattern of this.threatPatterns) {
      if (pattern.eventTypes.includes(event.type)) {
        const matchingEvents = await this.findMatchingEvents(pattern, event);

        if (matchingEvents.length >= pattern.conditions.threshold) {
          await this.triggerThreatAlert(pattern, event, matchingEvents);
        }
      }
    }
  }

  /**
   * Find events matching threat pattern conditions
   */
  private async findMatchingEvents(
    pattern: ThreatPattern,
    currentEvent: SecurityEvent
  ): Promise<SecurityEvent[]> {
    const timeThreshold = new Date(
      Date.now() - pattern.conditions.timeWindow * 60 * 1000
    );

    const matchingEvents = Array.from(this.events.values()).filter((event) => {
      // Check time window
      if (event.timestamp < timeThreshold) return false;

      // Check event type
      if (!pattern.eventTypes.includes(event.type)) return false;

      // Check IP condition
      if (
        pattern.conditions.requireSameIp &&
        event.sourceIp !== currentEvent.sourceIp
      )
        return false;

      // Check user condition
      if (
        pattern.conditions.requireSameUser &&
        event.userId !== currentEvent.userId
      )
        return false;

      return true;
    });

    return matchingEvents;
  }

  /**
   * Trigger security alert and execute actions
   */
  private async triggerThreatAlert(
    pattern: ThreatPattern,
    triggerEvent: SecurityEvent,
    relatedEvents: SecurityEvent[]
  ): Promise<void> {
    const alert: SecurityAlert = {
      id: crypto.randomUUID(),
      eventType: triggerEvent.type,
      severity: pattern.severity,
      message: `${pattern.name}: ${pattern.description}`,
      timestamp: new Date(),
      sourceIp: triggerEvent.sourceIp,
      userId: triggerEvent.userId,
      clubId: triggerEvent.clubId,
      actionsTaken: pattern.actions,
      resolved: false,
    };

    // Store alert
    this.alerts.set(alert.id, alert);

    // Execute security actions
    for (const action of pattern.actions) {
      await this.executeSecurityAction(action, alert, triggerEvent);
    }

    // Log alert
    await this.auditLogService.logEvent({
      eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
      severity: AuditSeverity.CRITICAL,
      status: AuditStatus.WARNING,
      message: `Security alert triggered: ${alert.message}`,
      context: {
        userId: alert.userId,
        clubId: alert.clubId,
        ipAddress: alert.sourceIp,
      },
      resourceType: "security_alert",
      resourceId: alert.id,
      newValue: {
        alertId: alert.id,
        patternName: pattern.name,
        relatedEventsCount: relatedEvents.length,
        actionsTaken: alert.actionsTaken,
      },
    });

    this.logger.warn(
      `Security alert triggered: ${alert.message} (Alert ID: ${alert.id})`
    );
  }

  /**
   * Execute security action
   */
  private async executeSecurityAction(
    action: SecurityActionType,
    alert: SecurityAlert,
    event: SecurityEvent
  ): Promise<void> {
    switch (action) {
      case SecurityActionType.BLOCK_IP:
        this.blockedIps.add(event.sourceIp);
        this.logger.warn(`IP blocked: ${event.sourceIp} (Alert: ${alert.id})`);
        break;

      case SecurityActionType.LOCK_ACCOUNT:
        if (event.userId) {
          // Account locking would be implemented here
          this.logger.warn(
            `Account lock requested for user: ${event.userId} (Alert: ${alert.id})`
          );
        }
        break;

      case SecurityActionType.NOTIFY_ADMIN:
        // Admin notification would be implemented here
        this.logger.error(
          `Admin notification: ${alert.message} (Alert: ${alert.id})`
        );
        break;

      case SecurityActionType.ALERT:
        // Alert system notification
        this.logger.warn(
          `Security alert: ${alert.message} (Alert: ${alert.id})`
        );
        break;

      case SecurityActionType.RATE_LIMIT:
        // Enhanced rate limiting would be implemented here
        this.logger.warn(
          `Enhanced rate limiting applied to IP: ${event.sourceIp} (Alert: ${alert.id})`
        );
        break;

      case SecurityActionType.LOG_ONLY:
        // Already logged above
        break;
    }
  }

  /**
   * Update IP reputation tracking
   */
  private updateIpReputation(ip: string): void {
    const current = this.suspiciousIps.get(ip) || {
      count: 0,
      lastSeen: new Date(),
    };
    current.count++;
    current.lastSeen = new Date();
    this.suspiciousIps.set(ip, current);
  }

  /**
   * Update user failure count tracking
   */
  private updateUserFailureCount(userId: string): void {
    const current = this.userFailureCount.get(userId) || {
      count: 0,
      lastAttempt: new Date(),
    };
    current.count++;
    current.lastAttempt = new Date();
    this.userFailureCount.set(userId, current);
  }

  /**
   * Check if IP is blocked
   */
  isIpBlocked(ip: string): boolean {
    return this.blockedIps.has(ip);
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(timeRange?: { start: Date; end: Date }): SecurityMetrics {
    const now = new Date();
    const defaultStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

    const start = timeRange?.start || defaultStart;
    const end = timeRange?.end || now;

    const eventsInRange = Array.from(this.events.values()).filter(
      (event) => event.timestamp >= start && event.timestamp <= end
    );

    const eventsByType = eventsInRange.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      },
      {} as Record<SecurityEventType, number>
    );

    const eventsBySeverity = eventsInRange.reduce(
      (acc, event) => {
        acc[event.severity] = (acc[event.severity] || 0) + 1;
        return acc;
      },
      {} as Record<SecuritySeverity, number>
    );

    const alertsInRange = Array.from(this.alerts.values()).filter(
      (alert) => alert.timestamp >= start && alert.timestamp <= end
    );

    return {
      totalEvents: eventsInRange.length,
      eventsByType,
      eventsBySeverity,
      uniqueIps: new Set(eventsInRange.map((e) => e.sourceIp)).size,
      blockedIps: this.blockedIps.size,
      alertsGenerated: alertsInRange.length,
      alertsResolved: alertsInRange.filter((a) => a.resolved).length,
      averageResponseTime:
        eventsInRange.reduce(
          (sum, e) => sum + (e.metadata.responseTime || 0),
          0
        ) / eventsInRange.length || 0,
      timeRange: { start, end },
    };
  }

  /**
   * Get recent security alerts
   */
  getRecentAlerts(limit: number = 50): SecurityAlert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Resolve security alert
   */
  async resolveAlert(
    alertId: string,
    resolvedBy: string,
    notes?: string
  ): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;
    alert.notes = notes;

    await this.auditLogService.logEvent({
      eventType: AuditEventType.DATA_UPDATED,
      severity: AuditSeverity.LOW,
      status: AuditStatus.SUCCESS,
      message: `Security alert resolved: ${alert.message}`,
      context: {
        userId: resolvedBy,
      },
      resourceType: "security_alert",
      resourceId: alertId,
      newValue: {
        alertId,
        resolvedBy,
        notes,
      },
    });

    this.logger.log(`Security alert resolved: ${alertId} by ${resolvedBy}`);
  }

  /**
   * Cleanup old events and alerts (run every hour)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldData(): Promise<void> {
    const retentionPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
    const threshold = new Date(Date.now() - retentionPeriod);

    // Cleanup old events
    const eventsToDelete = Array.from(this.events.entries()).filter(
      ([, event]) => event.timestamp < threshold
    );

    for (const [id] of eventsToDelete) {
      this.events.delete(id);
    }

    // Cleanup old IP reputation data
    const ipsToClean = Array.from(this.suspiciousIps.entries()).filter(
      ([, data]) => data.lastSeen < threshold
    );

    for (const [ip] of ipsToClean) {
      this.suspiciousIps.delete(ip);
    }

    // Cleanup old user failure data
    const usersToClean = Array.from(this.userFailureCount.entries()).filter(
      ([, data]) => data.lastAttempt < threshold
    );

    for (const [userId] of usersToClean) {
      this.userFailureCount.delete(userId);
    }

    if (
      eventsToDelete.length > 0 ||
      ipsToClean.length > 0 ||
      usersToClean.length > 0
    ) {
      this.logger.log(
        `Cleaned up ${eventsToDelete.length} old events, ${ipsToClean.length} IP entries, ${usersToClean.length} user entries`
      );
    }
  }

  /**
   * Get system health status
   */
  getHealthStatus(): {
    status: "healthy" | "warning" | "critical";
    details: any;
  } {
    const metrics = this.getSecurityMetrics();
    const recentAlerts = this.getRecentAlerts(10);
    const criticalAlerts = recentAlerts.filter(
      (a) => a.severity === SecuritySeverity.CRITICAL && !a.resolved
    );

    let status: "healthy" | "warning" | "critical" = "healthy";

    if (criticalAlerts.length > 0) {
      status = "critical";
    } else if (this.blockedIps.size > 10 || recentAlerts.length > 20) {
      status = "warning";
    }

    return {
      status,
      details: {
        blockedIps: this.blockedIps.size,
        activeAlerts: recentAlerts.filter((a) => !a.resolved).length,
        criticalAlerts: criticalAlerts.length,
        eventsLast24h: metrics.totalEvents,
        systemUptime: process.uptime(),
      },
    };
  }
}
