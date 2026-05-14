import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service.js';
import { GetStatisticsDto } from './dto/get-statistics.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtPayload } from '../auth/jwt-payload.interface.js';

@UseGuards(JwtAuthGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get()
  getStatistics(
    @Query() query: GetStatisticsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.statisticsService.getStatistics(query, user.orgId ?? undefined);
  }

  @Get('kpi')
  getKpi(
    @Query() query: GetStatisticsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.statisticsService.getKpi(query, user.orgId ?? undefined);
  }
}
