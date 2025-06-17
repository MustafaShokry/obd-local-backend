import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReadingLogService } from './readingLog.service';
import { AccessTokenGuard } from 'src/auth/accessToken.guard';
import { ReadingSummaryService } from './readingSummary.service';

@Controller('log/reading')
@UseGuards(AccessTokenGuard)
export class ReadingLogController {
  constructor(
    private readonly readingLogService: ReadingLogService,
    private readonly readingSummaryService: ReadingSummaryService,
  ) {}

  @Get()
  async getAll() {
    return this.readingLogService.getAll();
  }
  @Get('summaries')
  async getSummaries(@Query('from') from: string, @Query('to') to: string) {
    return this.readingSummaryService.getSummaries(
      new Date(from),
      new Date(to),
    );
  }
}
