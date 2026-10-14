import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string | undefined;

  @Column({ name: 'knowledge_base_id', type: 'bigint' })
  knowledgeBaseId: string | undefined;

  @Column({ type: 'varchar', length: 255 })
  filename: string | undefined;

  @Column({ name: 'file_type', type: 'varchar', length: 32 })
  fileType: string | undefined;

  @Column({ name: 'file_size', type: 'int' })
  fileSize: number | undefined;

  @Column({ name: 'storage_path', type: 'varchar', length: 512 })
  storagePath: string | undefined;

  @Column({
    type: 'varchar',
    length: 32,
    default: 'pending',
  })
  status: string | undefined;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null | undefined;

  @Column({ name: 'chunk_count', type: 'int', default: 0 })
  chunkCount: number | undefined;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date | undefined;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date | undefined;
}
