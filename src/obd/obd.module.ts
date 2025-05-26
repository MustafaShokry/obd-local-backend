import { Module } from '@nestjs/common';
import { ObdService } from './obd.service';
import { ObdController } from './obd.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleProfile } from './entities/vehicleProfile.entity';
import { ObdReaderService } from './obd-reader.service';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleProfile])],
  controllers: [ObdController],
  providers: [ObdService, ObdReaderService],
  exports: [ObdService],
})
export class ObdModule {}
