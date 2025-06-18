import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Patch,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { LlmService } from './llm.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { ChatSession } from './entities/ChatSession.entity';
import { ChatMessage } from './entities/ChatMessage.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { AskDto } from './dto/ask.dto';
import { AccessTokenGuard } from 'src/auth/accessToken.guard';
import { llmResponse } from './llm.types';
import { UpdateChatTitleDto } from './dto/update-chat-title.dto';

@Controller('llm')
@UseGuards(AccessTokenGuard)
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Get('chats')
  async getChats(): Promise<ChatSession[]> {
    return this.llmService.getChats();
  }

  @Post('chats')
  async createChat(@Body() createChatDto: CreateChatDto): Promise<ChatSession> {
    return this.llmService.createChat(createChatDto);
  }

  @Get('chats/:id')
  async getChat(@Param('id') id: string): Promise<ChatSession> {
    return this.llmService.getChat(id);
  }

  @Patch('chats/:id/title')
  async updateChatTitle(
    @Param('id') id: string,
    @Body() updateChatTitleDto: UpdateChatTitleDto,
  ): Promise<ChatSession> {
    return this.llmService.updateChatTitle(id, updateChatTitleDto);
  }

  @Post('chats/:id/messages')
  async createMessage(
    @Param('id') id: string,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<ChatMessage> {
    return this.llmService.createMessage(id, createMessageDto);
  }

  @Delete('chats/:id')
  async deleteChat(@Param('id') id: string): Promise<ChatSession> {
    return this.llmService.deleteChat(id);
  }

  @Get('chats/:id/messages')
  async getMessages(@Param('id') id: string): Promise<ChatMessage[]> {
    return this.llmService.getMessages(id);
  }

  @Get('chats/:id/messages/:messageId')
  async getMessage(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
  ): Promise<ChatMessage> {
    return this.llmService.getMessage(id, messageId);
  }

  @Post('chats/:id/ask')
  @UseInterceptors(
    FileInterceptor('voiceFile', {
      storage: diskStorage({
        destination: './uploads/audio',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(
            null,
            `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`,
          );
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'audio/wav',
          'audio/mpeg',
          'audio/mp3',
          'audio/mp4',
          'audio/webm',
          'audio/ogg',
          'audio/m4a',
          'audio/aac',
          'audio/flac',
          'audio/wav',
          'audio/mp3',
          'audio/mp4',
          'audio/x-m4a',
          'application/octet-stream',
        ];
        // Also check file extension as a fallback
        const allowedExtensions = [
          '.m4a',
          '.wav',
          '.mp3',
          '.mp4',
          '.ogg',
          '.webm',
          '.aac',
          '.flac',
        ];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (
          allowedMimes.includes(file.mimetype) ||
          allowedExtensions.includes(fileExtension)
        ) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Invalid file type. Only audio files are allowed.',
            ),
            false,
          );
        }
      },
    }),
  )
  async ask(
    @Param('id') id: string,
    @Body() askDto: AskDto,
    @UploadedFile() voiceFile?: Express.Multer.File,
  ): Promise<
    llmResponse & { user_message: ChatMessage; assistant_message: ChatMessage }
  > {
    try {
      const result = await this.llmService.ask(
        id,
        askDto,
        voiceFile?.path || undefined,
      );

      if (voiceFile?.path) {
        setTimeout(() => {
          if (fs.existsSync(voiceFile.path)) {
            fs.unlinkSync(voiceFile.path);
          }
          const convertedFilePath = voiceFile.path.replace(
            path.extname(voiceFile.path),
            '_converted.wav',
          );
          if (fs.existsSync(convertedFilePath)) {
            fs.unlinkSync(convertedFilePath);
          }
        }, 10000);
      }

      return result;
    } catch (error) {
      if (voiceFile?.path && fs.existsSync(voiceFile.path)) {
        fs.unlinkSync(voiceFile.path);
      }
      throw error;
    }
  }
}
