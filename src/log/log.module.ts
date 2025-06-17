import { Module } from '@nestjs/common';
import { ReadingLogService } from './readingLog.service';
import { ReadingLogController } from './readingLog.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObdModule } from '../obd/obd.module';
import { EventLog } from './entities/eventLog.entity';
import { ReadingLog } from './entities/readingLog.entity';
import { DiagnosticLog } from './entities/diagnosticLog.entity';
import { DiagnosticLogService } from './diagnosticLog.service';
import { DiagnosticLogController } from './diagnosticLog.controller';
import { EventLogService } from './eventLog.service';
import { EventLogController } from './eventLog.controller';
import { ObdSchedulerService } from './logScheduler.service';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ReadingSummary } from './entities/readingSummary.entity';
import { ReadingSummaryService } from './readingSummary.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReadingLog,
      DiagnosticLog,
      EventLog,
      ReadingSummary,
    ]),
    ObdModule,
    AuthModule,
    NotificationsModule,
  ],
  controllers: [
    ReadingLogController,
    DiagnosticLogController,
    EventLogController,
  ],
  providers: [
    ReadingLogService,
    DiagnosticLogService,
    EventLogService,
    ObdSchedulerService,
    ReadingSummaryService,
  ],
  exports: [
    ReadingLogService,
    DiagnosticLogService,
    EventLogService,
    ReadingSummaryService,
  ],
})
export class LogModule {}
