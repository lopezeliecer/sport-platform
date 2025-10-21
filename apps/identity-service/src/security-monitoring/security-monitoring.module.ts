import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { SecurityMonitoringService } from "./security-monitoring.service";
import { SecurityMonitoringController } from "./security-monitoring.controller";
import { AuditLogModule } from "../audit/audit-log.module";

@Module({
  imports: [
    ScheduleModule.forRoot(), // Enable cron jobs for cleanup
    AuditLogModule, // For audit logging integration
  ],
  providers: [SecurityMonitoringService],
  controllers: [SecurityMonitoringController],
  exports: [SecurityMonitoringService],
})
export class SecurityMonitoringModule {}
