import { Controller, Get, UseGuards } from '@nestjs/common';
import { DiagnosticLogService } from './diagnosticLog.service';
import { AccessTokenGuard } from 'src/auth/accessToken.guard';

@Controller('log/diagnostic')
@UseGuards(AccessTokenGuard)
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
