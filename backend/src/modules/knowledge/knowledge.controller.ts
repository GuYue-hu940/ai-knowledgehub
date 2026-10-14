import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { KnowledgeService } from './knowledge.service';

type AuthRequest = Request & {
  user: { id: string; email: string; name: string; role: string };
};

@Controller('knowledge-bases')
@UseGuards(JwtAuthGuard)
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateKnowledgeBaseDto) {
    return this.knowledgeService.create(req.user.id, dto);
  }

  @Get()
  list(@Req() req: AuthRequest) {
    return this.knowledgeService.list(req.user.id);
  }

  @Get(':id/documents')
  listDocuments(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.knowledgeService.listDocuments(req.user.id, id);
  }

  @Post(':id/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    }),
  )
  uploadDocument(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.knowledgeService.uploadDocument(req.user.id, id, file);
  }
}
