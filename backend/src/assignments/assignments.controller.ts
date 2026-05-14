/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Delete,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AssignmentsService } from './assignments.service.js';
import { FilesService } from '../files/files.service.js';
import {
  CreateAssignmentDto,
  createAssignmentSchema,
} from './dto/create-assignment.dto.js';
import {
  UpdateAssignmentDto,
  updateAssignmentSchema,
} from './dto/update-assignment.dto.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AssignmentRequestStatus, UserRole } from '@prisma/client';
import {
  ListAssignmentsDto,
  listAssignmentsSchema,
} from './dto/list-assignments.dto.js';
import { z } from 'zod';

// DTO для массовых действий с корзиной
const bulkTrashActionSchema = z.object({
  ids: z
    .array(z.string().min(1, 'id обязателен'))
    .nonempty('Нужно указать хотя бы одно id'),
});

type BulkTrashActionDto = z.infer<typeof bulkTrashActionSchema>;

/**
 * 🔧 DTO для запроса корректировки расписания по назначению
 */
const requestScheduleAdjustmentSchema = z.object({
  date: z
    .string()
    .min(1, 'Дата обязательна')
    .refine(
      (val) =>
        !Number.isNaN(Date.parse(val)) || /^\d{4}-\d{2}-\d{2}$/.test(val),
      'Некорректный формат даты',
    ),
  startsAt: z
    .string()
    .optional()
    .refine(
      (val) => !val || !Number.isNaN(Date.parse(val)),
      'Некорректный формат времени начала',
    ),
  endsAt: z
    .string()
    .optional()
    .refine(
      (val) => !val || !Number.isNaN(Date.parse(val)),
      'Некорректный формат времени окончания',
    ),
  kind: z.enum(['DEFAULT', 'OFFICE', 'REMOTE', 'DAY_OFF']).optional(),
  comment: z.string().min(1, 'Комментарий обязателен').max(2000),
});

export type RequestScheduleAdjustmentDto = z.infer<
  typeof requestScheduleAdjustmentSchema
>;

/**
 * 🔧 Фильтры для списка запросов корректировок (для менеджера/админа)
 */
const listScheduleAdjustmentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  userId: z.string().optional(),
  assignmentId: z.string().optional(),
});

export type ListScheduleAdjustmentsDto = z.infer<
  typeof listScheduleAdjustmentsSchema
>;

/**
 * 🔧 Решение по запросу корректировки (одобрить / отклонить)
 */
const scheduleAdjustmentDecisionSchema = z.object({
  managerComment: z.string().max(2000).optional(),
});

export type ScheduleAdjustmentDecisionDto = z.infer<
  typeof scheduleAdjustmentDecisionSchema
>;

// ================================================================
//        📨 БЛОК ЗАПРОСОВ НА НОВОЕ НАЗНАЧЕНИЕ (AssignmentRequest)
// ================================================================

const createAssignmentRequestSchema = z.object({
  workplaceId: z.string().optional().nullable(),
  dateFrom: z
    .string()
    .min(1, 'Дата начала обязательна')
    .refine((val) => !Number.isNaN(Date.parse(val)), 'Некорректный dateFrom'),
  dateTo: z
    .string()
    .min(1, 'Дата окончания обязательна')
    .refine((val) => !Number.isNaN(Date.parse(val)), 'Некорректный dateTo'),
  // structured slots (если фронт пришлёт), иначе можно оставить пустым/не прислать
  slots: z.unknown().optional(),
  comment: z.string().max(2000).optional().nullable(),
});

export type CreateAssignmentRequestDto = z.infer<
  typeof createAssignmentRequestSchema
>;

const listAssignmentRequestsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(AssignmentRequestStatus).optional(),
  requesterId: z.string().optional(),
  workplaceId: z.string().optional(),
});

export type ListAssignmentRequestsDto = z.infer<
  typeof listAssignmentRequestsSchema
>;

const assignmentRequestDecisionSchema = z.object({
  decisionComment: z.string().max(2000).optional(),
});

export type AssignmentRequestDecisionDto = z.infer<
  typeof assignmentRequestDecisionSchema
>;

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(
    private readonly assignmentsService: AssignmentsService,
    private readonly filesService: FilesService,
  ) {}

  private getUserId(req: any): string | undefined {
    return req?.user?.id ?? req?.user?.sub ?? req?.user?.userId;
  }

  private getOrgId(req: any): string | undefined {
    return req?.user?.orgId ?? req?.user?.org?.id;
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  create(
    @Body(new ZodValidationPipe(createAssignmentSchema))
    payload: CreateAssignmentDto,
  ) {
    return this.assignmentsService.create(payload);
  }

  /**
   * Обычный список назначений (ТОЛЬКО не удалённые)
   */
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  findAll(
    @Req() req: any,
    @Query(new ZodValidationPipe(listAssignmentsSchema))
    query: ListAssignmentsDto,
  ) {
    return this.assignmentsService.findAll(query, this.getOrgId(req));
  }

  /**
   * Список назначений в корзине (deletedAt != null)
   */
  @Get('trash')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  findAllInTrash(
    @Req() req: any,
    @Query(new ZodValidationPipe(listAssignmentsSchema))
    query: ListAssignmentsDto,
  ) {
    return this.assignmentsService.findAllInTrash(query, this.getOrgId(req));
  }

  /**
   * 📊 Краткая статистика по сотрудникам:
   *  - все USER (не system)
   *  - количество активных назначений на каждого
   */
  @Get('users-summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getUsersAssignmentsSummary(@Req() req: any) {
    return this.assignmentsService.getUsersAssignmentsSummary(this.getOrgId(req));
  }

  // ================================================================
  //        📨 БЛОК ЗАПРОСОВ НА НОВОЕ НАЗНАЧЕНИЕ (AssignmentRequest)
  // ================================================================

  /**
   * 📝 Пользователь создаёт запрос на назначение.
   *
   * POST /assignments/requests
   * (и алиас) POST /assignments/request
   */
  @Post('requests')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  createAssignmentRequest(
    @Req() req: any,
    @Body(new ZodValidationPipe(createAssignmentRequestSchema))
    payload: CreateAssignmentRequestDto,
  ) {
    const userId = this.getUserId(req);
    if (!userId) {
      throw new UnauthorizedException();
    }

    return this.assignmentsService.createAssignmentRequest(
      userId,
      payload,
      this.getOrgId(req),
    );
  }

  // алиас под старый клиент (если там был /assignments/request)
  @Post('request')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  createAssignmentRequestAlias(
    @Req() req: any,
    @Body(new ZodValidationPipe(createAssignmentRequestSchema))
    payload: CreateAssignmentRequestDto,
  ) {
    return this.createAssignmentRequest(req, payload);
  }

  /**
   * 📋 Список запросов на назначение (для админа/менеджера)
   *
   * GET /assignments/requests
   */
  @Get('requests')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.USER)
  listAssignmentRequests(
    @Req() req: any,
    @Query(new ZodValidationPipe(listAssignmentRequestsSchema))
    query: ListAssignmentRequestsDto,
  ) {
    const currentUserId = this.getUserId(req);
    const currentOrgId = this.getOrgId(req);
    const currentRole: UserRole | undefined = req?.user?.role;

    // Если это обычный сотрудник (USER), то он имеет право видеть
    // только собственные запросы. Принудительно подменяем requesterId
    // на его id, игнорируя любые параметры в query.
    const safeQuery: ListAssignmentRequestsDto =
      currentRole === UserRole.USER && currentUserId
        ? { ...query, requesterId: currentUserId }
        : query;

    return this.assignmentsService.listAssignmentRequests(
      safeQuery,
      currentOrgId,
      currentUserId,
    );
  }

  /**
   * ✅ Одобрить запрос
   *
   * POST /assignments/requests/:requestId/approve
   */
  @Post('requests/:requestId/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  approveAssignmentRequest(
    @Req() req: any,
    @Param('requestId') requestId: string,
    @Body(new ZodValidationPipe(assignmentRequestDecisionSchema))
    payload: AssignmentRequestDecisionDto,
  ) {
    return this.assignmentsService.decideAssignmentRequest(
      requestId,
      'APPROVED',
      payload,
      this.getUserId(req),
    );
  }

  /**
   * ❌ Отклонить запрос
   *
   * POST /assignments/requests/:requestId/reject
   */
  @Post('requests/:requestId/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  rejectAssignmentRequest(
    @Req() req: any,
    @Param('requestId') requestId: string,
    @Body(new ZodValidationPipe(assignmentRequestDecisionSchema))
    payload: AssignmentRequestDecisionDto,
  ) {
    return this.assignmentsService.decideAssignmentRequest(
      requestId,
      'REJECTED',
      payload,
      this.getUserId(req),
    );
  }

  // ================================================================
  //        🔔 БЛОК ЗАПРОСОВ НА КОРРЕКТИРОВКУ РАСПИСАНИЯ
  // ================================================================

  /**
   * 📝 Пользователь запрашивает корректировку по конкретному назначению.
   *
   * POST /assignments/:id/adjustments
   */
  @Post(':id/adjustments')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  requestScheduleAdjustment(
    @Param('id') assignmentId: string,
    @Body(new ZodValidationPipe(requestScheduleAdjustmentSchema))
    payload: RequestScheduleAdjustmentDto,
  ) {
    return this.assignmentsService.requestScheduleAdjustment(
      assignmentId,
      payload,
    );
  }

  /**
   * 📋 Список всех запросов корректировок (для менеджера/админа),
   * с фильтрами по статусу / сотруднику / назначению.
   *
   * GET /assignments/adjustments
   */
  @Get('adjustments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  listScheduleAdjustments(
    @Query(new ZodValidationPipe(listScheduleAdjustmentsSchema))
    query: ListScheduleAdjustmentsDto,
  ) {
    return this.assignmentsService.listScheduleAdjustments(query);
  }

  /**
   * ✅ Одобрить запрос корректировки
   *
   * POST /assignments/adjustments/:adjustmentId/approve
   */
  @Post('adjustments/:adjustmentId/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  approveScheduleAdjustment(
    @Param('adjustmentId') adjustmentId: string,
    @Body(new ZodValidationPipe(scheduleAdjustmentDecisionSchema))
    payload: ScheduleAdjustmentDecisionDto,
  ) {
    return this.assignmentsService.decideScheduleAdjustment(
      adjustmentId,
      'APPROVED',
      payload,
    );
  }

  /**
   * ❌ Отклонить запрос корректировки
   *
   * POST /assignments/adjustments/:adjustmentId/reject
   */
  @Post('adjustments/:adjustmentId/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  rejectScheduleAdjustment(
    @Param('adjustmentId') adjustmentId: string,
    @Body(new ZodValidationPipe(scheduleAdjustmentDecisionSchema))
    payload: ScheduleAdjustmentDecisionDto,
  ) {
    return this.assignmentsService.decideScheduleAdjustment(
      adjustmentId,
      'REJECTED',
      payload,
    );
  }

  // ================================================================
  //                    ОСТАЛЬНОЙ ФУНКЦИОНАЛ
  // ================================================================

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  findOne(@Param('id') id: string) {
    return this.assignmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateAssignmentSchema))
    payload: UpdateAssignmentDto,
  ) {
    return this.assignmentsService.update(id, payload);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  softDelete(@Param('id') id: string) {
    return this.assignmentsService.softDelete(id);
  }

  @Post(':id/restore')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  restoreFromTrash(@Param('id') id: string) {
    return this.assignmentsService.restoreFromTrash(id);
  }

  @Post(':id/notify')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  notify(@Param('id') id: string) {
    return this.assignmentsService.notify(id);
  }

  @Post(':id/complete')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  complete(@Param('id') id: string) {
    return this.assignmentsService.complete(id);
  }

  @Post('trash/export')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  exportFromTrash(
    @Body(new ZodValidationPipe(bulkTrashActionSchema))
    payload: BulkTrashActionDto,
  ) {
    return this.assignmentsService.exportFromTrash(payload.ids);
  }

  @Post('trash/delete')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  bulkDeleteFromTrash(
    @Body(new ZodValidationPipe(bulkTrashActionSchema))
    payload: BulkTrashActionDto,
  ) {
    return this.assignmentsService.bulkDeleteFromTrash(payload.ids);
  }

  @Post('trash/export-and-delete')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  exportAndDeleteFromTrash(
    @Body(new ZodValidationPipe(bulkTrashActionSchema))
    payload: BulkTrashActionDto,
  ) {
    return this.assignmentsService.exportAndDeleteFromTrash(payload.ids);
  }

  // ================================================================
  //                      📎 ФАЙЛЫ НАЗНАЧЕНИЯ
  // ================================================================

  @Post(':id/files')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname);
          cb(
            null,
            `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`,
          );
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  uploadFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const userId = this.getUserId(req);
    if (!userId) throw new UnauthorizedException();
    return this.filesService.attachToAssignment(id, file, userId);
  }

  @Get(':id/files')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getFiles(@Param('id') id: string) {
    return this.filesService.getFilesForAssignment(id);
  }

  @Delete(':id/files/:fileId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  deleteFile(@Param('fileId') fileId: string) {
    return this.filesService.deleteAssignmentFile(fileId);
  }
}
