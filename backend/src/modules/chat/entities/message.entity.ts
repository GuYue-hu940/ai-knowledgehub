import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('message')
export class Message {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'conversation_id', type: 'bigint' })
  conversationId: string;

  @Column({ type: 'varchar', length: 16 })
  role: string;

  @Column({ type: 'mediumtext' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
