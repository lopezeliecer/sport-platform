import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Headers } from '@nestjs/common';
import { AthletesService } from './athletes.service';

@Controller('athletes')
export class AthletesController {
  constructor(private readonly athletesService: AthletesService) {}

  @Post()
  async create(
    @Body() createAthleteDto,
    @Headers('x-club-id') clubId,
    @Headers('x-user-id') userId,
  ) {
    return this.athletesService.create(createAthleteDto, clubId, userId);
  }

  @Get()
  async findAll(
    @Query() searchDto,
    @Headers('x-club-id') clubId,
    @Headers('x-user-id') userId,
  ) {
    return this.athletesService.findAll(searchDto, clubId, userId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id,
    @Headers('x-club-id') clubId,
    @Headers('x-user-id') userId,
  ) {
    return this.athletesService.findOne(id, clubId, userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id,
    @Body() updateAthleteDto,
    @Headers('x-club-id') clubId,
    @Headers('x-user-id') userId,
  ) {
    return this.athletesService.update(id, updateAthleteDto, clubId, userId);
  }

  @Delete(':id')
  async remove(
    @Param('id') id,
    @Headers('x-club-id') clubId,
    @Headers('x-user-id') userId,
  ) {
    return this.athletesService.remove(id, clubId, userId);
  }

  @Get(':id/statistics')
  async getStatistics(
    @Param('id') id,
    @Headers('x-club-id') clubId,
    @Headers('x-user-id') userId,
  ) {
    return this.athletesService.getStatistics(id, clubId, userId);
  }
}
