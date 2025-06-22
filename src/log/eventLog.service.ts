import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EventLog } from './entities/eventLog.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from 'src/obd/entities/enums/event.enum';

@Injectable()
export class EventLogService {
  constructor(
    @InjectRepository(EventLog)
    private readonly eventLogRepository: Repository<EventLog>,
  ) {}

  async create(type: Event, message?: string): Promise<EventLog> {
    const log = this.eventLogRepository.create({
      type,
      message,
      timestamp: new Date(),
      synced: false,
    });
    return this.eventLogRepository.save(log);
  }

  async getAll(): Promise<EventLog[]> {
    return this.eventLogRepository.find();
  }

  async getByType(type: Event): Promise<EventLog[]> {
    return this.eventLogRepository.find({ where: { type } });
  }

  async getUnsynced(skip?: number, take?: number): Promise<EventLog[]> {
    const options: {
      where: { synced: boolean };
      skip?: number;
      take?: number;
    } = { where: { synced: false } };
    if (skip !== undefined) options.skip = skip;
    if (take !== undefined) options.take = take;
    return this.eventLogRepository.find(options);
  }

  async getUnsyncedCount(): Promise<number> {
    return this.eventLogRepository.count({ where: { synced: false } });
  }

  async markAsSynced(ids: string[]): Promise<void> {
    await this.eventLogRepository.update(ids, { synced: true });
  }
}
