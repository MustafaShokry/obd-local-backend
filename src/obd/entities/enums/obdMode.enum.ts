export enum ObdMode {
  CURRENT_DATA = 0x01, // Real-time/live data
  FREEZE_FRAME_DATA = 0x02, // Data snapshot when DTC was set
  DIAGNOSTIC_TROUBLE_CODES = 0x03, // Request stored (active) DTCs
  CLEAR_TROUBLE_CODES = 0x04, // Clear/reset DTCs and MIL
  OXYGEN_SENSOR_TEST_RESULTS = 0x05, // Test results (oxygen sensors)
  ON_BOARD_MONITOR_TESTS = 0x06, // On-board monitoring
  PENDING_TROUBLE_CODES = 0x07, // Request pending DTCs
  CONTROL_ON_BOARD_SYSTEM = 0x08, // Control of vehicle systems (rarely used)
  VEHICLE_INFO = 0x09, // VIN, ECU info, calibration IDs, etc.
  PERMANENT_DTC = 0x0a, // Permanent trouble codes
}
