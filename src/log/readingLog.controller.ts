import { Controller, Get } from '@nestjs/common';
import { ReadingLogService } from './readingLog.service';

@Controller('log/reading')
export class ReadingLogController {
  constructor(private readonly readingLogService: ReadingLogService) {}

  @Get()
  async getAll() {
    return this.readingLogService.getAll();
  }
}
