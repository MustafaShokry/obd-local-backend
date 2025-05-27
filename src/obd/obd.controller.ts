import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ObdService } from './obd.service';
import { DTC } from './types/obd.types';
import { AccessTokenGuard } from 'src/auth/accessToken.guard';

@Controller('obd')
@UseGuards(AccessTokenGuard)
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

  @Post('clear-faults')
  clearFaults(): { success: boolean } {
    return this.obdService.clearFaults();
  }
}
