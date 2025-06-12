export enum LogSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum LogType {
  READINGS = 'readings',
  DIAGNOSTIC = 'diagnostic',
  EVENTS = 'events',
}

export enum DiagnosticStatus {
  ACTIVE = 'active',
  CLEARED = 'cleared',
  PENDING = 'pending',
}
