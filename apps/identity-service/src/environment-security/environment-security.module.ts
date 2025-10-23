import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EnvironmentSecurityService } from './environment-security.service';
import { SecretsManagementService } from './secrets-management.service';
import { EnvironmentSecurityController } from './environment-security.controller';

@Global()
@Module({
  imports: [
    ConfigModule, // Access to configuration
    ScheduleModule.forRoot(), // For cron jobs
  ],
  providers: [EnvironmentSecurityService, SecretsManagementService],
  controllers: [EnvironmentSecurityController],
  exports: [EnvironmentSecurityService, SecretsManagementService],
})
export class EnvironmentSecurityModule {}
