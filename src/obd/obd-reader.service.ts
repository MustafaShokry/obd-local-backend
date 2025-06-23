import { Injectable } from '@nestjs/common';
import { obdCurrentDataPid } from './entities/enums/obdCurrentDataPid.enum';
import { ObdProtocol } from './entities/enums/obdProtocol.enum';
import { DTC, ObdCurrentData } from './types/obd.types';

@Injectable()
export class ObdReaderService {
  getSupportedPIDs(): obdCurrentDataPid[] {
    // TODO: get supported PIDs from the C program, don't forget to add the new PIDs
    return [
      obdCurrentDataPid.ENGINE_RPM,
      obdCurrentDataPid.VEHICLE_SPEED,
      obdCurrentDataPid.FUEL_TANK_LEVEL_INPUT,
      obdCurrentDataPid.ENGINE_COOLANT_TEMPERATURE,
      obdCurrentDataPid.INTAKE_AIR_TEMPERATURE,
      obdCurrentDataPid.CALCULATED_ENGINE_LOAD,
      obdCurrentDataPid.CONTROL_MODULE_VOLTAGE,
      obdCurrentDataPid.FUEL_PRESSURE,

      obdCurrentDataPid.INTAKE_MANIFOLD_PRESSURE,
      obdCurrentDataPid.THROTTLE_POSITION,
      obdCurrentDataPid.RUN_TIME_SINCE_ENGINE_START,
      obdCurrentDataPid.ENGINE_OIL_TEMP,
      obdCurrentDataPid.TIMING_ADVANCE,
      obdCurrentDataPid.MAF_AIR_FLOW_RATE,
      obdCurrentDataPid.AMBIENT_AIR_TEMPERATURE,
      obdCurrentDataPid.BAROMETRIC_PRESSURE,
      obdCurrentDataPid.DISTANCE_TRAVELED_SINCE_CODES_CLEARED,
    ];
  }

  getSupportedProtocols(): ObdProtocol[] {
    // TODO: get supported protocols from the C program
    return [ObdProtocol.ISO9141_2, ObdProtocol.ISO14230_4_KWP];
  }

  getVehicleInfo(): {
    vin: string;
    protocol: ObdProtocol;
    supportedSensors: string[];
  } {
    // TODO: get vehicle info from the C program
    return {
      vin: '1HGBH41JXMN109186',
      protocol: ObdProtocol.ISO15765_4_CAN,
      supportedSensors: this.getSupportedPIDs().map((pid) => {
        const key = Object.keys(obdCurrentDataPid).find(
          (key) => obdCurrentDataPid[key] === pid,
        );
        return key ? key : '';
      }),
    };
  }

  sensorData: ObdCurrentData = {
    [obdCurrentDataPid.ENGINE_RPM]: 1200,
    [obdCurrentDataPid.VEHICLE_SPEED]: 65,
    [obdCurrentDataPid.FUEL_TANK_LEVEL_INPUT]: 75,
    [obdCurrentDataPid.ENGINE_COOLANT_TEMPERATURE]: 88,
    [obdCurrentDataPid.INTAKE_AIR_TEMPERATURE]: 28,
    [obdCurrentDataPid.CALCULATED_ENGINE_LOAD]: 32,
    [obdCurrentDataPid.CONTROL_MODULE_VOLTAGE]: 12.8,
    [obdCurrentDataPid.FUEL_PRESSURE]: 45,

    [obdCurrentDataPid.INTAKE_MANIFOLD_PRESSURE]: 45,
    [obdCurrentDataPid.THROTTLE_POSITION]: 45,
    [obdCurrentDataPid.RUN_TIME_SINCE_ENGINE_START]: 45,
    [obdCurrentDataPid.ENGINE_OIL_TEMP]: 45,
    [obdCurrentDataPid.TIMING_ADVANCE]: 45,
    [obdCurrentDataPid.MAF_AIR_FLOW_RATE]: 45,
    [obdCurrentDataPid.AMBIENT_AIR_TEMPERATURE]: 45,
    [obdCurrentDataPid.BAROMETRIC_PRESSURE]: 45,
    [obdCurrentDataPid.DISTANCE_TRAVELED_SINCE_CODES_CLEARED]: 45,
  };

  // Update function (call this periodically)
  updateSensorData() {
    this.sensorData = {
      [obdCurrentDataPid.ENGINE_RPM]: Math.max(
        600,
        Math.min(
          7000,
          (this.sensorData[obdCurrentDataPid.ENGINE_RPM] as number) +
            (Math.random() - 0.5) * 150,
        ),
      ),
      [obdCurrentDataPid.VEHICLE_SPEED]: Math.max(
        0,
        Math.min(
          200,
          (this.sensorData[obdCurrentDataPid.VEHICLE_SPEED] as number) +
            (Math.random() - 0.5) * 8,
        ),
      ),
      [obdCurrentDataPid.FUEL_TANK_LEVEL_INPUT]: Math.max(
        0,
        Math.min(
          100,
          (this.sensorData[obdCurrentDataPid.FUEL_TANK_LEVEL_INPUT] as number) +
            (Math.random() - 0.5) * 0.3,
        ),
      ),
      [obdCurrentDataPid.ENGINE_COOLANT_TEMPERATURE]: Math.max(
        75,
        Math.min(
          105,
          (this.sensorData[
            obdCurrentDataPid.ENGINE_COOLANT_TEMPERATURE
          ] as number) +
            (Math.random() - 0.5) * 1.5,
        ),
      ),
      [obdCurrentDataPid.INTAKE_AIR_TEMPERATURE]: Math.max(
        15,
        Math.min(
          50,
          (this.sensorData[
            obdCurrentDataPid.INTAKE_AIR_TEMPERATURE
          ] as number) +
            (Math.random() - 0.5) * 1,
        ),
      ),
      [obdCurrentDataPid.CALCULATED_ENGINE_LOAD]: Math.max(
        10,
        Math.min(
          90,
          (this.sensorData[
            obdCurrentDataPid.CALCULATED_ENGINE_LOAD
          ] as number) +
            (Math.random() - 0.5) * 4,
        ),
      ),
      [obdCurrentDataPid.CONTROL_MODULE_VOLTAGE]: Math.max(
        11.8,
        Math.min(
          14.2,
          (this.sensorData[
            obdCurrentDataPid.CONTROL_MODULE_VOLTAGE
          ] as number) +
            (Math.random() - 0.5) * 0.08,
        ),
      ),
      [obdCurrentDataPid.FUEL_PRESSURE]: Math.max(
        25,
        Math.min(
          80,
          (this.sensorData[obdCurrentDataPid.FUEL_PRESSURE] as number) +
            (Math.random() - 0.5) * 2,
        ),
      ),
      [obdCurrentDataPid.INTAKE_MANIFOLD_PRESSURE]: Math.max(
        25,
        Math.min(
          80,
          (this.sensorData[
            obdCurrentDataPid.INTAKE_MANIFOLD_PRESSURE
          ] as number) +
            (Math.random() - 0.5) * 2,
        ),
      ),
      [obdCurrentDataPid.THROTTLE_POSITION]: Math.max(
        0,
        Math.min(
          100,
          (this.sensorData[obdCurrentDataPid.THROTTLE_POSITION] as number) +
            (Math.random() - 0.5) * 2,
        ),
      ),
      [obdCurrentDataPid.RUN_TIME_SINCE_ENGINE_START]: Math.max(
        0,
        Math.min(
          100,
          (this.sensorData[
            obdCurrentDataPid.RUN_TIME_SINCE_ENGINE_START
          ] as number) +
            (Math.random() - 0.5) * 2,
        ),
      ),
      [obdCurrentDataPid.ENGINE_OIL_TEMP]: Math.max(
        0,
        Math.min(
          100,
          (this.sensorData[obdCurrentDataPid.ENGINE_OIL_TEMP] as number) +
            (Math.random() - 0.5) * 2,
        ),
      ),
      [obdCurrentDataPid.TIMING_ADVANCE]: Math.max(
        0,
        Math.min(
          100,
          (this.sensorData[obdCurrentDataPid.TIMING_ADVANCE] as number) +
            (Math.random() - 0.5) * 2,
        ),
      ),
      [obdCurrentDataPid.MAF_AIR_FLOW_RATE]: Math.max(
        0,
        Math.min(
          100,
          (this.sensorData[obdCurrentDataPid.MAF_AIR_FLOW_RATE] as number) +
            (Math.random() - 0.5) * 2,
        ),
      ),
      [obdCurrentDataPid.AMBIENT_AIR_TEMPERATURE]: Math.max(
        0,
        Math.min(
          100,
          (this.sensorData[
            obdCurrentDataPid.AMBIENT_AIR_TEMPERATURE
          ] as number) +
            (Math.random() - 0.5) * 2,
        ),
      ),
      [obdCurrentDataPid.BAROMETRIC_PRESSURE]: Math.max(
        0,
        Math.min(
          100,
          (this.sensorData[obdCurrentDataPid.BAROMETRIC_PRESSURE] as number) +
            (Math.random() - 0.5) * 2,
        ),
      ),
      [obdCurrentDataPid.DISTANCE_TRAVELED_SINCE_CODES_CLEARED]: Math.max(
        0,
        Math.min(
          100,
          (this.sensorData[
            obdCurrentDataPid.DISTANCE_TRAVELED_SINCE_CODES_CLEARED
          ] as number) +
            (Math.random() - 0.5) * 2,
        ),
      ),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getCurrentData(supportedPIDs: obdCurrentDataPid[]): ObdCurrentData {
    this.updateSensorData();
    this.sensorData[obdCurrentDataPid.INTAKE_AIR_TEMPERATURE] = null;
    for (const key in this.sensorData) {
      if (
        this.sensorData[key] !== null &&
        typeof this.sensorData[key] === 'number'
      ) {
        this.sensorData[key] = Number(this.sensorData[key].toFixed(2));
      }
    }
    return this.sensorData;
  }

  getActiveDTCs(): DTC[] {
    // TODO: get active DTCs from the C program
    return [
      {
        code: 'P0420',
        description: 'Catalyst System Efficiency Below Threshold - Bank 1',
      },
    ];
  }

  getPendingDTCs(): DTC[] {
    // TODO: get pending DTCs from the C program
    return [
      {
        code: 'P0171',
        description: 'System Too Lean - Bank 1',
      },
    ];
  }

  clearFaults(): { success: boolean } {
    // TODO: clear DTCs from the C program
    return { success: true };
  }
}
