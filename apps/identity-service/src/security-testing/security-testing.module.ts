import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SecurityTestingService } from './security-testing.service';
import { SecurityTestingController } from './security-testing.controller';
import { EnvironmentSecurityModule } from '../environment-security/environment-security.module';
import { SecurityMonitoringModule } from '../security-monitoring/security-monitoring.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN') || '15m',
          issuer: configService.get('JWT_ISSUER') || 'sports-platform-dev',
          audience: configService.get('JWT_AUDIENCE') || 'sports-platform-api-dev',
        },
      }),
      inject: [ConfigService],
    }),
    EnvironmentSecurityModule,
    SecurityMonitoringModule,
  ],
  providers: [SecurityTestingService],
  controllers: [SecurityTestingController],
  exports: [SecurityTestingService],
})
export class SecurityTestingModule {}