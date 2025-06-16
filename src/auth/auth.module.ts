import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { KeyService } from './key.service';
import { ConfigModule } from '@nestjs/config';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObdModule } from 'src/obd/obd.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User]),
    forwardRef(() => ObdModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, KeyService],
  exports: [AuthService, KeyService],
})
export class AuthModule {}
