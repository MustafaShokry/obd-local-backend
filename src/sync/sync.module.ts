import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { LogModule } from 'src/log/log.module';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
@Module({
  imports: [LogModule, AuthModule, NotificationsModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
