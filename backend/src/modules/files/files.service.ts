import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { STORAGE_PORT, StoragePort, UPLOAD_RULES, FileKind } from '../storage/storage.port';
import { ConfirmDto, UploadUrlDto } from './dto/files.schema';

@Injectable()
export class FilesService {
  constructor(
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    private readonly prisma: PrismaService,
  ) {}

  async createUploadUrl(userId: string, dto: UploadUrlDto) {
    const rules = UPLOAD_RULES[dto.kind as FileKind];
    if (!rules.mimeTypes.includes(dto.mimeType)) {
      throw new BadRequestException({
        message: `Unsupported file type for ${dto.kind}`,
        code: 'UNSUPPORTED_FILE_TYPE',
      });
    }
    if (dto.sizeBytes > rules.maxBytes) {
      throw new BadRequestException({
        message: `File exceeds ${(rules.maxBytes / 1024 / 1024).toFixed(0)}MB limit`,
        code: 'FILE_TOO_LARGE',
      });
    }
    return this.storage.createUploadUrl({ ...dto, ownerId: userId });
  }

  /** Persists a Resume row once the client has uploaded to the signed URL. */
  async confirm(userId: string, dto: ConfirmDto) {
    if (!dto.fileKey.startsWith(`resume/${userId}/`)) {
      // Only resume confirmation persists a row here; attachments are persisted by chat.
      if (dto.fileKey.startsWith('resume/')) {
        throw new ForbiddenException({ message: 'Not your file', code: 'FORBIDDEN' });
      }
      return { fileKey: dto.fileKey };
    }
    if (!(await this.storage.exists(dto.fileKey))) {
      throw new BadRequestException({ message: 'Upload not found', code: 'UPLOAD_NOT_FOUND' });
    }

    const isFirst = (await this.prisma.resume.count({ where: { userId } })) === 0;
    const resume = await this.prisma.resume.create({
      data: {
        userId,
        fileKey: dto.fileKey,
        fileName: dto.fileName ?? dto.fileKey.split('/').pop() ?? 'resume',
        mimeType: dto.mimeType ?? 'application/pdf',
        sizeBytes: dto.sizeBytes ?? 0,
        isPrimary: dto.isPrimary ?? isFirst,
      },
    });
    if (resume.isPrimary) {
      await this.prisma.resume.updateMany({
        where: { userId, id: { not: resume.id } },
        data: { isPrimary: false },
      });
    }
    return resume;
  }

  async downloadUrl(userId: string, resumeId: string) {
    const resume = await this.prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume) throw new NotFoundException({ message: 'File not found', code: 'NOT_FOUND' });
    if (resume.userId !== userId) {
      // Referrers can view a resume attached to a referral request addressed to them.
      const linked = await this.prisma.referralRequest.findFirst({
        where: { resumeId, referrerId: userId },
        select: { id: true },
      });
      if (!linked) throw new ForbiddenException({ message: 'Not allowed', code: 'FORBIDDEN' });
    }
    const url = await this.storage.createDownloadUrl(resume.fileKey);
    return { url, fileName: resume.fileName };
  }
}
