import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentController } from './document.controller';
import { DocumentChunk } from './entities/document-chunk.entity';
import { Document } from './entities/document.entity';
import { KnowledgeBase } from './entities/knowledge-base.entity';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgeBase, Document, DocumentChunk])],
  controllers: [KnowledgeController, DocumentController],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
