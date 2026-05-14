import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../common/prisma/prisma.service.js';

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

  async attachToAssignment(
    assignmentId: string,
    file: Express.Multer.File,
    userId: string,
  ) {
    const dbFile = await this.prisma.file.create({
      data: {
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        uploadedById: userId,
      },
    });

    const assignmentFile = await this.prisma.assignmentFile.create({
      data: { assignmentId, fileId: dbFile.id },
      include: { file: true },
    });

    return {
      id: assignmentFile.id,
      fileId: dbFile.id,
      originalName: dbFile.originalName,
      filename: dbFile.filename,
      mimetype: dbFile.mimetype,
      size: dbFile.size,
      createdAt: assignmentFile.createdAt,
    };
  }

  async getFilesForAssignment(assignmentId: string) {
    const records = await this.prisma.assignmentFile.findMany({
      where: { assignmentId },
      include: { file: true },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => ({
      id: r.id,
      fileId: r.fileId,
      originalName: r.file.originalName,
      filename: r.file.filename,
      mimetype: r.file.mimetype,
      size: r.file.size,
      createdAt: r.createdAt,
    }));
  }

  async getFileById(fileId: string) {
    return this.prisma.file.findUnique({ where: { id: fileId } });
  }

  async deleteAssignmentFile(assignmentFileId: string) {
    const record = await this.prisma.assignmentFile.findUnique({
      where: { id: assignmentFileId },
      include: { file: true },
    });
    if (!record) throw new NotFoundException('File not found');

    await this.prisma.assignmentFile.delete({
      where: { id: assignmentFileId },
    });

    const remainingRefs = await this.prisma.assignmentFile.count({
      where: { fileId: record.fileId },
    });

    if (remainingRefs === 0) {
      await this.prisma.file.delete({ where: { id: record.fileId } });
      const filePath = join(process.cwd(), 'uploads', record.file.filename);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    }
  }
}
