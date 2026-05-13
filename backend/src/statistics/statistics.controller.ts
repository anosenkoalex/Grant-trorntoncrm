import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service.js';
import { GetStatisticsDto } from './dto/get-statistics.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get()
  getStatistics(@Query() query: GetStatisticsDto) {
    return this.statisticsService.getStatistics(query);
  }

  @Get('kpi')
  getKpi(@Query() query: GetStatisticsDto) {
    return this.statisticsService.getKpi(query);
  }
}