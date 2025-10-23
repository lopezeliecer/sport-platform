import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ApiKeyService } from '../../../../libs/shared/common/src/security/api-key.service';
import { ApiKeyMiddleware } from '../../../../libs/shared/common/src/security/api-key.middleware';
import { ApiKeyGuard } from '../../../../libs/shared/common/src/security/api-key.guard';
import { ApiKeyController } from './api-key.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'development-secret',
      signOptions: { expiresIn: '15m' },
    }),
    PrismaModule,
  ],
  providers: [ApiKeyService, ApiKeyMiddleware, ApiKeyGuard],
  controllers: [ApiKeyController],
  exports: [ApiKeyService, ApiKeyMiddleware, ApiKeyGuard],
})
export class ApiKeyModule {}
