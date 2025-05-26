import { Injectable } from '@nestjs/common';
import { DiagnosticLog } from './entities/diagnosticLog.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

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
      order: { timestamp: 'DESC' },
    });
  }

  async getUnsynced(): Promise<DiagnosticLog[]> {
    return this.diagnosticLogRepository.find({ where: { synced: false } });
  }

  async markAsSynced(ids: string[]): Promise<void> {
    await this.diagnosticLogRepository.update(ids, { synced: true });
  }
}
