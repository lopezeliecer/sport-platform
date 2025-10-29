import { Module, Global } from '@nestjs/common';
import { MetricsService } from './metrics.service';

/**
 * Metrics Module - Provides Prometheus metrics collection
 * Marked as Global to avoid repeated imports across modules
 */
@Global()
@Module({
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
