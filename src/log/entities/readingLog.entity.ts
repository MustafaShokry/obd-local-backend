import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { LogSeverity } from '../types/logs.types';
import { SensorType } from 'src/obd/types/obd.types';

@Entity()
export class ReadingLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  timestamp: Date;

  @Column({ type: 'json' })
  readings: {
    [key in SensorType]: {
      reading: number;
      severity: LogSeverity;
    } | null;
  };

  @Column({ default: false })
  synced: boolean;
}
