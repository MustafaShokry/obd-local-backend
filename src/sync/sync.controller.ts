import { Controller, Get, Patch, Body, UseGuards, Query } from '@nestjs/common';
import { SyncService } from './sync.service';
import { MarkSyncedDto } from './dto/mark-synced.dto';
import { SyncResponseDto } from './dto/sync-response.dto';
import { AccessTokenGuard } from 'src/auth/accessToken.guard';

@Controller('sync')
@UseGuards(AccessTokenGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get()
  getSyncPayload(@Query('limit') limit?: string): Promise<SyncResponseDto> {
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    return this.syncService.getSyncPayload(limitNumber);
  }

  @Patch('mark-synced')
  markAsSynced(@Body() body: MarkSyncedDto): Promise<{ success: boolean }> {
    return this.syncService.markAllAsSynced(body);
  }
}
