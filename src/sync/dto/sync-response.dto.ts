import { ReadingLog } from 'src/log/entities/readingLog.entity';
import { DiagnosticLog } from 'src/log/entities/diagnosticLog.entity';
import { EventLog } from 'src/log/entities/eventLog.entity';
import { ReadingSummary } from 'src/log/entities/readingSummary.entity';

export class SyncResponseDto {
  readings: ReadingLog[];
  diagnostics: DiagnosticLog[];
  events: EventLog[];
  summaries: ReadingSummary[];
  hasMore: boolean;
  totalUnsynced: {
    readings: number;
    diagnostics: number;
    events: number;
    summaries: number;
  };
}
