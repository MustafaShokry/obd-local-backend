import { BadRequestException, Injectable } from '@nestjs/common';
import { DiagnosticLogService } from 'src/log/diagnosticLog.service';
import { DiagnosticLog } from 'src/log/entities/diagnosticLog.entity';
import { EventLog } from 'src/log/entities/eventLog.entity';
import { ReadingLog } from 'src/log/entities/readingLog.entity';
import { EventLogService } from 'src/log/eventLog.service';
import { ReadingLogService } from 'src/log/readingLog.service';
import { MarkSyncedDto } from './dto/mark-synced.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { Notification } from 'src/notifications/entities/notification.entity';

@Injectable()
export class SyncService {
  constructor(
    private readonly readingLogService: ReadingLogService,
    private readonly diagnosticLogService: DiagnosticLogService,
    private readonly eventLogService: EventLogService,
    private readonly notificationsService: NotificationsService,
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

    const notification = new Notification();
    notification.type = 'info';
    notification.title = 'Synced';
    notification.message = `Synced ${readings.length} readings, ${diagnostics.length} diagnostics, and ${events.length} events to the mobile app, please connect the device to the internet to sync the data.`;
    await this.notificationsService.createNotification(notification);
    return {
      readings,
      diagnostics,
      events,
    };
  }

  async markAllAsSynced(data: MarkSyncedDto): Promise<{ success: boolean }> {
    if (!data) {
      throw new BadRequestException('No data provided');
    }
    await Promise.all([
      'readingIds' in data &&
        (await this.readingLogService.markAsSynced(data.readingIds)),
      'diagnosticIds' in data &&
        (await this.diagnosticLogService.markAsSynced(data.diagnosticIds)),
      'eventIds' in data &&
        (await this.eventLogService.markAsSynced(data.eventIds)),
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
