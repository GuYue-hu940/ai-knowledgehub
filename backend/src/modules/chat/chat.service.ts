import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { LlmService } from '../llm/llm.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly llmService: LlmService,
  ) {}

  createConversation(userId: string, dto: CreateConversationDto) {
    const conversation = this.conversationRepo.create({
      userId,
      title: dto.title?.trim() || '新对话',
    });
    return this.conversationRepo.save(conversation);
  }

  listConversations(userId: string) {
    return this.conversationRepo.find({
      where: { userId },
      order: { updateAt: 'DESC' },
    });
  }

  private async getOwnedConversation(userId: string, conversationId: string) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('会话不存在');
    }
    if (conversation.userId !== userId) {
      throw new ForbiddenException('无权限访问该会话');
    }
    return conversation;
  }

  async listMessages(userId: string, conversationId: string) {
    await this.getOwnedConversation(userId, conversationId);
    return this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }

  async createMessage(
    userId: string,
    conversationId: string,
    dto: CreateMessageDto,
  ) {
    const conversation = await this.getOwnedConversation(
      userId,
      conversationId,
    );

    const userMessage = await this.messageRepo.save(
      this.messageRepo.create({
        conversationId,
        role: 'user',
        content: dto.content,
      }),
    );

    const history = await this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });

    const answer = await this.llmService.chat([
      {
        role: 'system',
        content: '你是 AI KnowledgeHub 企业助手，回答简洁准确。',
      },
      ...history.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ]);

    const assistantMessage = await this.messageRepo.save(
      this.messageRepo.create({
        conversationId,
        role: 'assistant',
        content: answer,
      }),
    );

    //更新会话时间，列表会按updateAt排序
    conversation.updateAt = new Date();
    await this.conversationRepo.save(conversation);

    //首条消息时，用用户内容截断当前标题
    if (conversation.title === '新对话') {
      conversation.title = dto.content.slice(0, 20);
      await this.conversationRepo.save(conversation);
    }

    return {
      userMessage,
      assistantMessage,
    };
  }

  async createMessageStream(
    userId: string,
    conversationId: string,
    dto: CreateMessageDto,
    onToken: (delta: string) => void,
  ) {
    const conversation = await this.getOwnedConversation(
      userId,
      conversationId,
    );

    const userMessage = await this.messageRepo.save(
      this.messageRepo.create({
        conversationId,
        role: 'user',
        content: dto.content,
      }),
    );

    const history = await this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });

    let fullAnswer = '';
    for await (const delta of this.llmService.chatStream([
      {
        role: 'system',
        content: '你是AI KnowledgeHub 企业助手，回答简洁准确有逻辑',
      },
      ...history.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ])) {
      fullAnswer += delta;
      onToken(delta);
    }

    const assistantMessage = await this.messageRepo.save(
      this.messageRepo.create({
        conversationId,
        role: 'assistant',
        content: fullAnswer,
      }),
    );

    conversation.updateAt = new Date();
    await this.conversationRepo.save(conversation);

    if (conversation.title === '新对话') {
      conversation.title = dto.content.slice(0, 20);
      await this.conversationRepo.save(conversation);
    }

    return { userMessage, assistantMessage };
  }
}
