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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AthletesService } from "./athletes.service";

// Importar desde el módulo de autenticación compartido
import {
  JwtAuthGuard,
  RbacGuard,
  RequireClubContext,
  CanReadAthletes,
  CanManageAthletes,
  RequireCoachOrAdmin,
  CurrentUser,
  CurrentClubId,
  JwtPayload,
} from "@sports-platform/shared/auth";

@ApiTags("Athletes")
@ApiBearerAuth()
@Controller("athletes")
@UseGuards(JwtAuthGuard, RbacGuard)
@RequireClubContext()
export class AthletesController {
  constructor(private readonly athletesService: AthletesService) {}

  @Post()
  @ApiOperation({ summary: "Crear nuevo atleta" })
  @ApiResponse({ status: 201, description: "Atleta creado exitosamente" })
  @RequireCoachOrAdmin()
  @CanManageAthletes()
  async create(
    @Body() createAthleteDto: any,
    @CurrentClubId() clubId: string,
    @CurrentUser() user: JwtPayload
  ) {
    return this.athletesService.create(createAthleteDto, clubId, user.sub);
  }

  @Get()
  @ApiOperation({ summary: "Obtener lista de atletas" })
  @ApiResponse({
    status: 200,
    description: "Lista de atletas obtenida exitosamente",
  })
  @CanReadAthletes()
  async findAll(
    @Query() searchDto: any,
    @CurrentClubId() clubId: string,
    @CurrentUser() user: JwtPayload
  ) {
    return this.athletesService.findAll(searchDto, clubId, user.sub);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener atleta específico" })
  @ApiResponse({ status: 200, description: "Atleta obtenido exitosamente" })
  @CanReadAthletes()
  async findOne(
    @Param("id") id: string,
    @CurrentClubId() clubId: string,
    @CurrentUser() user: JwtPayload
  ) {
    return this.athletesService.findOne(id, clubId, user.sub);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar atleta" })
  @ApiResponse({ status: 200, description: "Atleta actualizado exitosamente" })
  @RequireCoachOrAdmin()
  @CanManageAthletes()
  async update(
    @Param("id") id: string,
    @Body() updateAthleteDto: any,
    @CurrentClubId() clubId: string,
    @CurrentUser() user: JwtPayload
  ) {
    return this.athletesService.update(id, updateAthleteDto, clubId, user.sub);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar atleta" })
  @ApiResponse({ status: 200, description: "Atleta eliminado exitosamente" })
  @RequireCoachOrAdmin()
  @CanManageAthletes()
  async remove(
    @Param("id") id: string,
    @CurrentClubId() clubId: string,
    @CurrentUser() user: JwtPayload
  ) {
    return this.athletesService.remove(id, clubId, user.sub);
  }

  @Get(":id/statistics")
  @ApiOperation({ summary: "Obtener estadísticas del atleta" })
  @ApiResponse({
    status: 200,
    description: "Estadísticas obtenidas exitosamente",
  })
  @CanReadAthletes()
  async getStatistics(
    @Param("id") id: string,
    @CurrentClubId() clubId: string,
    @CurrentUser() user: JwtPayload
  ) {
    return this.athletesService.getStatistics(id, clubId, user.sub);
  }
}
