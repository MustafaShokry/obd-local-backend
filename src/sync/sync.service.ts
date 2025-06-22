import { BadRequestException, Injectable } from '@nestjs/common';
import { DiagnosticLogService } from 'src/log/diagnosticLog.service';
import { EventLogService } from 'src/log/eventLog.service';
import { ReadingLogService } from 'src/log/readingLog.service';
import { MarkSyncedDto } from './dto/mark-synced.dto';
import { SyncResponseDto } from './dto/sync-response.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { Notification } from 'src/notifications/entities/notification.entity';
import { ReadingSummaryService } from 'src/log/readingSummary.service';

@Injectable()
export class SyncService {
  // Maximum records per sync request to prevent 413 errors
  private readonly MAX_RECORDS_PER_SYNC = 40;
  // Priority order for data types (higher priority first)
  private readonly DATA_PRIORITY = [
    'summaries',
    'diagnostics',
    'readings',
    'events',
  ];

  constructor(
    private readonly readingLogService: ReadingLogService,
    private readonly diagnosticLogService: DiagnosticLogService,
    private readonly eventLogService: EventLogService,
    private readonly notificationsService: NotificationsService,
    private readonly readingSummaryService: ReadingSummaryService,
  ) {}

  async getSyncPayload(limit?: number): Promise<SyncResponseDto> {
    const maxRecords = limit || this.MAX_RECORDS_PER_SYNC;

    // Get counts of unsynced data
    const [readingsCount, diagnosticsCount, eventsCount, summariesCount] =
      await Promise.all([
        this.readingLogService.getUnsyncedCount(),
        this.diagnosticLogService.getUnsyncedCount(),
        this.eventLogService.getUnsyncedCount(),
        this.readingSummaryService.getUnsyncedCount(),
      ]);

    // Calculate how many records to fetch for each type based on priority and available space
    const allocation = this.calculateDataAllocation(
      maxRecords,
      readingsCount,
      diagnosticsCount,
      eventsCount,
      summariesCount,
    );

    // Fetch data with limits
    const [readings, diagnostics, events, summaries] = await Promise.all([
      allocation.readings > 0
        ? this.readingLogService.getUnsynced(0, allocation.readings)
        : Promise.resolve([]),
      allocation.diagnostics > 0
        ? this.diagnosticLogService.getUnsynced(0, allocation.diagnostics)
        : Promise.resolve([]),
      allocation.events > 0
        ? this.eventLogService.getUnsynced(0, allocation.events)
        : Promise.resolve([]),
      allocation.summaries > 0
        ? this.readingSummaryService.getUnsynced(0, allocation.summaries)
        : Promise.resolve([]),
    ]);

    const totalFetched =
      readings.length + diagnostics.length + events.length + summaries.length;
    const hasMore =
      totalFetched <
      readingsCount + diagnosticsCount + eventsCount + summariesCount;

    const notification = new Notification();
    notification.type = 'info';
    notification.title = 'Synced';
    notification.message = `Synced ${readings.length} readings, ${diagnostics.length} diagnostics, ${events.length} events, and ${summaries.length} summaries to the mobile app${hasMore ? ' (more data available)' : ''}. Please connect the device to the internet to sync the data.`;
    await this.notificationsService.createNotification(notification);

    return {
      readings,
      diagnostics,
      events,
      summaries,
      hasMore,
      totalUnsynced: {
        readings: readingsCount,
        diagnostics: diagnosticsCount,
        events: eventsCount,
        summaries: summariesCount,
      },
    };
  }

  private calculateDataAllocation(
    maxRecords: number,
    readingsCount: number,
    diagnosticsCount: number,
    eventsCount: number,
    summariesCount: number,
  ): {
    readings: number;
    diagnostics: number;
    events: number;
    summaries: number;
  } {
    const allocation = { readings: 0, diagnostics: 0, events: 0, summaries: 0 };
    let remainingRecords = maxRecords;

    // Allocate records based on priority
    for (const dataType of this.DATA_PRIORITY) {
      if (remainingRecords <= 0) break;

      let count = 0;
      switch (dataType) {
        case 'diagnostics':
          count = Math.min(diagnosticsCount, remainingRecords);
          allocation.diagnostics = count;
          break;
        case 'events':
          count = Math.min(eventsCount, remainingRecords);
          allocation.events = count;
          break;
        case 'summaries':
          count = Math.min(summariesCount, remainingRecords);
          allocation.summaries = count;
          break;
        case 'readings':
          count = Math.min(readingsCount, remainingRecords);
          allocation.readings = count;
          break;
      }
      remainingRecords -= count;
    }

    return allocation;
  }

  async markAllAsSynced(data: MarkSyncedDto): Promise<{ success: boolean }> {
    if (!data) {
      throw new BadRequestException('No data provided');
    }
    await Promise.all([
      'readingIds' in data &&
        data.readingIds.length > 0 &&
        (await this.readingLogService.markAsSynced(data.readingIds)),
      'diagnosticIds' in data &&
        data.diagnosticIds.length > 0 &&
        (await this.diagnosticLogService.markAsSynced(data.diagnosticIds)),
      'eventIds' in data &&
        data.eventIds.length > 0 &&
        (await this.eventLogService.markAsSynced(data.eventIds)),
      'summaryIds' in data &&
        data.summaryIds.length > 0 &&
        (await this.readingSummaryService.markAsSynced(data.summaryIds)),
    ]);
    const notification = new Notification();
    notification.type = 'success';
    notification.title = 'Synced to the cloud';
    notification.message = 'Data synced successfully to the cloud';
    await this.notificationsService.createNotification(notification);
    return {
      success: true,
    };
  }
}
