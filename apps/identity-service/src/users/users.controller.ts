import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import {
  User,
  Prisma,
} from "@sports-platform/shared/database/prisma/generated/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { RequireRoles } from "../auth/decorators/permissions.decorator";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard) // Require authentication and roles for all endpoints
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequireRoles("admin", "super_admin") // Only admins can create users
  async create(@Body() createUserDto: Prisma.UserCreateInput): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @RequireRoles("admin", "super_admin") // Only admins can list all users
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(":id")
  @RequireRoles("admin", "super_admin", "coach") // Coaches can view individual users
  async findOne(@Param("id") id: string): Promise<User> {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    return user;
  }

  @Put(":id")
  @RequireRoles("admin", "super_admin") // Only admins can update users
  async update(
    @Param("id") id: string,
    @Body() updateUserDto: Prisma.UserUpdateInput
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  @RequireRoles("admin", "super_admin") // Only admins can delete users
  async remove(@Param("id") id: string): Promise<User> {
    return this.usersService.remove(id);
  }
}
