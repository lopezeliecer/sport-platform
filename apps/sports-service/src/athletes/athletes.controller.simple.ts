import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Headers,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiHeader,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AthletesService } from "./athletes.service";

// Import local DTOs
import {
  CreateAthleteDto,
  UpdateAthleteDto,
  AthleteResponseDto,
  AthleteSearchDto,
} from "./dto/athlete.dto";

@ApiTags("Athletes")
@Controller("athletes")
@ApiBearerAuth()
export class AthletesController {
  constructor(private readonly athletesService: AthletesService) {}

  @Post()
  @ApiOperation({
    summary: "Create a new athlete",
    description:
      "Creates a new athlete in the specified club. Requires ADMIN, COACH, or DIRECTOR permissions.",
  })
  @ApiHeader({
    name: "x-club-id",
    description: "Club ID for multi-tenant context",
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Athlete successfully created",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data or business rule violation",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Insufficient permissions",
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createAthleteDto: CreateAthleteDto,
    @Headers("x-club-id") clubId: string,
    @Headers("x-user-id") userId: string
  ): Promise<AthleteResponseDto> {
    const athlete = await this.athletesService.create(
      createAthleteDto,
      clubId,
      userId
    );

    return athlete;
  }

  @Get()
  @ApiOperation({
    summary: "Get all athletes",
    description:
      "Retrieves a paginated list of athletes with optional filtering and search.",
  })
  @ApiHeader({
    name: "x-club-id",
    description: "Club ID for multi-tenant context",
    required: true,
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page",
  })
  @ApiQuery({
    name: "query",
    required: false,
    type: String,
    description: "Search query",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Athletes retrieved successfully",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Access denied to this club",
  })
  async findAll(
    @Query() searchDto: AthleteSearchDto,
    @Headers("x-club-id") clubId: string,
    @Headers("x-user-id") userId: string
  ): Promise<any> {
    const result = await this.athletesService.findAll(
      searchDto,
      clubId,
      userId
    );

    return result;
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get athlete by ID",
    description:
      "Retrieves a specific athlete by their ID with detailed information.",
  })
  @ApiParam({ name: "id", description: "Athlete ID", type: String })
  @ApiHeader({
    name: "x-club-id",
    description: "Club ID for multi-tenant context",
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Athlete found",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Athlete not found",
  })
  async findOne(
    @Param("id") id: string,
    @Headers("x-club-id") clubId: string,
    @Headers("x-user-id") userId: string
  ): Promise<AthleteResponseDto> {
    const athlete = await this.athletesService.findOne(id, clubId, userId);

    return athlete;
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update athlete",
    description:
      "Updates an athlete's information. Requires ADMIN, COACH, or DIRECTOR permissions.",
  })
  @ApiParam({ name: "id", description: "Athlete ID", type: String })
  @ApiHeader({
    name: "x-club-id",
    description: "Club ID for multi-tenant context",
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Athlete updated successfully",
  })
  async update(
    @Param("id") id: string,
    @Body() updateAthleteDto: UpdateAthleteDto,
    @Headers("x-club-id") clubId: string,
    @Headers("x-user-id") userId: string
  ): Promise<AthleteResponseDto> {
    const athlete = await this.athletesService.update(
      id,
      updateAthleteDto,
      clubId,
      userId
    );

    return athlete;
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete athlete",
    description:
      "Soft deletes an athlete. Requires ADMIN or DIRECTOR permissions.",
  })
  @ApiParam({ name: "id", description: "Athlete ID", type: String })
  @ApiHeader({
    name: "x-club-id",
    description: "Club ID for multi-tenant context",
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: "Athlete deleted successfully",
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param("id") id: string,
    @Headers("x-club-id") clubId: string,
    @Headers("x-user-id") userId: string
  ): Promise<void> {
    await this.athletesService.remove(id, clubId, userId);
  }

  @Get(":id/statistics")
  @ApiOperation({
    summary: "Get athlete statistics",
    description:
      "Retrieves comprehensive statistics for an athlete including training and performance data.",
  })
  @ApiParam({ name: "id", description: "Athlete ID", type: String })
  @ApiHeader({
    name: "x-club-id",
    description: "Club ID for multi-tenant context",
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Statistics retrieved successfully",
  })
  async getStatistics(
    @Param("id") id: string,
    @Headers("x-club-id") clubId: string,
    @Headers("x-user-id") userId: string
  ): Promise<any> {
    const statistics = await this.athletesService.getStatistics(
      id,
      clubId,
      userId
    );

    return statistics;
  }
}
