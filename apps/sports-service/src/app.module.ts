import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AthletesModule } from './athletes/athletes.module';
import { TrainingModule } from './training/training.module';
import { PerformanceModule } from './performance/performance.module';
import { CompetitionsModule } from './competitions/competitions.module';
import { SharedAuthModule } from '@sports-platform/shared/auth';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    SharedAuthModule,
    PrismaModule,
    AthletesModule,
    TrainingModule,
    PerformanceModule,
    CompetitionsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
