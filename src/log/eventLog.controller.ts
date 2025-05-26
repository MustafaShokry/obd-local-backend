import { Controller, Get, Param } from '@nestjs/common';
import { EventLogService } from './eventLog.service';
import { Event } from 'src/obd/entities/enums/event.enum';

@Controller('log/event')
export class EventLogController {
  constructor(private readonly eventLogService: EventLogService) {}

  @Get()
  async getAll() {
    return this.eventLogService.getAll();
  }

  @Get('type/:type')
  async getByType(@Param('type') type: Event) {
    return this.eventLogService.getByType(type);
  }
}
