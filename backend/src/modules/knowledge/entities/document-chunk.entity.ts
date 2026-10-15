import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('document_chunks')
export class DocumentChunk {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string | undefined;

  @Column({ name: 'document_id', type: 'bigint' })
  documentId: string | undefined;

  @Column({ name: 'knowledge_base_id', type: 'bigint' })
  knowledgeBaseId: string | undefined;

  @Column({ name: 'chunk_index', type: 'int' })
  chunkIndex: number | undefined;

  @Column({ type: 'mediumtext' })
  content: string | undefined;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date | undefined;
}
