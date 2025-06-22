import { Injectable, OnModuleInit } from '@nestjs/common';
import { ObdReaderService } from './obd-reader.service';
import { VehicleProfile } from './entities/vehicleProfile.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ObdCurrentData } from './types/obd.types';
import { obdCurrentDataPid } from './entities/enums/obdCurrentDataPid.enum';
import { DTC } from './types/obd.types';
import {
  sensorConfig,
  categoryConfig,
  SensorConfig,
  CategoryConfig,
  SensorConfigWithUnit,
} from './config/sensors.config';

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

  async updateVehicleProfile(vehicleProfile: Partial<VehicleProfile>) {
    await this.vehicleProfileRepository.update(
      { id: this.vehicleProfile.id },
      vehicleProfile,
    );
    this.vehicleProfile = {
      ...this.vehicleProfile,
      ...vehicleProfile,
    } as VehicleProfile;
  }

  getCurrentData(): ObdCurrentData {
    const supportedPIDs = this.vehicleProfile.supportedSensors.map(
      (sensor) => obdCurrentDataPid[sensor as unknown as obdCurrentDataPid],
    ) as unknown as obdCurrentDataPid[];
    const currentData = this.obdReaderService.getCurrentData(supportedPIDs);
    const mappedCurrentData = Object.fromEntries(
      Object.entries(currentData).map(([key, value]) => [
        this.mapObdPidToName(key as unknown as obdCurrentDataPid),
        value,
      ]),
    );
    return mappedCurrentData;
  }
  getCurrentDataRaw(): ObdCurrentData {
    const supportedPIDs = this.vehicleProfile.supportedSensors.map(
      (sensor) => obdCurrentDataPid[sensor as unknown as obdCurrentDataPid],
    ) as unknown as obdCurrentDataPid[];
    const currentData = this.obdReaderService.getCurrentData(supportedPIDs);
    return currentData;
  }

  getConfig(useImperial = false): {
    sensorConfigs: SensorConfigWithUnit[];
    categoryConfigs: CategoryConfig[];
  } {
    const sensorConfigs = Object.entries(sensorConfig).map(
      ([key, sensor]: [string, SensorConfig]) => {
        return {
          key,
          ...sensor,
          unit: useImperial ? sensor.unit.imperial : sensor.unit.metric,
          max: useImperial ? sensor.max.imperial : sensor.max.metric,
          min: useImperial ? sensor.min.imperial : sensor.min.metric,
          warning: useImperial
            ? sensor?.warning?.imperial
            : sensor?.warning?.metric,
          optimal: useImperial
            ? sensor?.optimal?.imperial
            : sensor?.optimal?.metric,
          criticalRange: useImperial
            ? sensor.criticalRange.imperial
            : sensor.criticalRange.metric,
        };
      },
    );

    const categoryConfigs = Object.entries(categoryConfig).map(
      ([key, category]: [string, CategoryConfig]) => ({
        key,
        ...category,
      }),
    );
    return {
      sensorConfigs,
      categoryConfigs,
    };
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

  async unlink(): Promise<{ message: string }> {
    await this.vehicleProfileRepository.delete(this.vehicleProfile.id);
    return { message: 'Vehicle profile unlinked' };
  }
}
