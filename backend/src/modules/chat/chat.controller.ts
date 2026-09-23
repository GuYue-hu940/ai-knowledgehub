import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { Res } from '@nestjs/common';
import type { Response } from 'express';

type AuthRequest = Request & {
  user: { id: string; email: string; name: string; role: string };
};

@Controller('conversations')
@UseGuards(JwtAuthGuard) //整个控制器都要登录
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateConversationDto) {
    return this.chatService.createConversation(req.user.id, dto);
  }

  @Get()
  list(@Req() req: AuthRequest) {
    return this.chatService.listConversations(req.user.id);
  }

  @Get(':id/message')
  listMessages(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.chatService.listMessages(req.user.id, id);
  }

  @Post(':id/message')
  createMessage(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.chatService.createMessage(req.user.id, id, dto);
  }

  @Post(':id/message/stream')
  async createMessageStream(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream;charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const writeEvent = (event: string, data: unknown) => {
      res.write(`event:${event}\n`);
      res.write(`data:${JSON.stringify(data)}\n\n`);
    };

    try {
      const result = await this.chatService.createMessageStream(
        req.user.id,
        id,
        dto,
        (delta) => writeEvent('token', { delta }),
      );

      writeEvent('done', {
        userMessage: result.userMessage,
        assistantMessage: result.assistantMessage,
      });
    } catch (e: any) {
      writeEvent('error', {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        message: e?.message || '流式生成失败',
      });
    } finally {
      res.end();
    }
  }
}
