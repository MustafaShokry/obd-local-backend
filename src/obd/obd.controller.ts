import { Controller, Get } from '@nestjs/common';
import { ObdService } from './obd.service';
import { DTC } from './types/obd.types';

@Controller('obd')
export class ObdController {
  constructor(private readonly obdService: ObdService) {}

  @Get('live')
  getCurrentData() {
    return this.obdService.getCurrentData();
  }

  @Get('profile')
  getVehicleProfile() {
    return this.obdService.getVehicleProfile();
  }

  @Get('active-faults')
  getActiveFaults(): DTC[] {
    return this.obdService.getActiveDTCs();
  }

  @Get('pending-faults')
  getPendingFaults(): DTC[] {
    return this.obdService.getPendingDTCs();
  }

  @Get('clear-faults')
  clearFaults(): { success: boolean } {
    return this.obdService.clearFaults();
  }
}
