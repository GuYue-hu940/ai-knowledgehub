import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { KnowledgeService } from './knowledge.service';

type AuthRequest = Request & {
  user: { id: string; email: string; name: string; role: string };
};

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post(':id/process')
  process(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.knowledgeService.processDocument(req.user.id, id);
  }

  @Get(':id/chunks')
  listChunks(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.knowledgeService.listChunks(req.user.id, id);
  }
}
