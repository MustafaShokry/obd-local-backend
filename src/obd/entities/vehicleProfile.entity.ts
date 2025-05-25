import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { obdCurrentDataPid } from './enums/obdCurrentDataPid.enum';
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

  @Column({ type: 'blob', nullable: true })
  carImage?: Buffer;

  @Column('simple-json')
  supported_PIDs: obdCurrentDataPid[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
