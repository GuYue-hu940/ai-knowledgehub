import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { KnowledgeBase } from './entities/knowledge-base.entity';

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(KnowledgeBase)
    private readonly kbRepo: Repository<KnowledgeBase>,
  ) {}

  create(userId: string, dto: CreateKnowledgeBaseDto) {
    const kb = this.kbRepo.create({
      userId,
      name: dto.name?.trim() ?? '',
      description: dto.description?.trim() || null,
    });
    return this.kbRepo.save(kb);
  }

  list(userId: string) {
    return this.kbRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }
}
