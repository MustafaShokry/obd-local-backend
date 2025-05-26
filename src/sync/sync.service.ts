import { Injectable } from '@nestjs/common';
import { DiagnosticLogService } from 'src/log/diagnosticLog.service';
import { DiagnosticLog } from 'src/log/entities/diagnosticLog.entity';
import { EventLog } from 'src/log/entities/eventLog.entity';
import { ReadingLog } from 'src/log/entities/readingLog.entity';
import { EventLogService } from 'src/log/eventLog.service';
import { ReadingLogService } from 'src/log/readingLog.service';
import { MarkSyncedDto } from './dto/mark-synced.dto';

@Injectable()
export class SyncService {
  constructor(
    private readonly readingLogService: ReadingLogService,
    private readonly diagnosticLogService: DiagnosticLogService,
    private readonly eventLogService: EventLogService,
  ) {}

  async getSyncPayload(): Promise<{
    readings: ReadingLog[];
    diagnostics: DiagnosticLog[];
    events: EventLog[];
  }> {
    const [readings, diagnostics, events] = await Promise.all([
      this.readingLogService.getUnsynced(),
      this.diagnosticLogService.getUnsynced(),
      this.eventLogService.getUnsynced(),
    ]);

    return {
      readings,
      diagnostics,
      events,
    };
  }

  async markAllAsSynced(data: MarkSyncedDto): Promise<void> {
    await Promise.all([
      this.readingLogService.markAsSynced(data.readingIds),
      this.diagnosticLogService.markAsSynced(data.diagnosticIds),
      this.eventLogService.markAsSynced(data.eventIds),
    ]);
  }
}
