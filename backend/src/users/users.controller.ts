import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto, createUserSchema } from './dto/create-user.dto.js';
import { UpdateUserDto, updateUserSchema } from './dto/update-user.dto.js';
import { ListUsersDto, listUsersSchema } from './dto/list-users.dto.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtPayload } from '../auth/jwt-payload.interface.js';
import { UserRole } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Создание пользователя
   */
  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  create(
    @Body(new ZodValidationPipe(createUserSchema)) payload: CreateUserDto,
  ) {
    return this.usersService.create(payload);
  }

  /**
   * Список пользователей
   */
  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  findAll(
    @Query(new ZodValidationPipe(listUsersSchema)) query: ListUsersDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.findAll(query, user.orgId ?? undefined);
  }

  /**
   * Получение пользователя по ID
   */
  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * Обновление пользователя
   */
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) payload: UpdateUserDto,
  ) {
    return this.usersService.update(id, payload);
  }

  /**
   * Удаление пользователя
   */
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  /**
   * 🔐 СБРОС ПАРОЛЯ + ОТПРАВКА НА ПОЧТУ
   * Единственный endpoint для админа
   */
  @Post(':id/send-password')
  @Roles(UserRole.SUPER_ADMIN)
  sendPassword(@Param('id') id: string) {
    return this.usersService.sendPassword(id);
  }
}
