import { Injectable } from '@nestjs/common';
import { ObdService } from 'src/obd/obd.service';
import { ReadingLogService } from './readingLog.service';
import { EventLogService } from './eventLog.service';
import { DiagnosticLogService } from './diagnosticLog.service';
import { Cron } from '@nestjs/schedule';
import { ReadingLog } from './entities/readingLog.entity';
import { obdCurrentDataPid } from 'src/obd/entities/enums/obdCurrentDataPid.enum';
import { DiagnosticLog } from './entities/diagnosticLog.entity';

@Injectable()
export class ObdSchedulerService {
  constructor(
    private readonly obdService: ObdService,
    private readonly readingLogService: ReadingLogService,
    private readonly diagnosticLogService: DiagnosticLogService,
    private readonly eventLogService: EventLogService,
  ) {}

  @Cron('*/10 * * * * *')
  async collectReadingLogs() {
    const readings = this.obdService.getCurrentDataRaw();
    const readingLog = new ReadingLog();

    // Map OBD readings to ReadingLog fields
    readingLog.engineRpm = readings[obdCurrentDataPid.ENGINE_RPM] as number;
    readingLog.vehicleSpeed = readings[
      obdCurrentDataPid.VEHICLE_SPEED
    ] as number;
    readingLog.coolantTemp = readings[
      obdCurrentDataPid.ENGINE_COOLANT_TEMPERATURE
    ] as number;
    readingLog.fuelLevel = readings[
      obdCurrentDataPid.FUEL_TANK_LEVEL_INPUT
    ] as number;
    // readingLog.batteryVoltage = readings[
    //   obdCurrentDataPid.CONTROL_MODULE_VOLTAGE
    // ] as number;
    readingLog.intakeAirTemp = readings[
      obdCurrentDataPid.INTAKE_AIR_TEMPERATURE
    ] as number;
    readingLog.throttlePosition = readings[
      obdCurrentDataPid.THROTTLE_POSITION
    ] as number;

    await this.readingLogService.create(readingLog);
  }

  @Cron('*/90 * * * * *')
  async collectDiagnosticLogs() {
    const activeDTCs = this.obdService.getActiveDTCs();
    const pendingDTCs = this.obdService.getPendingDTCs();
    const diagnosticLog = new DiagnosticLog();
    diagnosticLog.activeDTCs = activeDTCs.map((dtc) => dtc.code);
    diagnosticLog.pendingDTCs = pendingDTCs.map((dtc) => dtc.code);
    await this.diagnosticLogService.create(diagnosticLog);
  }
}
