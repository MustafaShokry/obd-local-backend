import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { LlmController } from './llm.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSession } from './entities/ChatSession.entity';
import { ChatMessage } from './entities/ChatMessage.entity';
import { SpeechModule } from 'src/speech/speech.module';
import { ObdModule } from 'src/obd/obd.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatMessage]),
    SpeechModule,
    ObdModule,
    AuthModule,
  ],
  controllers: [LlmController],
  providers: [LlmService],
})
export class LlmModule {}
