import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReadingLogService } from './readingLog.service';
import { AccessTokenGuard } from 'src/auth/accessToken.guard';

@Controller('log/reading')
@UseGuards(AccessTokenGuard)
export class ReadingLogController {
  constructor(private readonly readingLogService: ReadingLogService) {}

  @Get()
  async getAll() {
    return this.readingLogService.getAll();
  }
}
