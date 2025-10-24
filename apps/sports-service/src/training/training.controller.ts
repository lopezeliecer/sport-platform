import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TrainingService, SessionAttendanceSummary } from './training.service';
import { CreateTrainingSessionDto } from './dto/create-training-session.dto';
import { RecordAttendanceDto } from './dto/attendance.dto';
import {
  JwtAuthGuard,
  RbacGuard,
  RequireClubContext,
  CurrentClubId,
  CurrentUser,
  JwtPayload,
} from '@sports-platform/shared/auth';

@ApiTags('Training')
@ApiBearerAuth()
@Controller('training')
@UseGuards(JwtAuthGuard, RbacGuard)
@RequireClubContext()
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new training session' })
  @ApiResponse({
    status: 201,
    description: 'Training session created successfully',
  })
  async createSession(
    @Body() createSessionDto: CreateTrainingSessionDto,
    @CurrentClubId() clubId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.trainingService.createSession(createSessionDto, clubId, user.sub);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get all training sessions for club' })
  @ApiResponse({
    status: 200,
    description: 'List of training sessions retrieved successfully',
  })
  @ApiQuery({
    name: 'coachId',
    required: false,
    description: 'Filter by coach ID',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Filter from start date (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Filter to end date (ISO 8601)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by session type',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 20)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Page offset (default: 0)',
  })
  async getSessions(@Query() query: any, @CurrentClubId() clubId: string) {
    return this.trainingService.getSessions(clubId, query);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get training calendar for club' })
  @ApiResponse({
    status: 200,
    description: 'Training calendar retrieved successfully',
  })
  @ApiQuery({
    name: 'coachId',
    required: false,
    description: 'Filter by coach ID',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (ISO 8601)',
  })
  async getCalendar(@Query() query: any, @CurrentClubId() clubId: string) {
    return this.trainingService.getCalendar(clubId, query);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get specific training session' })
  @ApiResponse({
    status: 200,
    description: 'Training session retrieved successfully',
  })
  async getSession(@Param('id') id: string, @CurrentClubId() clubId: string) {
    return this.trainingService.getSessionById(id, clubId);
  }

  @Patch('sessions/:id')
  @ApiOperation({ summary: 'Update training session' })
  @ApiResponse({
    status: 200,
    description: 'Training session updated successfully',
  })
  async updateSession(
    @Param('id') id: string,
    @Body() updateSessionDto: Partial<CreateTrainingSessionDto>,
    @CurrentClubId() clubId: string,
  ) {
    return this.trainingService.updateSession(id, clubId, updateSessionDto);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete training session' })
  @ApiResponse({ status: 204, description: 'Training session deleted' })
  async deleteSession(@Param('id') id: string, @CurrentClubId() clubId: string) {
    return this.trainingService.deleteSession(id, clubId);
  }

  @Post('sessions/:id/attendance')
  @ApiOperation({ summary: 'Record attendance for training session' })
  @ApiResponse({
    status: 201,
    description: 'Attendance recorded successfully',
  })
  async recordAttendance(
    @Param('id') sessionId: string,
    @Body() recordAttendanceDto: RecordAttendanceDto,
    @CurrentClubId() clubId: string,
  ) {
    const dto = { ...recordAttendanceDto, sessionId };
    return this.trainingService.recordAttendance(dto, clubId);
  }

  @Get('sessions/:id/attendance')
  @ApiOperation({ summary: 'Get attendance summary for session' })
  @ApiResponse({
    status: 200,
    description: 'Attendance summary retrieved successfully',
  })
  async getAttendanceSummary(
    @Param('id') sessionId: string,
    @CurrentClubId() clubId: string,
  ): Promise<SessionAttendanceSummary> {
    return this.trainingService.getSessionAttendanceSummary(sessionId, clubId);
  }

  @Post('sessions/:id/athletes/:athleteId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign athlete to training session' })
  @ApiResponse({
    status: 201,
    description: 'Athlete assigned to session',
  })
  async assignAthlete(
    @Param('id') sessionId: string,
    @Param('athleteId') athleteId: string,
    @CurrentClubId() clubId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.trainingService.assignAthletesToSession(sessionId, [athleteId], clubId, user.sub);
  }

  @Patch('sessions/:id/status')
  @ApiOperation({ summary: 'Update session status' })
  @ApiResponse({
    status: 200,
    description: 'Session status updated successfully',
  })
  async updateSessionStatus(
    @Param('id') sessionId: string,
    @Body() body: { status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED' },
    @CurrentClubId() clubId: string,
  ) {
    return this.trainingService.updateSessionStatus(sessionId, clubId, body.status);
  }
}
