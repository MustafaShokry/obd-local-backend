import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ChatMessage } from './ChatMessage.entity';

@Entity()
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  lastMessage: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  startedAt: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  lastMessageDate: Date;

  @OneToMany(() => ChatMessage, (message) => message.session, { cascade: true })
  messages: ChatMessage[];
}
