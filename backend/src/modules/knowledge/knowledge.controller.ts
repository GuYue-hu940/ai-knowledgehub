import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
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
}
