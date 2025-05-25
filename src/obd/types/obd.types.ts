import { obdCurrentDataPid } from '../entities/enums/obdCurrentDataPid.enum';

export type ObdCurrentData = Partial<
  Record<obdCurrentDataPid, number | string | null>
>;

export type DTC = {
  code: string;
  description: string;
};
