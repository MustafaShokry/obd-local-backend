import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SensorType } from 'src/obd/types/obd.types';
import { LogSeverity } from '../types/logs.types';

@Entity()
export class ReadingSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  intervalStart: Date;

  @Column()
  intervalEnd: Date;

  @Column({ type: 'json' })
  summaries: {
    [key in SensorType]?: {
      min: number;
      max: number;
      avg: number;
      severity: LogSeverity;
      description: string;
    };
  };

  @Column({ default: false })
  synced: boolean;
}
