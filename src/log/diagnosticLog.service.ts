import { Injectable } from '@nestjs/common';
import { DiagnosticLog } from './entities/diagnosticLog.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DiagnosticStatus } from './types/logs.types';

@Injectable()
export class DiagnosticLogService {
  constructor(
    @InjectRepository(DiagnosticLog)
    private readonly diagnosticLogRepository: Repository<DiagnosticLog>,
  ) {}

  async create(log: Partial<DiagnosticLog>): Promise<DiagnosticLog> {
    const newLog = this.diagnosticLogRepository.create({
      ...log,
      timestamp: new Date(),
    });
    return this.diagnosticLogRepository.save(newLog);
  }

  async getAll(): Promise<DiagnosticLog[]> {
    return this.diagnosticLogRepository.find();
  }

  async getLatest(): Promise<DiagnosticLog | null> {
    return this.diagnosticLogRepository.findOne({
      where: {},
      order: { timestamp: 'DESC' },
    });
  }

  async getUnsynced(skip?: number, take?: number): Promise<DiagnosticLog[]> {
    const options: {
      where: { synced: boolean };
      skip?: number;
      take?: number;
    } = { where: { synced: false } };
    if (skip !== undefined) options.skip = skip;
    if (take !== undefined) options.take = take;
    return this.diagnosticLogRepository.find(options);
  }

  async getUnsyncedCount(): Promise<number> {
    return this.diagnosticLogRepository.count({ where: { synced: false } });
  }

  async findByCodeAndStatus(
    code: string,
    status: DiagnosticStatus,
  ): Promise<DiagnosticLog | null> {
    return this.diagnosticLogRepository.findOne({
      where: { code, status },
      order: { lastOccurrence: 'DESC' },
    });
  }

  async update(
    id: string,
    log: Partial<DiagnosticLog>,
  ): Promise<DiagnosticLog | null> {
    await this.diagnosticLogRepository.update(id, log);
    return this.diagnosticLogRepository.findOne({ where: { id } });
  }

  async markAsSynced(ids: string[]): Promise<void> {
    await this.diagnosticLogRepository.update(ids, { synced: true });
  }
}
