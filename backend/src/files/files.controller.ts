import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { FilesService } from './files.service.js';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get(':id')
  async download(@Param('id') id: string, @Res() res: Response) {
    const file = await this.filesService.getFileById(id);
    if (!file) throw new NotFoundException('File not found');

    const filePath = join(process.cwd(), 'uploads', file.filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    res.download(filePath, file.originalName);
  }
}
