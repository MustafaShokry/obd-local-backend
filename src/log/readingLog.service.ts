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

  async getUnsynced(skip?: number, take?: number): Promise<ReadingLog[]> {
    const options: {
      where: { synced: boolean };
      skip?: number;
      take?: number;
    } = { where: { synced: false } };
    if (skip !== undefined) options.skip = skip;
    if (take !== undefined) options.take = take;
    return this.readingLogRepository.find(options);
  }

  async getUnsyncedCount(): Promise<number> {
    return this.readingLogRepository.count({ where: { synced: false } });
  }

  async markAsSynced(ids: string[]): Promise<void> {
    await this.readingLogRepository.update(ids, { synced: true });
  }
}
