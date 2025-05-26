import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ReadingLog } from './entities/readingLog.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ReadingLogService {
  constructor(
    @InjectRepository(ReadingLog)
    private readonly readingLogRepository: Repository<ReadingLog>,
  ) {}

  async create(log: Partial<ReadingLog>): Promise<ReadingLog> {
    const newLog = this.readingLogRepository.create({
      ...log,
      timestamp: new Date(),
    });
    return this.readingLogRepository.save(newLog);
  }

  async getAll(): Promise<ReadingLog[]> {
    return this.readingLogRepository.find();
  }

  async getUnsynced(): Promise<ReadingLog[]> {
    return this.readingLogRepository.find({ where: { synced: false } });
  }

  async markAsSynced(ids: string[]): Promise<void> {
    await this.readingLogRepository.update(ids, { synced: true });
  }
}
