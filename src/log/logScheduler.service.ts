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
import { Event } from 'src/obd/entities/enums/event.enum';

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
  private isEngineRunning = false;
  private lastFuelLowEvent: number | undefined;
  private lastFuelCriticalEvent: number | undefined;
  private lastBatteryLowEvent: number | undefined;
  private lastBatteryCriticalEvent: number | undefined;
  private lastEngineOverheatEvent: number | undefined;
  private lastOilTempEvent: number | undefined;
  private lastHighSpeedEvent: number | undefined;
  private lastMaintenanceEvent: number | undefined;
  private lastServiceEvent: number | undefined;

  @Cron('*/60 * * * * *')
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
          if (reading != null && typeof reading === 'number') {
            if (!this.readingBuffer[sensor]) {
              this.readingBuffer[sensor] = [];
            }
            this.readingBuffer[sensor].push(reading);
          }
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
        const description = this.getDescription(sensor as SensorType, avg);

        summaries[sensor as SensorType] = {
          min,
          max,
          avg,
          severity,
          description,
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

  getDescription(sensor: SensorType, value: number): string {
    const { sensorConfigs } = this.obdService.getConfig(true);
    const config = sensorConfigs.find((s) => s.key === sensor);
    if (!config) {
      return '';
    }
    if (
      config.criticalRange?.min < value &&
      value < config.criticalRange?.max
    ) {
      return `${config.title} is in critical range`;
    }
    if (config.warning?.min < value && value < config.warning?.max) {
      return `${config.title} is in warning range`;
    }
    return `${config.title} is within normal range`;
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

  @Cron('*/120 * * * * *')
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
        diagnosticLog.severity = LogSeverity.WARNING;
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

  @Cron('0 */5 * * * *') // every 5 minutes
  async simulateVehicleEvents() {
    if (!(await this.authService.isUserLoggedIn())) {
      return;
    }
    const user = await this.authService.getUserProfile();
    if (!user.settings.dataLogging.enabled) {
      return;
    }

    const readings = this.obdService.getCurrentData();
    const { sensorConfigs } = this.obdService.getConfig(
      user.settings.units === 'imperial',
    );

    // Simulate engine start/stop events based on RPM
    const engineRpm = readings['ENGINE_RPM'];
    if (engineRpm && typeof engineRpm === 'number') {
      if (engineRpm > 0 && !this.isEngineRunning) {
        // Engine started
        await this.eventLogService.create(
          Event.ENGINE_START,
          LogSeverity.INFO,
          'Engine started',
          `Engine started at ${new Date().toLocaleTimeString()}`,
        );
        this.isEngineRunning = true;
      } else if (engineRpm === 0 && this.isEngineRunning) {
        // Engine stopped
        await this.eventLogService.create(
          Event.ENGINE_STOP,
          LogSeverity.INFO,
          'Engine stopped',
          `Engine stopped at ${new Date().toLocaleTimeString()}`,
        );
        this.isEngineRunning = false;
      }
    }

    // Simulate fuel level events
    const fuelLevel = readings['FUEL_TANK_LEVEL_INPUT'];
    if (fuelLevel && typeof fuelLevel === 'number') {
      const fuelConfig = sensorConfigs.find(
        (s) => s.key === 'FUEL_TANK_LEVEL_INPUT',
      );
      if (fuelConfig?.criticalRange) {
        if (fuelLevel <= fuelConfig.criticalRange.max && fuelLevel > 5) {
          if (
            !this.lastFuelLowEvent ||
            Date.now() - this.lastFuelLowEvent > 30 * 60 * 1000
          ) {
            // 30 min cooldown
            await this.eventLogService.create(
              Event.FUEL_LEVEL_LOW,
              LogSeverity.WARNING,
              'Fuel level is low',
              `Fuel level is low: ${fuelLevel}%`,
            );
            this.lastFuelLowEvent = Date.now();
          }
        } else if (fuelLevel <= 5) {
          if (
            !this.lastFuelCriticalEvent ||
            Date.now() - this.lastFuelCriticalEvent > 10 * 60 * 1000
          ) {
            // 10 min cooldown
            await this.eventLogService.create(
              Event.FUEL_LEVEL_CRITICAL,
              LogSeverity.ERROR,
              'Fuel level is critical',
              `Fuel level is critical: ${fuelLevel}%`,
            );
            this.lastFuelCriticalEvent = Date.now();
          }
        }
      }
    }

    // Simulate battery voltage events
    const batteryVoltage = readings['CONTROL_MODULE_VOLTAGE'];
    if (batteryVoltage && typeof batteryVoltage === 'number') {
      const batteryConfig = sensorConfigs.find(
        (s) => s.key === 'CONTROL_MODULE_VOLTAGE',
      );
      if (batteryConfig?.criticalRange) {
        if (batteryVoltage < 12.0 && batteryVoltage >= 11.5) {
          if (
            !this.lastBatteryLowEvent ||
            Date.now() - this.lastBatteryLowEvent > 15 * 60 * 1000
          ) {
            // 15 min cooldown
            await this.eventLogService.create(
              Event.BATTERY_VOLTAGE_LOW,
              LogSeverity.WARNING,
              'Battery voltage is low',
              `Battery voltage is low: ${batteryVoltage}V`,
            );
            this.lastBatteryLowEvent = Date.now();
          }
        } else if (batteryVoltage < 11.5) {
          if (
            !this.lastBatteryCriticalEvent ||
            Date.now() - this.lastBatteryCriticalEvent > 5 * 60 * 1000
          ) {
            // 5 min cooldown
            await this.eventLogService.create(
              Event.BATTERY_VOLTAGE_CRITICAL,
              LogSeverity.ERROR,
              'Battery voltage is critical',
              `Battery voltage is critical: ${batteryVoltage}V`,
            );
            this.lastBatteryCriticalEvent = Date.now();
          }
        }
      }
    }

    // Simulate engine temperature events
    const coolantTemp = readings['ENGINE_COOLANT_TEMPERATURE'];
    if (coolantTemp && typeof coolantTemp === 'number') {
      const coolantConfig = sensorConfigs.find(
        (s) => s.key === 'ENGINE_COOLANT_TEMPERATURE',
      );
      if (
        coolantConfig?.criticalRange &&
        coolantTemp >= coolantConfig.criticalRange.min
      ) {
        if (
          !this.lastEngineOverheatEvent ||
          Date.now() - this.lastEngineOverheatEvent > 5 * 60 * 1000
        ) {
          // 5 min cooldown
          await this.eventLogService.create(
            Event.ENGINE_OVERHEAT,
            LogSeverity.ERROR,
            'Engine coolant temperature is high',
            `Engine coolant temperature is high: ${coolantTemp}°C`,
          );
          this.lastEngineOverheatEvent = Date.now();
        }
      }
    }

    // Simulate oil temperature events
    const oilTemp = readings['ENGINE_OIL_TEMP'];
    if (oilTemp && typeof oilTemp === 'number') {
      const oilConfig = sensorConfigs.find((s) => s.key === 'ENGINE_OIL_TEMP');
      if (oilConfig?.criticalRange && oilTemp >= oilConfig.criticalRange.min) {
        if (
          !this.lastOilTempEvent ||
          Date.now() - this.lastOilTempEvent > 10 * 60 * 1000
        ) {
          // 10 min cooldown
          await this.eventLogService.create(
            Event.OIL_TEMPERATURE_HIGH,
            LogSeverity.WARNING,
            'Engine oil temperature is high',
            `Engine oil temperature is high: ${oilTemp}°C`,
          );
          this.lastOilTempEvent = Date.now();
        }
      }
    }

    // Simulate speed events
    const vehicleSpeed = readings['VEHICLE_SPEED'];
    if (vehicleSpeed && typeof vehicleSpeed === 'number') {
      if (vehicleSpeed > 120) {
        // High speed threshold
        if (
          !this.lastHighSpeedEvent ||
          Date.now() - this.lastHighSpeedEvent > 2 * 60 * 1000
        ) {
          // 2 min cooldown
          await this.eventLogService.create(
            Event.HIGH_SPEED_DETECTED,
            LogSeverity.WARNING,
            'High speed detected',
            `High speed detected: ${vehicleSpeed} km/h`,
          );
          this.lastHighSpeedEvent = Date.now();
        }
      }
    }

    // Simulate maintenance events (random occurrence)
    if (Math.random() < 0.001) {
      // 0.1% chance every 5 minutes
      if (
        !this.lastMaintenanceEvent ||
        Date.now() - this.lastMaintenanceEvent > 24 * 60 * 60 * 1000
      ) {
        // 24 hour cooldown
        await this.eventLogService.create(
          Event.MAINTENANCE_DUE,
          LogSeverity.INFO,
          'Maintenance due soon',
          'Vehicle maintenance is due soon',
        );
        this.lastMaintenanceEvent = Date.now();
      }
    }

    // Simulate service required events (random occurrence)
    if (Math.random() < 0.0005) {
      // 0.05% chance every 5 minutes
      if (
        !this.lastServiceEvent ||
        Date.now() - this.lastServiceEvent > 12 * 60 * 60 * 1000
      ) {
        // 12 hour cooldown
        await this.eventLogService.create(
          Event.SERVICE_REQUIRED,
          LogSeverity.WARNING,
          'Service required',
          'Vehicle service is required',
        );
        this.lastServiceEvent = Date.now();
      }
    }
  }
}
