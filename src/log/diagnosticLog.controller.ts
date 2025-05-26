import { Controller, Get } from '@nestjs/common';
import { DiagnosticLogService } from './diagnosticLog.service';

@Controller('log/diagnostic')
export class DiagnosticLogController {
  constructor(private readonly diagnosticLogService: DiagnosticLogService) {}

  @Get()
  async getAll() {
    return this.diagnosticLogService.getAll();
  }

  @Get('latest')
  async getLatest() {
    return this.diagnosticLogService.getLatest();
  }
}
