import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { ReadingSummary } from './entities/readingSummary.entity';

@Injectable()
export class ReadingSummaryService {
  constructor(
    @InjectRepository(ReadingSummary)
    private readonly readingSummaryRepository: Repository<ReadingSummary>,
  ) {}

  async create(summary: ReadingSummary): Promise<ReadingSummary> {
    return this.readingSummaryRepository.save(summary);
  }

  async getSummaries(from: Date, to: Date): Promise<any> {
    const summaries = await this.readingSummaryRepository.find({
      where: {
        intervalStart: Between(from, to),
      },
    });

    return summaries.map((s) => ({
      id: s.id,
      timestamp: s.intervalEnd,
      type: 'readings',
      ...s.summaries,
    }));
  }

  async getUnsynced(skip?: number, take?: number): Promise<ReadingSummary[]> {
    const options: {
      where: { synced: boolean };
      skip?: number;
      take?: number;
    } = { where: { synced: false } };
    if (skip !== undefined) options.skip = skip;
    if (take !== undefined) options.take = take;
    return this.readingSummaryRepository.find(options);
  }

  async getUnsyncedCount(): Promise<number> {
    return this.readingSummaryRepository.count({ where: { synced: false } });
  }

  async markAsSynced(ids: string[]): Promise<void> {
    await this.readingSummaryRepository.update(ids, { synced: true });
  }
}
