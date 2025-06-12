export type SensorConfig = {
  title: string;
  unit: { metric: string; imperial: string };
  max: { metric: number; imperial: number };
  min: { metric: number; imperial: number };
  warning: {
    metric: { min: number; max: number };
    imperial: { min: number; max: number };
  };
  optimal: {
    metric: { min: number; max: number };
    imperial: { min: number; max: number };
  };
  criticalRange: {
    metric: { min: number; max: number };
    imperial: { min: number; max: number };
  };
  category: string;
  displayType: string;
  critical: boolean;
  conversion?: (value: number, toImperial: boolean) => number;
};
export type SensorConfigWithUnit = {
  key: string;
  title: string;
  unit: string;
  max: number;
  min: number;
  warning: { min: number; max: number };
  optimal: { min: number; max: number };
  criticalRange: { min: number; max: number };
  category: string;
  displayType: string;
  critical: boolean;
  conversion?: (value: number, toImperial: boolean) => number;
};

export type CategoryConfig = {
  title: string;
  order: number;
};

export const sensorConfig = {
  ENGINE_RPM: {
    title: 'Engine RPM',
    unit: { metric: 'RPM', imperial: 'RPM' },
    max: { metric: 8000, imperial: 8000 },
    min: { metric: 0, imperial: 0 },
    warning: { metric: { min: 0, max: 6500 }, imperial: { min: 0, max: 6500 } },
    criticalRange: {
      metric: { min: 0, max: 7500 },
      imperial: { min: 0, max: 7500 },
    },
    category: 'performance',
    displayType: 'gauge',
    critical: true,
  },
  VEHICLE_SPEED: {
    title: 'Vehicle Speed',
    unit: { metric: 'km/h', imperial: 'mph' },
    max: { metric: 200, imperial: 124 },
    min: { metric: 0, imperial: 0 },
    criticalRange: {
      metric: { min: 0, max: 200 },
      imperial: { min: 0, max: 124 },
    },
    category: 'performance',
    displayType: 'gauge',
    critical: true,
    conversion: (value, toImperial) =>
      toImperial ? value * 0.621371 : value / 0.621371,
  },
  FUEL_TANK_LEVEL_INPUT: {
    title: 'Fuel Level',
    unit: { metric: '%', imperial: '%' },
    max: { metric: 100, imperial: 100 },
    min: { metric: 0, imperial: 0 },
    warning: { metric: { min: 20, max: 100 }, imperial: { min: 20, max: 100 } },
    criticalRange: {
      metric: { min: 0, max: 15 },
      imperial: { min: 0, max: 15 },
    },
    category: 'resources',
    displayType: 'card',
    critical: true,
  },
  CONTROL_MODULE_VOLTAGE: {
    title: 'Battery Voltage',
    unit: { metric: 'V', imperial: 'V' },
    max: { metric: 14.5, imperial: 14.5 },
    min: { metric: 11.5, imperial: 11.5 },
    optimal: {
      metric: { min: 12.5, max: 13.8 },
      imperial: { min: 12.5, max: 13.8 },
    },
    criticalRange: {
      metric: { min: 11.5, max: 14.5 },
      imperial: { min: 11.5, max: 14.5 },
    },
    category: 'resources',
    displayType: 'card',
    critical: true,
  },
  INTAKE_AIR_TEMPERATURE: {
    title: 'Intake Air Temp',
    unit: { metric: '°C', imperial: '°F' },
    max: { metric: 60, imperial: 140 },
    min: { metric: 15, imperial: 59 },
    optimal: { metric: { min: 20, max: 40 }, imperial: { min: 68, max: 104 } },
    criticalRange: {
      metric: { min: 15, max: 60 },
      imperial: { min: 59, max: 140 },
    },
    category: 'engine',
    displayType: 'card',
    critical: false,
    conversion: (value, toImperial) =>
      toImperial ? (value * 9) / 5 + 32 : ((value - 32) * 5) / 9,
  },
  ENGINE_COOLANT_TEMPERATURE: {
    title: 'Coolant Temperature',
    unit: { metric: '°C', imperial: '°F' },
    max: { metric: 110, imperial: 230 },
    min: { metric: 75, imperial: 167 },
    warning: { metric: { min: 75, max: 95 }, imperial: { min: 167, max: 203 } },
    criticalRange: {
      metric: { min: 100, max: 110 },
      imperial: { min: 212, max: 230 },
    },
    category: 'engine',
    displayType: 'card',
    critical: true,
    conversion: (value, toImperial) =>
      toImperial ? (value * 9) / 5 + 32 : ((value - 32) * 5) / 9,
  },
  FUEL_PRESSURE: {
    title: 'Fuel Pressure',
    unit: { metric: 'bar', imperial: 'psi' },
    max: { metric: 5.5, imperial: 80 },
    min: { metric: 1.7, imperial: 25 },
    optimal: { metric: { min: 2.4, max: 4.5 }, imperial: { min: 35, max: 65 } },
    criticalRange: {
      metric: { min: 1.7, max: 5.5 },
      imperial: { min: 25, max: 80 },
    },
    category: 'engine',
    displayType: 'card',
    critical: false,
    conversion: (value, toImperial) =>
      toImperial ? value * 14.5038 : value / 14.5038,
  },
  CALCULATED_ENGINE_LOAD: {
    title: 'Engine Load',
    unit: { metric: '%', imperial: '%' },
    max: { metric: 100, imperial: 100 },
    min: { metric: 10, imperial: 10 },
    warning: { metric: { min: 80, max: 100 }, imperial: { min: 80, max: 100 } },
    criticalRange: {
      metric: { min: 10, max: 100 },
      imperial: { min: 10, max: 100 },
    },
    category: 'engine',
    displayType: 'card',
    critical: false,
  },

  // New sensors added below
  INTAKE_MANIFOLD_PRESSURE: {
    title: 'Intake Manifold Pressure',
    unit: { metric: 'kPa', imperial: 'inHg' },
    max: { metric: 105, imperial: 31 },
    min: { metric: 20, imperial: 6 },
    optimal: {
      metric: { min: 25, max: 100 },
      imperial: { min: 7.4, max: 29.5 },
    },
    warning: { metric: { min: 20, max: 25 }, imperial: { min: 6, max: 7.4 } },
    criticalRange: {
      metric: { min: 15, max: 105 },
      imperial: { min: 4.4, max: 31 },
    },
    category: 'engine',
    displayType: 'card',
    critical: false,
    conversion: (value, toImperial) =>
      toImperial ? value * 0.295 : value / 0.295,
  },
  TIMING_ADVANCE: {
    title: 'Timing Advance',
    unit: { metric: '° BTDC', imperial: '° BTDC' },
    max: { metric: 50, imperial: 50 },
    min: { metric: -10, imperial: -10 },
    optimal: { metric: { min: 5, max: 25 }, imperial: { min: 5, max: 25 } },
    warning: { metric: { min: -5, max: 35 }, imperial: { min: -5, max: 35 } },
    criticalRange: {
      metric: { min: -10, max: 50 },
      imperial: { min: -10, max: 50 },
    },
    category: 'engine',
    displayType: 'card',
    critical: false,
  },
  MAF_AIR_FLOW_RATE: {
    title: 'Mass Air Flow Rate',
    unit: { metric: 'g/s', imperial: 'lb/min' },
    max: { metric: 150, imperial: 19.8 },
    min: { metric: 2, imperial: 0.26 },
    optimal: {
      metric: { min: 5, max: 80 },
      imperial: { min: 0.66, max: 10.6 },
    },
    warning: { metric: { min: 2, max: 5 }, imperial: { min: 0.26, max: 0.66 } },
    criticalRange: {
      metric: { min: 1, max: 150 },
      imperial: { min: 0.13, max: 19.8 },
    },
    category: 'engine',
    displayType: 'card',
    critical: true,
    conversion: (value, toImperial) =>
      toImperial ? value * 0.132 : value / 0.132,
  },
  THROTTLE_POSITION: {
    title: 'Throttle Position',
    unit: { metric: '%', imperial: '%' },
    max: { metric: 100, imperial: 100 },
    min: { metric: 0, imperial: 0 },
    optimal: { metric: { min: 0, max: 80 }, imperial: { min: 0, max: 80 } },
    warning: { metric: { min: 90, max: 100 }, imperial: { min: 90, max: 100 } },
    criticalRange: {
      metric: { min: 0, max: 100 },
      imperial: { min: 0, max: 100 },
    },
    category: 'performance',
    displayType: 'card',
    critical: false,
  },
  RUN_TIME_SINCE_ENGINE_START: {
    title: 'Engine Run Time',
    unit: { metric: 'min', imperial: 'min' },
    max: { metric: 9999, imperial: 9999 },
    min: { metric: 0, imperial: 0 },
    criticalRange: {
      metric: { min: 0, max: 9999 },
      imperial: { min: 0, max: 9999 },
    },
    category: 'diagnostics',
    displayType: 'card',
    critical: false,
  },
  BAROMETRIC_PRESSURE: {
    title: 'Barometric Pressure',
    unit: { metric: 'kPa', imperial: 'inHg' },
    max: { metric: 105, imperial: 31 },
    min: { metric: 85, imperial: 25 },
    optimal: {
      metric: { min: 98, max: 102 },
      imperial: { min: 29, max: 30.1 },
    },
    warning: {
      metric: { min: 90, max: 105 },
      imperial: { min: 26.6, max: 31 },
    },
    criticalRange: {
      metric: { min: 85, max: 105 },
      imperial: { min: 25, max: 31 },
    },
    category: 'environment',
    displayType: 'card',
    critical: false,
    conversion: (value, toImperial) =>
      toImperial ? value * 0.295 : value / 0.295,
  },
  AMBIENT_AIR_TEMPERATURE: {
    title: 'Ambient Air Temperature',
    unit: { metric: '°C', imperial: '°F' },
    max: { metric: 50, imperial: 122 },
    min: { metric: -40, imperial: -40 },
    optimal: { metric: { min: 15, max: 25 }, imperial: { min: 59, max: 77 } },
    warning: { metric: { min: -20, max: 40 }, imperial: { min: -4, max: 104 } },
    criticalRange: {
      metric: { min: -40, max: 50 },
      imperial: { min: -40, max: 122 },
    },
    category: 'environment',
    displayType: 'card',
    critical: false,
    conversion: (value, toImperial) =>
      toImperial ? (value * 9) / 5 + 32 : ((value - 32) * 5) / 9,
  },
  ENGINE_OIL_TEMP: {
    title: 'Engine Oil Temperature',
    unit: { metric: '°C', imperial: '°F' },
    max: { metric: 150, imperial: 302 },
    min: { metric: 60, imperial: 140 },
    optimal: {
      metric: { min: 90, max: 120 },
      imperial: { min: 194, max: 248 },
    },
    warning: {
      metric: { min: 120, max: 140 },
      imperial: { min: 248, max: 284 },
    },
    criticalRange: {
      metric: { min: 140, max: 150 },
      imperial: { min: 284, max: 302 },
    },
    category: 'engine',
    displayType: 'card',
    critical: true,
    conversion: (value, toImperial) =>
      toImperial ? (value * 9) / 5 + 32 : ((value - 32) * 5) / 9,
  },
  DISTANCE_TRAVELED_SINCE_CODES_CLEARED: {
    title: 'Distance Since Codes Cleared',
    unit: { metric: 'km', imperial: 'miles' },
    max: { metric: 9999, imperial: 6213 },
    min: { metric: 0, imperial: 0 },
    criticalRange: {
      metric: { min: 0, max: 9999 },
      imperial: { min: 0, max: 6213 },
    },
    category: 'diagnostics',
    displayType: 'card',
    critical: false,
    conversion: (value, toImperial) =>
      toImperial ? value * 0.621371 : value / 0.621371,
  },
};

export const categoryConfig = {
  performance: {
    title: 'Performance Metrics',
    order: 1,
  },
  engine: {
    title: 'Engine Systems',
    order: 2,
  },
  resources: {
    title: 'Vehicle Resources and Consumption',
    order: 3,
  },
  //   electrical: {
  //     title: 'Electrical Systems',
  //     order: 4,
  //   },
  environment: {
    title: 'Environmental Conditions',
    order: 4,
  },
  diagnostics: {
    title: 'Diagnostic Information',
    order: 5,
  },
};

// // Utility functions for unit conversion and value formatting
// export const unitUtils = {
//   convertValue: (sensorKey, value, useImperial = false) => {
//     const sensor = sensorConfig[sensorKey];
//     if (!sensor?.conversion) return value;
//     return sensor.conversion(value, useImperial);
//   },

//   getUnit: (sensorKey, useImperial = false) => {
//     const sensor = sensorConfig[sensorKey];
//     return useImperial ? sensor.unit.imperial : sensor.unit.metric;
//   },

//   getRanges: (sensorKey, useImperial = false) => {
//     const sensor = sensorConfig[sensorKey];
//     const unit = useImperial ? 'imperial' : 'metric';

//     return {
//       max: sensor.max[unit],
//       min: sensor.min[unit],
//       warning: sensor.warning?.[unit],
//       optimal: sensor.optimal?.[unit],
//       criticalRange: sensor.criticalRange[unit],
//     };
//   },

//   formatValue: (sensorKey, value, useImperial = false, decimals = 1) => {
//     const convertedValue = unitUtils.convertValue(
//       sensorKey,
//       value,
//       useImperial,
//     );
//     const unit = unitUtils.getUnit(sensorKey, useImperial);

//     // Special formatting for specific sensor types
//     if (
//       sensorKey === 'RUN_TIME_SINCE_ENGINE_START' ||
//       sensorKey === 'DISTANCE_TRAVELED_SINCE_CODES_CLEARED'
//     ) {
//       return `${Math.round(convertedValue)} ${unit}`;
//     }

//     return `${convertedValue.toFixed(decimals)} ${unit}`;
//   },
// };
