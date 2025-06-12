import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column({ type: 'blob', nullable: true })
  userImage?: Buffer;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ type: 'json' })
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @Column()
  licenseNumber: string;

  @Column()
  licenseExpiry: string;

  @Column({ type: 'json' })
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };

  @Column()
  subscriptionPlan: string;

  @Column()
  subscriptionExpiry: string;

  @Column({ type: 'json' })
  settings: {
    units: string;
    language: string;
    aiChat: {
      language: string;
      voice: string;
      autoPlay: string;
    };
    theme: string;
    dashboard: {
      selectedSensors: string[];
      refreshRate: number;
      showWarnings: boolean;
      autoScale: boolean;
      gaugeSize: number;
    };
    notifications: {
      enabled: boolean;
      sound: boolean;
      vibration: boolean;
      criticalOnly: boolean;
    };
    dataLogging: {
      enabled: boolean;
      interval: number;
      maxFileSize: number;
    };
    display: {
      keepScreenOn: boolean;
      brightness: number;
      orientation: string;
    };
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
