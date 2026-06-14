import { BadRequestException, Controller, Get, Post, Put, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodBody } from '../../common/decorators/zod.decorator';
import { Param } from '@nestjs/common';
import { LocalStorageAdapter } from '../storage/local-storage.adapter';
import { confirmSchema, uploadUrlSchema } from './dto/files.schema';
import { FilesService } from './files.service';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(
    private readonly files: FilesService,
    private readonly local: LocalStorageAdapter,
  ) {}

  @ApiBearerAuth()
  @Post('upload-url')
  @ApiOperation({ summary: 'Get a signed upload URL + fileKey' })
  uploadUrl(
    @CurrentUser('id') userId: string,
    @ZodBody(uploadUrlSchema) body: typeof uploadUrlSchema._type,
  ) {
    return this.files.createUploadUrl(userId, body);
  }

  @ApiBearerAuth()
  @Post('confirm')
  @ApiOperation({ summary: 'Persist a file row after upload' })
  confirm(
    @CurrentUser('id') userId: string,
    @ZodBody(confirmSchema) body: typeof confirmSchema._type,
  ) {
    return this.files.confirm(userId, body);
  }

  @ApiBearerAuth()
  @Get(':id/download-url')
  @ApiOperation({ summary: 'Get a signed download URL (ownership checked)' })
  downloadUrl(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.files.downloadUrl(userId, id);
  }

  // ─── Local adapter blob endpoints (token-authed, no bearer) ────────────────
  // In cloud mode these are unused — Supabase serves objects directly.

  @Public()
  @Put('blob')
  @ApiOperation({ summary: '[local] Upload bytes to a signed URL' })
  async putBlob(@Query('token') token: string, @Req() req: Request) {
    const claims = await this.local.verifyToken(token).catch(() => null);
    if (!claims || claims.op !== 'put') {
      throw new BadRequestException({ message: 'Invalid upload token', code: 'INVALID_TOKEN' });
    }
    const data = await this.readRawBody(req);
    await this.local.write(claims.fileKey, data);
    return { fileKey: claims.fileKey, sizeBytes: data.length };
  }

  @Public()
  @Get('blob')
  @ApiOperation({ summary: '[local] Download bytes from a signed URL' })
  async getBlob(@Query('token') token: string, @Res() res: Response) {
    const claims = await this.local.verifyToken(token).catch(() => null);
    if (!claims || claims.op !== 'get') {
      throw new BadRequestException({ message: 'Invalid download token', code: 'INVALID_TOKEN' });
    }
    const data = await this.local.read(claims.fileKey);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(data);
  }

  private readRawBody(req: Request): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on('data', (c: Buffer) => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  }
}
