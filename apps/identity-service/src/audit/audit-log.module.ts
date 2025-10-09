import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "../prisma/prisma.module";
import { AuditLogService } from "../../../../libs/shared/common/src/audit/audit-log.service";
import { AuditLogInterceptor } from "../../../../libs/shared/common/src/audit/audit-log.interceptor";
import { AuditLogController } from "./audit-log.controller";

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}), // Minimal JWT module for dependencies
    PrismaModule, // For database access
  ],
  providers: [AuditLogService, AuditLogInterceptor],
  controllers: [AuditLogController],
  exports: [AuditLogService, AuditLogInterceptor],
})
export class AuditLogModule {}
