import { Module } from '@nestjs/common';
import { ObdService } from './obd.service';
import { ObdController } from './obd.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleProfile } from './entities/vehicleProfile.entity';
import { ObdReaderService } from './obd-reader.service';
import { EventLog } from './entities/eventLog.entity';
import { ReadingLog } from './entities/readingLog .entity';
import { DiagnosticLog } from './entities/diagnosticLog.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VehicleProfile,
      ReadingLog,
      DiagnosticLog,
      EventLog,
    ]),
  ],
  controllers: [ObdController],
  providers: [ObdService, ObdReaderService],
})
export class ObdModule {}
