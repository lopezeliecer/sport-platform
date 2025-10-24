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
import { CompetitionsService } from './competitions.service';
import {
  CreateCompetitionDto,
  RegisterAthleteCompetitionDto,
  RecordCompetitionResultDto,
} from './dto/create-competition.dto';
import {
  JwtAuthGuard,
  RbacGuard,
  RequireClubContext,
  CurrentClubId,
} from '@sports-platform/shared/auth';

@ApiTags('Competitions')
@ApiBearerAuth()
@Controller('competitions')
@UseGuards(JwtAuthGuard, RbacGuard)
@RequireClubContext()
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new competition' })
  @ApiResponse({
    status: 201,
    description: 'Competition created successfully',
  })
  async createCompetition(
    @Body() createCompetitionDto: CreateCompetitionDto,
    @CurrentClubId() clubId: string,
  ) {
    return this.competitionsService.createCompetition(createCompetitionDto, clubId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all competitions for club' })
  @ApiResponse({
    status: 200,
    description: 'Competitions retrieved successfully',
  })
  async getCompetitions(@Query() query: Record<string, unknown>, @CurrentClubId() clubId: string) {
    return this.competitionsService.getCompetitions(clubId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get competition details' })
  @ApiResponse({
    status: 200,
    description: 'Competition details retrieved successfully',
  })
  async getCompetitionById(@Param('id') id: string, @CurrentClubId() clubId: string) {
    return this.competitionsService.getCompetitionById(id, clubId);
  }

  @Post(':id/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register athlete for competition' })
  @ApiResponse({
    status: 201,
    description: 'Athlete registered successfully',
  })
  async registerAthlete(
    @Param('id') competitionId: string,
    @Body() registerDto: RegisterAthleteCompetitionDto,
    @CurrentClubId() clubId: string,
  ) {
    const dto = { ...registerDto, competitionId };
    return this.competitionsService.registerAthleteForCompetition(dto, clubId);
  }

  @Post(':id/results')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record competition result for athlete' })
  @ApiResponse({
    status: 201,
    description: 'Result recorded successfully',
  })
  async recordResult(
    @Param('id') competitionId: string,
    @Body() recordResultDto: RecordCompetitionResultDto,
    @CurrentClubId() clubId: string,
  ) {
    const dto = { ...recordResultDto, competitionId };
    return this.competitionsService.recordResult(dto, clubId);
  }

  @Get(':id/results')
  @ApiOperation({ summary: 'Get competition results' })
  @ApiResponse({
    status: 200,
    description: 'Results retrieved successfully',
  })
  async getResults(@Param('id') competitionId: string, @CurrentClubId() clubId: string) {
    return this.competitionsService.getCompetitionResults(competitionId, clubId);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get competition statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics(@Param('id') competitionId: string, @CurrentClubId() clubId: string) {
    return this.competitionsService.getCompetitionStatistics(competitionId, clubId);
  }

  @Get('athletes/:athleteId/history')
  @ApiOperation({ summary: 'Get athlete competition history' })
  @ApiResponse({
    status: 200,
    description: 'History retrieved successfully',
  })
  async getAthleteHistory(@Param('athleteId') athleteId: string, @CurrentClubId() clubId: string) {
    return this.competitionsService.getAthleteCompetitionHistory(athleteId, clubId);
  }
}
