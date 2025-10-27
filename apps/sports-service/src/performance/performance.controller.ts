import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PerformanceService } from './performance.service';
import { CreatePerformanceMetricDto } from './dto/create-performance-metric.dto';
import {
  JwtAuthGuard,
  RbacGuard,
  RequireClubContext,
  CurrentClubId,
} from '@sports-platform/shared/auth';

@ApiTags('Performance')
@ApiBearerAuth()
@Controller('performance')
@UseGuards(JwtAuthGuard, RbacGuard)
@RequireClubContext()
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Post('metrics')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record performance metric for athlete' })
  @ApiResponse({
    status: 201,
    description: 'Performance metric recorded successfully',
  })
  async recordMetric(
    @Body() createMetricDto: CreatePerformanceMetricDto,
    @CurrentClubId() clubId: string,
  ) {
    return this.performanceService.recordMetric(createMetricDto, clubId);
  }

  @Get('athletes/:athleteId/metrics')
  @ApiOperation({ summary: 'Get performance metrics for athlete' })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics retrieved successfully',
  })
  async getAthleteMetrics(
    @Param('athleteId') athleteId: string,
    @Query() query: Record<string, unknown>,
    @CurrentClubId() clubId: string,
  ) {
    return this.performanceService.getAthleteMetrics(athleteId, clubId, query);
  }

  @Get('athletes/:athleteId/personal-records')
  @ApiOperation({ summary: 'Get personal records for athlete' })
  @ApiResponse({
    status: 200,
    description: 'Personal records retrieved successfully',
  })
  async getPersonalRecords(@Param('athleteId') athleteId: string, @CurrentClubId() clubId: string) {
    return this.performanceService.getPersonalRecords(athleteId, clubId);
  }

  @Get('athletes/:athleteId/trends/:metricType')
  @ApiOperation({ summary: 'Get performance trends for metric' })
  @ApiResponse({
    status: 200,
    description: 'Performance trends retrieved successfully',
  })
  async getPerformanceTrends(
    @Param('athleteId') athleteId: string,
    @Param('metricType') metricType: string,
    @Query() query: Record<string, unknown>,
    @CurrentClubId() clubId: string,
  ) {
    return this.performanceService.getPerformanceTrends(athleteId, clubId, metricType, query);
  }

  @Get('athletes/:athleteId/summary')
  @ApiOperation({ summary: 'Get performance summary for athlete' })
  @ApiResponse({
    status: 200,
    description: 'Performance summary retrieved successfully',
  })
  async getPerformanceSummary(
    @Param('athleteId') athleteId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentClubId() clubId: string,
  ) {
    return this.performanceService.getPerformanceSummary(athleteId, clubId, startDate, endDate);
  }

  @Post('compare')
  @ApiOperation({ summary: 'Compare performance between athletes' })
  @ApiResponse({
    status: 200,
    description: 'Performance comparison retrieved successfully',
  })
  async compareAthletes(
    @Body() body: { athleteIds: string[]; metricType: string },
    @CurrentClubId() clubId: string,
  ) {
    const { athleteIds, metricType } = body;
    return this.performanceService.compareAthletes(athleteIds, clubId, metricType);
  }
}
