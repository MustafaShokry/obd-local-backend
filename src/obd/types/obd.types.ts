import { obdCurrentDataPid } from '../entities/enums/obdCurrentDataPid.enum';

export type ObdCurrentData = Partial<
  Record<obdCurrentDataPid, number | string | null>
>;

export type DTC = {
  code: string;
  description: string;
};

export enum SensorType {
  CALCULATED_ENGINE_LOAD = 'CALCULATED_ENGINE_LOAD',
  ENGINE_COOLANT_TEMPERATURE = 'ENGINE_COOLANT_TEMPERATURE',
  FUEL_PRESSURE = 'FUEL_PRESSURE',
  ENGINE_RPM = 'ENGINE_RPM',
  VEHICLE_SPEED = 'VEHICLE_SPEED',
  INTAKE_AIR_TEMPERATURE = 'INTAKE_AIR_TEMPERATURE',
  FUEL_TANK_LEVEL_INPUT = 'FUEL_TANK_LEVEL_INPUT',
  CONTROL_MODULE_VOLTAGE = 'CONTROL_MODULE_VOLTAGE',
}
