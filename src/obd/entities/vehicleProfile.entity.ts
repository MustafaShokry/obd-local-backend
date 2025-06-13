import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObdProtocol } from './enums/obdProtocol.enum';

@Entity()
export class VehicleProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  vin: string;

  @Column()
  protocol: ObdProtocol;

  @Column({ nullable: true })
  make?: string;

  @Column({ nullable: true })
  model?: string;

  @Column({ type: 'int', nullable: true })
  year?: number;

  @Column({ nullable: true })
  trim?: string;

  @Column({ nullable: true })
  color?: string;

  @Column({ nullable: true })
  engineSize?: string;

  @Column({ nullable: true })
  transmission?: string;

  @Column({ nullable: true })
  fuelType?: string;

  @Column({ nullable: true })
  lastService?: Date;

  @Column({ nullable: true })
  nextService?: Date;

  @Column({ type: 'blob', nullable: true })
  carImage?: Buffer;

  @Column('simple-json')
  supportedSensors: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
