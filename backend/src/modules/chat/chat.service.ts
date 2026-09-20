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

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
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

    //占位还没接LLM，先写一条固定助手回复
    const assistantMessage = await this.messageRepo.save(
      this.messageRepo.create({
        conversationId,
        role: 'assistant',
        content: `(占位回复) 已收到${dto.content}`,
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
}
