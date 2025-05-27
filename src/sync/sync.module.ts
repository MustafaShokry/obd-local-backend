import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { LogModule } from 'src/log/log.module';
import { AuthModule } from 'src/auth/auth.module';
@Module({
  imports: [LogModule, AuthModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
