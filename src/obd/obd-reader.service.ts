import { Injectable } from '@nestjs/common';
import { obdCurrentDataPid } from './entities/enums/obdCurrentDataPid.enum';
import { ObdProtocol } from './entities/enums/obdProtocol.enum';
import { DTC, ObdCurrentData } from './types/obd.types';

@Injectable()
export class ObdReaderService {
  getSupportedPIDs(): obdCurrentDataPid[] {
    // TODO: get supported PIDs from the C program
    return [obdCurrentDataPid.ENGINE_RPM, obdCurrentDataPid.VEHICLE_SPEED];
  }

  getSupportedProtocols(): ObdProtocol[] {
    // TODO: get supported protocols from the C program
    return [ObdProtocol.ISO9141_2, ObdProtocol.ISO14230_4_KWP];
  }

  getVehicleInfo(): {
    vin: string;
    protocol: ObdProtocol;
    make?: string;
    model?: string;
    year?: number;
    supported_PIDs: obdCurrentDataPid[];
  } {
    // TODO: get vehicle info from the C program
    return {
      vin: '1234567890',
      protocol: ObdProtocol.ISO9141_2,
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      supported_PIDs: this.getSupportedPIDs(),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getCurrentData(supportedPIDs: obdCurrentDataPid[]): ObdCurrentData {
    // TODO: get current data from the C program
    return {
      [obdCurrentDataPid.ENGINE_RPM]: 1000,
      [obdCurrentDataPid.VEHICLE_SPEED]: 60,
    };
  }

  getActiveDTCs(): DTC[] {
    // TODO: get active DTCs from the C program
    return [
      {
        code: 'P0100',
        description: 'OBD-II DTC',
      },
    ];
  }

  getPendingDTCs(): DTC[] {
    // TODO: get pending DTCs from the C program
    return [
      {
        code: 'P0100',
        description: 'OBD-II DTC',
      },
    ];
  }

  clearFaults(): { success: boolean } {
    // TODO: clear DTCs from the C program
    return { success: true };
  }
}
