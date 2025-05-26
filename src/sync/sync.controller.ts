import { Controller, Get, Post, Body } from '@nestjs/common';
import { SyncService } from './sync.service';
import { MarkSyncedDto } from './dto/mark-synced.dto';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get()
  getSyncPayload() {
    return this.syncService.getSyncPayload();
  }

  @Post('mark-synced')
  markAsSynced(@Body() body: MarkSyncedDto) {
    return this.syncService.markAllAsSynced(body);
  }
}
