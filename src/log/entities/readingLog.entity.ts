import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ReadingLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  timestamp: Date;

  @Column({ type: 'float', nullable: true })
  engineRpm: number;

  @Column({ type: 'float', nullable: true })
  vehicleSpeed: number;

  @Column({ type: 'float', nullable: true })
  coolantTemp: number;

  @Column({ type: 'float', nullable: true })
  fuelLevel: number;

  // @Column({ type: 'float', nullable: true })
  // batteryVoltage: number;

  @Column({ type: 'float', nullable: true })
  intakeAirTemp: number;

  @Column({ type: 'float', nullable: true })
  throttlePosition: number;

  @Column({ default: false })
  synced: boolean;
}
