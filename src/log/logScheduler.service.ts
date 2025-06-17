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
import { ReadingSummary } from './entities/readingSummary.entity';
import { ReadingSummaryService } from './readingSummary.service';

@Injectable()
export class ObdSchedulerService {
  constructor(
    private readonly obdService: ObdService,
    private readonly readingLogService: ReadingLogService,
    private readonly diagnosticLogService: DiagnosticLogService,
    private readonly eventLogService: EventLogService,
    private readonly notificationsService: NotificationsService,
    private readonly authService: AuthService,
    private readonly readingSummaryService: ReadingSummaryService,
  ) {}

  private readingBuffer: {
    [key in SensorType]?: number[];
  } = {};
  private currentWindowStart = new Date();
  private lastNotificationTimestamps = new Map<SensorType, Date>();
  private cooldownPeriodMs = 5 * 60 * 1000;

  @Cron('*/10 * * * * *')
  async collectReadingLogs() {
    if (!(await this.authService.isUserLoggedIn())) {
      return;
    }
    const user = await this.authService.getUserProfile();
    if (
      !user.settings.dataLogging.enabled &&
      !user.settings.notifications.enabled
    ) {
      return;
    }
    const readings = this.obdService.getCurrentData();
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
        sensorConfig.warning?.min &&
        sensorConfig.warning?.max &&
        reading > sensorConfig.warning.min &&
        reading < sensorConfig.warning.max
      ) {
        if (user.settings.dataLogging.enabled) {
          // readingLog.readings[sensor] = {
          //   sensor: sensor,
          //   reading: reading,
          //   severity: LogSeverity.WARNING,
          // };
          if (reading != null && typeof reading === 'number') {
            if (!this.readingBuffer[sensor]) {
              this.readingBuffer[sensor] = [];
            }
            this.readingBuffer[sensor].push(reading);
          }
        }
        if (
          user.settings.notifications.enabled &&
          !user.settings.notifications.criticalOnly
        ) {
          const lastNotified = this.lastNotificationTimestamps.get(
            sensor as SensorType,
          );
          if (
            !lastNotified ||
            Date.now() - lastNotified.getTime() > this.cooldownPeriodMs
          ) {
            const notification = new Notification();
            notification.type = 'warning';
            notification.title = 'Sensor reading in the warning range';
            notification.message = `${sensorConfig.title}: ${reading} ${sensorConfig.unit} (${sensorConfig.warning.min} ${sensorConfig.unit} - ${sensorConfig.warning.max} ${sensorConfig.unit})`;
            await this.notificationsService.createNotification(notification);
            this.lastNotificationTimestamps.set(
              sensor as SensorType,
              new Date(),
            );
          }
        }
      } else if (
        reading &&
        sensorConfig &&
        typeof reading === 'number' &&
        sensorConfig.criticalRange?.min &&
        sensorConfig.criticalRange?.max &&
        reading > sensorConfig.criticalRange.min &&
        reading < sensorConfig.criticalRange.max
      ) {
        if (user.settings.dataLogging.enabled) {
          readingLog.readings[sensor] = {
            sensor: sensor,
            reading: reading,
            severity: LogSeverity.CRITICAL,
          };
        }
        if (user.settings.notifications.enabled) {
          const lastNotified = this.lastNotificationTimestamps.get(
            sensor as SensorType,
          );
          if (
            !lastNotified ||
            Date.now() - lastNotified.getTime() > this.cooldownPeriodMs
          ) {
            const notification = new Notification();
            notification.type = 'error';
            notification.title = 'Sensor reading in the critical range';
            notification.message = `${sensorConfig.title}: ${reading} ${sensorConfig.unit} (${sensorConfig.criticalRange.min} ${sensorConfig.unit} - ${sensorConfig.criticalRange.max} ${sensorConfig.unit})`;
            await this.notificationsService.createNotification(notification);
            this.lastNotificationTimestamps.set(
              sensor as SensorType,
              new Date(),
            );
          }
        }
      } else {
        if (user.settings.dataLogging.enabled) {
          // readingLog.readings[sensor] = {
          //   sensor: sensor,
          //   reading: reading,
          //   severity: LogSeverity.INFO,
          // };
          if (reading != null && typeof reading === 'number') {
            if (!this.readingBuffer[sensor]) {
              this.readingBuffer[sensor] = [];
            }
            this.readingBuffer[sensor].push(reading);
          }
        }
      }
    }

    if (
      user.settings.dataLogging.enabled &&
      Object.keys(readingLog.readings).length > 0
    ) {
      await this.readingLogService.create(readingLog);
    }
  }

  @Cron('0 * * * * *') // every minute
  async summarizeReadings() {
    const summaries = {} as ReadingSummary['summaries'];
    const now = new Date();

    for (const [sensor, values] of Object.entries(this.readingBuffer)) {
      if (values && values.length > 0) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;

        const severity = this.getSeverity(sensor as SensorType, avg);

        summaries[sensor as SensorType] = {
          min,
          max,
          avg,
          severity,
        };
      }
    }
    if (Object.keys(summaries).length === 0) {
      return;
    }

    const summary = new ReadingSummary();
    summary.intervalStart = this.currentWindowStart;
    summary.intervalEnd = now;
    summary.summaries = summaries;

    await this.readingSummaryService.create(summary);

    // reset buffer and window
    this.currentWindowStart = now;
    Object.keys(this.readingBuffer).forEach(
      (key) => (this.readingBuffer[key] = []),
    );
  }

  getSeverity(sensor: SensorType, value: number): LogSeverity {
    const { sensorConfigs } = this.obdService.getConfig(true);
    const config = sensorConfigs.find((s) => s.key === sensor);
    if (!config) {
      return LogSeverity.INFO;
    }
    if (
      config.criticalRange?.min < value &&
      value < config.criticalRange?.max
    ) {
      return LogSeverity.ERROR;
    }
    if (config.warning?.min < value && value < config.warning?.max) {
      return LogSeverity.WARNING;
    }
    return LogSeverity.INFO;
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
        diagnosticLog.severity = LogSeverity.ERROR;
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
        diagnosticLog.severity = LogSeverity.ERROR;
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
