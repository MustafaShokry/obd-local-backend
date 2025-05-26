import { PrimaryGeneratedColumn, Column, Entity } from 'typeorm';

@Entity()
export class DiagnosticLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  timestamp: Date;

  @Column({ type: 'simple-array' })
  activeDTCs: string[];

  @Column({ type: 'simple-array', nullable: true })
  pendingDTCs: string[];

  @Column({ default: false })
  synced: boolean;
}
