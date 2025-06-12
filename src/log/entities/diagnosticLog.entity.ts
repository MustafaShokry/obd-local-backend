import { PrimaryGeneratedColumn, Column, Entity } from 'typeorm';
import { DiagnosticStatus, LogSeverity } from '../types/logs.types';

@Entity()
export class DiagnosticLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  timestamp: Date;

  @Column()
  code: string;

  @Column()
  description: string;

  @Column()
  status: DiagnosticStatus;

  @Column()
  severity: LogSeverity;

  @Column()
  occurrenceCount: number;

  @Column()
  lastOccurrence: Date;

  @Column({ nullable: true })
  clearedAt: Date;

  @Column({ default: false })
  synced: boolean;
}
