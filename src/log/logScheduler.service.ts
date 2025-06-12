import { Injectable } from '@nestjs/common';
import { ObdService } from 'src/obd/obd.service';
import { ReadingLogService } from './readingLog.service';
import { EventLogService } from './eventLog.service';
import { DiagnosticLogService } from './diagnosticLog.service';
import { Cron } from '@nestjs/schedule';
import { ReadingLog } from './entities/readingLog.entity';
import { DiagnosticLog } from './entities/diagnosticLog.entity';
import { DiagnosticStatus, LogSeverity } from './types/logs.types';
import { NotificationsService } from 'src/notifications/notifications.service';
import { Notification } from 'src/notifications/entities/notification.entity';
import { SensorType } from 'src/obd/types/obd.types';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class ObdSchedulerService {
  constructor(
    private readonly obdService: ObdService,
    private readonly readingLogService: ReadingLogService,
    private readonly diagnosticLogService: DiagnosticLogService,
    private readonly eventLogService: EventLogService,
    private readonly notificationsService: NotificationsService,
    private readonly authService: AuthService,
  ) {}

  @Cron('*/10 * * * * *')
  async collectReadingLogs() {
    if (!(await this.authService.isUserLoggedIn())) {
      return;
    }
    const readings = this.obdService.getCurrentData();
    const user = await this.authService.getUserProfile();
    const { sensorConfigs } = this.obdService.getConfig(
      user.settings.units === 'imperial',
    );

    const readingLog = new ReadingLog();
    readingLog.readings = {} as {
      [key in SensorType]: {
        reading: number;
        severity: LogSeverity;
      } | null;
    };
    for (const [sensor, reading] of Object.entries(readings)) {
      const sensorConfig = sensorConfigs.find((s) => s.key === sensor);
      if (
        reading &&
        sensorConfig &&
        typeof reading === 'number' &&
        reading >= sensorConfig.min &&
        reading <= sensorConfig.max
      ) {
        readingLog.readings[sensor] = {
          sensor: sensor,
          reading: reading,
          severity: LogSeverity.INFO,
        };
      } else if (
        reading &&
        sensorConfig &&
        typeof reading === 'number' &&
        sensorConfig.warning?.min &&
        sensorConfig.warning?.max &&
        (reading > sensorConfig.warning.min ||
          reading < sensorConfig.warning.max)
      ) {
        readingLog.readings[sensor] = {
          sensor: sensor,
          reading: reading,
          severity: LogSeverity.WARNING,
        };
        const notification = new Notification();
        notification.type = 'warning';
        notification.title = 'Sensor reading in the warning range';
        notification.message = `${sensorConfig.title}: ${reading} ${sensorConfig.unit} (${sensorConfig.warning.min} ${sensorConfig.unit} - ${sensorConfig.warning.max} ${sensorConfig.unit})`;
        await this.notificationsService.createNotification(notification);
      } else if (
        reading &&
        sensorConfig &&
        typeof reading === 'number' &&
        sensorConfig.criticalRange?.min &&
        sensorConfig.criticalRange?.max &&
        (reading > sensorConfig.criticalRange.min ||
          reading < sensorConfig.criticalRange.max)
      ) {
        readingLog.readings[sensor] = {
          sensor: sensor,
          reading: reading,
          severity: LogSeverity.CRITICAL,
        };
        const notification = new Notification();
        notification.type = 'error';
        notification.title = 'Sensor reading in the critical range';
        notification.message = `${sensorConfig.title}: ${reading} ${sensorConfig.unit} (${sensorConfig.criticalRange.min} ${sensorConfig.unit} - ${sensorConfig.criticalRange.max} ${sensorConfig.unit})`;
        await this.notificationsService.createNotification(notification);
      }
    }

    await this.readingLogService.create(readingLog);
  }

  @Cron('*/90 * * * * *')
  async collectDiagnosticLogs() {
    if (!(await this.authService.isUserLoggedIn())) {
      return;
    }
    const activeDTCs = this.obdService.getActiveDTCs();
    const pendingDTCs = this.obdService.getPendingDTCs();

    for (const dtc of activeDTCs) {
      const existingLog = await this.diagnosticLogService.findByCodeAndStatus(
        dtc.code,
        DiagnosticStatus.ACTIVE,
      );

      if (existingLog) {
        // Update existing log
        await this.diagnosticLogService.update(existingLog.id, {
          lastOccurrence: new Date(),
          occurrenceCount: existingLog.occurrenceCount + 1,
        });
      } else {
        // Create new log
        const diagnosticLog = new DiagnosticLog();
        diagnosticLog.code = dtc.code;
        diagnosticLog.description = dtc.description;
        diagnosticLog.status = DiagnosticStatus.ACTIVE;
        diagnosticLog.severity = LogSeverity.CRITICAL;
        diagnosticLog.occurrenceCount = 1;
        diagnosticLog.lastOccurrence = new Date();
        await this.diagnosticLogService.create(diagnosticLog);
        // send notification
        const notification = new Notification();
        notification.type = 'error';
        notification.title = 'Diagnostic code detected';
        notification.message = `${dtc.code}: ${dtc.description}`;
        await this.notificationsService.createNotification(notification);
      }
    }

    for (const dtc of pendingDTCs) {
      const existingLog = await this.diagnosticLogService.findByCodeAndStatus(
        dtc.code,
        DiagnosticStatus.PENDING,
      );

      if (existingLog) {
        // Update existing log
        await this.diagnosticLogService.update(existingLog.id, {
          lastOccurrence: new Date(),
          occurrenceCount: existingLog.occurrenceCount + 1,
        });
      } else {
        // Create new log
        const diagnosticLog = new DiagnosticLog();
        diagnosticLog.code = dtc.code;
        diagnosticLog.description = dtc.description;
        diagnosticLog.status = DiagnosticStatus.PENDING;
        diagnosticLog.severity = LogSeverity.CRITICAL;
        diagnosticLog.occurrenceCount = 1;
        diagnosticLog.lastOccurrence = new Date();
        await this.diagnosticLogService.create(diagnosticLog);
        // send notification
        const notification = new Notification();
        notification.type = 'warning';
        notification.title = 'Diagnostic code pending';
        notification.message = `${dtc.code}: ${dtc.description}.`;
        await this.notificationsService.createNotification(notification);
      }
    }
  }
}
