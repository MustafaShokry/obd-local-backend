import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { LogModule } from 'src/log/log.module';

@Module({
  imports: [LogModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
