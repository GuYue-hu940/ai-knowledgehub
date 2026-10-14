import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { Repository } from 'typeorm';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { Document } from './entities/document.entity';
import { KnowledgeBase } from './entities/knowledge-base.entity';

@Injectable()
export class KnowledgeService {
  private readonly uploadRoot = join(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(KnowledgeBase)
    private readonly kbRepo: Repository<KnowledgeBase>,
    @InjectRepository(Document)
    private readonly docRepo: Repository<Document>,
  ) {
    if (!existsSync(this.uploadRoot)) {
      mkdirSync(this.uploadRoot, { recursive: true });
    }
  }

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

  /** 只能操作自己的知识库 */
  async getOwnedKnowledgeBase(userId: string, kbId: string) {
    const kb = await this.kbRepo.findOne({ where: { id: kbId } });
    if (!kb) throw new NotFoundException('知识库不存在');
    if (kb.userId !== userId) {
      throw new ForbiddenException('无权访问该知识库');
    }
    return kb;
  }

  async listDocuments(userId: string, kbId: string) {
    await this.getOwnedKnowledgeBase(userId, kbId);
    return this.docRepo.find({
      where: { knowledgeBaseId: kbId },
      order: { createdAt: 'DESC' },
    });
  }

  async uploadDocument(
    userId: string,
    kbId: string,
    file: Express.Multer.File,
  ) {
    await this.getOwnedKnowledgeBase(userId, kbId);

    if (!file) {
      throw new NotFoundException('未收到文件');
    }

    const ext = extname(file.originalname).replace('.', '').toLowerCase();
    const allowed = ['txt', 'md', 'pdf'];
    if (!allowed.includes(ext)) {
      throw new ForbiddenException('仅支持 txt / md / pdf');
    }

    // file.path 由 multer diskStorage 生成
    const doc = this.docRepo.create({
      knowledgeBaseId: kbId,
      filename: file.originalname,
      fileType: ext,
      fileSize: file.size,
      storagePath: file.path,
      status: 'pending',
      errorMessage: null,
      chunkCount: 0,
    });

    return this.docRepo.save(doc);
  }
}
