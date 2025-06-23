import { PrimaryGeneratedColumn, Column, Entity } from 'typeorm';
import { Event } from '../../obd/entities/enums/event.enum';
import { LogSeverity } from '../types/logs.types';

@Entity()
export class EventLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: Event;

  @Column()
  title: string;

  @Column()
  severity: LogSeverity;

  @Column()
  timestamp: Date;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ default: false })
  synced: boolean;
}
