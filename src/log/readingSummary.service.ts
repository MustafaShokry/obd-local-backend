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

  async getSummaries(from: Date, to: Date): Promise<ReadingSummary[]> {
    return this.readingSummaryRepository.find({
      where: {
        intervalStart: Between(from, to),
      },
    });
  }
}
