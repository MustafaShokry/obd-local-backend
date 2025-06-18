import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { ReadingSummary } from './entities/readingSummary.entity';
import { LogSeverity } from './types/logs.types';

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
}
