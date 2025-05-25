import { Injectable, OnModuleInit } from '@nestjs/common';
import { ObdReaderService } from './obd-reader.service';
import { VehicleProfile } from './entities/vehicleProfile.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ObdCurrentData } from './types/obd.types';
import { obdCurrentDataPid } from './entities/enums/obdCurrentDataPid.enum';
import { DTC } from './types/obd.types';

@Injectable()
export class ObdService implements OnModuleInit {
  private vehicleProfile: VehicleProfile;
  constructor(
    private readonly obdReaderService: ObdReaderService,
    @InjectRepository(VehicleProfile)
    private readonly vehicleProfileRepository: Repository<VehicleProfile>,
  ) {}

  async onModuleInit() {
    await this.initializeVehicleProfile();
  }

  private async initializeVehicleProfile() {
    const vehicleProfile = await this.vehicleProfileRepository.find();
    if (vehicleProfile.length === 0) {
      const vehicleInfo = this.obdReaderService.getVehicleInfo();
      const newVehicleProfile = this.vehicleProfileRepository.create({
        ...vehicleInfo,
        created_at: new Date(),
        updated_at: new Date(),
      });
      await this.vehicleProfileRepository.save(newVehicleProfile);
      this.vehicleProfile = newVehicleProfile;
    } else {
      this.vehicleProfile = vehicleProfile[0];
    }
  }

  getVehicleProfile(): VehicleProfile {
    return this.vehicleProfile;
  }

  getCurrentData(): ObdCurrentData {
    const supportedPIDs = this.vehicleProfile.supported_PIDs;
    const currentData = this.obdReaderService.getCurrentData(supportedPIDs);
    const mappedCurrentData = Object.fromEntries(
      Object.entries(currentData).map(([key, value]) => [
        this.mapObdPidToName(key as unknown as obdCurrentDataPid),
        value,
      ]),
    );
    return mappedCurrentData;
  }

  mapObdPidToName(pid: obdCurrentDataPid): string {
    return obdCurrentDataPid[pid];
  }

  getActiveDTCs(): DTC[] {
    return this.obdReaderService.getActiveDTCs();
  }

  getPendingDTCs(): DTC[] {
    return this.obdReaderService.getPendingDTCs();
  }

  clearFaults(): { success: boolean } {
    return this.obdReaderService.clearFaults();
  }
}
