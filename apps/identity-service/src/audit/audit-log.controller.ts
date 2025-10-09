import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Post,
  Body,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { AuditLogService } from "../../../../libs/shared/common/src/audit/audit-log.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RbacGuard } from "../auth/guards/rbac.guard";
import { RequireClubAdmin } from "../auth/decorators/permissions.decorator";
import { ThrottleAPI } from "../../../../libs/shared/common/src/security/throttle.decorators";
import {
  AuditEventType,
  AuditSeverity,
  AuditStatus,
  AuditQueryOptions,
} from "../../../../libs/shared/common/src/audit/audit-log.interface";

export class AuditQueryDto {
  startDate?: string;
  endDate?: string;
  eventTypes?: string;
  severities?: string;
  statuses?: string;
  userIds?: string;
  services?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
  sortBy?: "timestamp" | "severity" | "eventType";
  sortOrder?: "ASC" | "DESC";
}

export class ManualAuditLogDto {
  eventType: AuditEventType;
  severity: AuditSeverity;
  message: string;
  description?: string;
  resourceType?: string;
  resourceId?: string;
}

@ApiTags("Audit Logging")
@Controller("audit")
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
@ThrottleAPI()
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get("logs")
  @RequireClubAdmin()
  @ApiOperation({
    summary: "Query audit logs",
    description:
      "Retrieve audit logs with filtering, searching, and pagination options",
  })
  @ApiQuery({
    name: "startDate",
    required: false,
    description: "Start date (ISO string)",
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    description: "End date (ISO string)",
  })
  @ApiQuery({
    name: "eventTypes",
    required: false,
    description: "Comma-separated event types",
  })
  @ApiQuery({
    name: "severities",
    required: false,
    description: "Comma-separated severities",
  })
  @ApiQuery({
    name: "statuses",
    required: false,
    description: "Comma-separated statuses",
  })
  @ApiQuery({
    name: "userIds",
    required: false,
    description: "Comma-separated user IDs",
  })
  @ApiQuery({
    name: "services",
    required: false,
    description: "Comma-separated services",
  })
  @ApiQuery({
    name: "searchTerm",
    required: false,
    description: "Search term for message/description",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Number of results to return (default: 100)",
  })
  @ApiQuery({
    name: "offset",
    required: false,
    description: "Offset for pagination (default: 0)",
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    description: "Sort field (timestamp, severity, eventType)",
  })
  @ApiQuery({
    name: "sortOrder",
    required: false,
    description: "Sort order (ASC, DESC)",
  })
  @ApiResponse({
    status: 200,
    description: "Audit logs retrieved successfully",
  })
  async queryLogs(@Query() query: AuditQueryDto) {
    const options: AuditQueryOptions = {
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      eventTypes: query.eventTypes
        ? query.eventTypes.split(",").map((t) => t.trim() as AuditEventType)
        : undefined,
      severities: query.severities
        ? query.severities.split(",").map((s) => s.trim() as AuditSeverity)
        : undefined,
      statuses: query.statuses
        ? query.statuses.split(",").map((s) => s.trim() as AuditStatus)
        : undefined,
      userIds: query.userIds
        ? query.userIds.split(",").map((u) => u.trim())
        : undefined,
      services: query.services
        ? query.services.split(",").map((s) => s.trim())
        : undefined,
      searchTerm: query.searchTerm,
      limit: query.limit,
      offset: query.offset,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };

    const result = await this.auditLogService.queryLogs(options);

    return {
      message: "Audit logs retrieved successfully",
      data: result.logs,
      pagination: {
        total: result.total,
        limit: options.limit || 100,
        offset: options.offset || 0,
        hasMore: result.hasMore,
      },
      filters: options,
    };
  }

  @Get("statistics")
  @RequireClubAdmin()
  @ApiOperation({
    summary: "Get audit statistics",
    description: "Retrieve comprehensive audit statistics and analytics",
  })
  @ApiQuery({
    name: "days",
    required: false,
    description: "Number of days to analyze (default: 30)",
  })
  @ApiResponse({
    status: 200,
    description: "Audit statistics retrieved successfully",
  })
  async getStatistics(@Query("days") days?: string) {
    const analysisDays = days ? parseInt(days, 10) : 30;
    const statistics = await this.auditLogService.getStatistics(analysisDays);

    return {
      message: "Audit statistics retrieved successfully",
      statistics,
      period: `${analysisDays} days`,
      generatedAt: new Date().toISOString(),
    };
  }

  @Get("alerts")
  @RequireClubAdmin()
  @ApiOperation({
    summary: "Get active security alerts",
    description:
      "Retrieve all active security alerts based on audit log analysis",
  })
  @ApiResponse({
    status: 200,
    description: "Security alerts retrieved successfully",
  })
  async getActiveAlerts() {
    const alerts = await this.auditLogService.getActiveAlerts();

    return {
      message: "Security alerts retrieved successfully",
      alerts,
      alertCount: alerts.length,
      retrievedAt: new Date().toISOString(),
    };
  }

  @Get("event-types")
  @RequireClubAdmin()
  @ApiOperation({
    summary: "Get available event types",
    description: "Retrieve all available audit event types for filtering",
  })
  @ApiResponse({
    status: 200,
    description: "Event types retrieved successfully",
  })
  getEventTypes() {
    return {
      message: "Audit event types retrieved successfully",
      eventTypes: Object.values(AuditEventType),
      severities: Object.values(AuditSeverity),
      statuses: Object.values(AuditStatus),
    };
  }

  @Post("manual-log")
  @RequireClubAdmin()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create manual audit log entry",
    description:
      "Manually create an audit log entry for administrative purposes",
  })
  @ApiResponse({
    status: 201,
    description: "Manual audit log entry created successfully",
  })
  async createManualLog(
    @Body() logDto: ManualAuditLogDto,
    @Query("userId") userId?: string,
    @Query("clubId") clubId?: string
  ) {
    const entry = await this.auditLogService.logEvent({
      eventType: logDto.eventType,
      severity: logDto.severity,
      status: AuditStatus.SUCCESS,
      message: logDto.message,
      description: logDto.description,
      context: {
        userId,
        clubId,
        service: "manual-entry",
        endpoint: "/audit/manual-log",
        method: "POST",
      },
      resourceType: logDto.resourceType,
      resourceId: logDto.resourceId,
    });

    return {
      message: "Manual audit log entry created successfully",
      entry: {
        id: entry.id,
        timestamp: entry.timestamp,
        eventType: entry.eventType,
        severity: entry.severity,
        message: entry.message,
      },
    };
  }

  @Get("export")
  @RequireClubAdmin()
  @ApiOperation({
    summary: "Export audit logs",
    description:
      "Export audit logs in various formats for compliance and analysis",
  })
  @ApiQuery({
    name: "format",
    required: false,
    description: "Export format (json, csv)",
    enum: ["json", "csv"],
  })
  @ApiQuery({
    name: "startDate",
    required: false,
    description: "Start date for export",
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    description: "End date for export",
  })
  @ApiResponse({
    status: 200,
    description: "Audit logs exported successfully",
  })
  async exportLogs(
    @Query("format") format: "json" | "csv" = "json",
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    const options: AuditQueryOptions = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: 10000, // Large limit for export
    };

    const result = await this.auditLogService.queryLogs(options);

    if (format === "csv") {
      // Convert to CSV format
      const headers = [
        "ID",
        "Timestamp",
        "Event Type",
        "Severity",
        "Status",
        "Message",
        "User ID",
        "User Email",
        "IP Address",
        "Service",
        "Resource Type",
        "Resource ID",
      ];

      const csvRows = result.logs.map((log) => [
        log.id,
        log.timestamp.toISOString(),
        log.eventType,
        log.severity,
        log.status,
        log.message.replace(/"/g, '""'), // Escape quotes
        log.context.userId || "",
        log.context.userEmail || "",
        log.context.ipAddress || "",
        log.context.service || "",
        log.resourceType || "",
        log.resourceId || "",
      ]);

      const csvContent = [headers, ...csvRows]
        .map((row) => row.map((field) => `"${field}"`).join(","))
        .join("\n");

      return {
        message: "Audit logs exported successfully",
        format: "csv",
        content: csvContent,
        exportedAt: new Date().toISOString(),
        totalRecords: result.logs.length,
      };
    }

    return {
      message: "Audit logs exported successfully",
      format: "json",
      logs: result.logs,
      exportedAt: new Date().toISOString(),
      totalRecords: result.logs.length,
    };
  }

  @Get("compliance-report")
  @RequireClubAdmin()
  @ApiOperation({
    summary: "Generate compliance report",
    description:
      "Generate a comprehensive compliance report based on audit logs",
  })
  @ApiQuery({
    name: "period",
    required: false,
    description: "Report period in days (default: 90)",
  })
  @ApiResponse({
    status: 200,
    description: "Compliance report generated successfully",
  })
  async generateComplianceReport(@Query("period") period?: string) {
    const reportPeriod = period ? parseInt(period, 10) : 90;
    const statistics = await this.auditLogService.getStatistics(reportPeriod);
    const alerts = await this.auditLogService.getActiveAlerts();

    // Generate compliance metrics
    const authenticationEvents =
      statistics.eventsByType[AuditEventType.LOGIN_SUCCESS] +
      statistics.eventsByType[AuditEventType.LOGIN_FAILED];
    const dataAccessEvents =
      statistics.eventsByType[AuditEventType.DATA_READ] +
      statistics.eventsByType[AuditEventType.DATA_CREATED] +
      statistics.eventsByType[AuditEventType.DATA_UPDATED] +
      statistics.eventsByType[AuditEventType.DATA_DELETED];
    const securityIncidents =
      statistics.eventsByType[AuditEventType.SECURITY_VIOLATION] +
      statistics.eventsByType[AuditEventType.SUSPICIOUS_ACTIVITY];

    return {
      message: "Compliance report generated successfully",
      report: {
        period: `${reportPeriod} days`,
        generatedAt: new Date().toISOString(),
        summary: {
          totalAuditEvents: statistics.totalEvents,
          authenticationEvents,
          dataAccessEvents,
          securityIncidents,
          activeAlerts: alerts.length,
        },
        compliance: {
          auditingEnabled: true,
          eventRetention: "Configured per severity",
          securityMonitoring: alerts.length === 0 ? "Clean" : "Alerts Present",
          dataProtection: "Sensitive data redacted",
        },
        statistics,
        alerts: alerts.slice(0, 10), // Top 10 recent alerts
      },
    };
  }
}
