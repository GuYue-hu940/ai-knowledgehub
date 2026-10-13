import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('knowledge_base')
export class KnowledgeBase {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string | undefined;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: string | undefined;

  @Column({ type: 'varchar', length: 128 })
  name: string | undefined;

  @Column({ type: 'text', nullable: true })
  description: string | null | undefined;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date | undefined;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date | undefined;
}
