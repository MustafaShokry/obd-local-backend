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
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';
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

  // @Post('chats/:id/ask/stream')
  // @UseInterceptors(
  //   FileInterceptor('voiceFile', {
  //     storage: diskStorage({
  //       destination: './uploads/audio',
  //       filename: (req, file, cb) => {
  //         const uniqueSuffix =
  //           Date.now() + '-' + Math.round(Math.random() * 1e9);
  //         cb(
  //           null,
  //           `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`,
  //         );
  //       },
  //     }),
  //     fileFilter: (req, file, cb) => {
  //       const allowedMimes = [
  //         'audio/wav',
  //         'audio/mpeg',
  //         'audio/mp3',
  //         'audio/mp4',
  //         'audio/webm',
  //         'audio/ogg',
  //         'audio/m4a',
  //         'audio/aac',
  //         'audio/flac',
  //         'audio/wav',
  //         'audio/mp3',
  //         'audio/mp4',
  //         'audio/x-m4a',
  //         'application/octet-stream',
  //       ];
  //       // Also check file extension as a fallback
  //       const allowedExtensions = [
  //         '.m4a',
  //         '.wav',
  //         '.mp3',
  //         '.mp4',
  //         '.ogg',
  //         '.webm',
  //         '.aac',
  //         '.flac',
  //       ];
  //       const fileExtension = path.extname(file.originalname).toLowerCase();
  //       if (
  //         allowedMimes.includes(file.mimetype) ||
  //         allowedExtensions.includes(fileExtension)
  //       ) {
  //         cb(null, true);
  //       } else {
  //         cb(
  //           new BadRequestException(
  //             'Invalid file type. Only audio files are allowed.',
  //           ),
  //           false,
  //         );
  //       }
  //     },
  //   }),
  // )
  // async askStream(
  //   @Param('id') id: string,
  //   @Body() askDto: AskDto,
  //   @UploadedFile() voiceFile: Express.Multer.File,
  //   @Res() res: Response,
  // ): Promise<void> {
  //   try {
  //     // Set headers for streaming
  //     res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  //     res.setHeader('Transfer-Encoding', 'chunked');
  //     res.setHeader('Cache-Control', 'no-cache');
  //     res.setHeader('Connection', 'keep-alive');

  //     // Create a writable stream to send chunks
  //     const sendChunk = (chunk: string) => {
  //       res.write(
  //         `data: ${JSON.stringify({ chunk, timestamp: Date.now() })}\n\n`,
  //       );
  //     };

  //     // Send initial connection established message
  //     res.write(
  //       `data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`,
  //     );

  //     const result = await this.llmService.askWithStreaming(
  //       id,
  //       askDto,
  //       voiceFile?.path || undefined,
  //       sendChunk,
  //     );

  //     // Send final result
  //     res.write(
  //       `data: ${JSON.stringify({
  //         type: 'complete',
  //         result: {
  //           response: result.response,
  //           sensor_data_used: result.sensor_data_used,
  //           user_message: result.user_message,
  //           assistant_message: result.assistant_message,
  //         },
  //         timestamp: Date.now(),
  //       })}\n\n`,
  //     );

  //     res.end();

  //     // Clean up voice file
  //     if (voiceFile?.path) {
  //       setTimeout(() => {
  //         if (fs.existsSync(voiceFile.path)) {
  //           fs.unlinkSync(voiceFile.path);
  //         }
  //         const convertedFilePath = voiceFile.path.replace(
  //           path.extname(voiceFile.path),
  //           '_converted.wav',
  //         );
  //         if (fs.existsSync(convertedFilePath)) {
  //           fs.unlinkSync(convertedFilePath);
  //         }
  //       }, 10000);
  //     }
  //   } catch (error) {
  //     // Send error message
  //     res.write(
  //       `data: ${JSON.stringify({
  //         type: 'error',
  //         error: error instanceof Error ? error.message : 'Unknown error',
  //         timestamp: Date.now(),
  //       })}\n\n`,
  //     );
  //     res.end();

  //     // Clean up voice file on error
  //     if (voiceFile?.path && fs.existsSync(voiceFile.path)) {
  //       fs.unlinkSync(voiceFile.path);
  //     }
  //   }
  // }
  @Post('chats/:id/ask/stream')
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
          'application/octet-stream',
        ];
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
  async askStream(
    @Param('id') id: string,
    @Body() askDto: AskDto,
    @UploadedFile() voiceFile: Express.Multer.File,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    try {
      // Set headers for Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      // res.setHeader('Access-Control-Allow-Credentials', 'true');

      // Send initial connection message
      res.write(
        `data: ${JSON.stringify({
          type: 'connected',
          timestamp: Date.now(),
        })}\n\n`,
      );

      // Handle streaming with real-time forwarding
      await this.llmService.askWithStreamingRealTime(
        id,
        askDto,
        voiceFile?.path || undefined,
        (data: any) => {
          // Forward each chunk from Flask to the frontend
          res.write(
            `data: ${JSON.stringify({
              type: 'data',
              payload: data,
              timestamp: Date.now(),
            })}\n\n`,
          );
        },
      );

      // Send completion message
      res.write(
        `data: ${JSON.stringify({
          type: 'complete',
          timestamp: Date.now(),
        })}\n\n`,
      );

      res.end();
    } catch (error) {
      console.error('Streaming error:', error);

      // Send error message
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        })}\n\n`,
      );

      res.end();
    } finally {
      // Clean up voice file
      if (voiceFile?.path) {
        setTimeout(() => {
          try {
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
          } catch (cleanupError) {
            console.error('Error cleaning up voice files:', cleanupError);
          }
        }, 10000);
      }
    }
  }

  // @Post('chats/:id/ask/stream-text')
  // async askStreamText(
  //   @Param('id') id: string,
  //   @Body() askDto: AskDto,
  //   @Res() res: Response,
  // ): Promise<void> {
  //   try {
  //     // Set headers for streaming
  //     res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  //     res.setHeader('Transfer-Encoding', 'chunked');
  //     res.setHeader('Cache-Control', 'no-cache');
  //     res.setHeader('Connection', 'keep-alive');

  //     // Create a writable stream to send chunks
  //     const sendChunk = (chunk: string) => {
  //       res.write(
  //         `data: ${JSON.stringify({ chunk, timestamp: Date.now() })}\n\n`,
  //       );
  //     };

  //     // Send initial connection established message
  //     res.write(
  //       `data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`,
  //     );

  //     const result = await this.llmService.askWithStreaming(
  //       id,
  //       askDto,
  //       undefined, // No voice file
  //       sendChunk,
  //     );

  //     // Send final result
  //     res.write(
  //       `data: ${JSON.stringify({
  //         type: 'complete',
  //         result: {
  //           response: result.response,
  //           sensor_data_used: result.sensor_data_used,
  //           user_message: result.user_message,
  //           assistant_message: result.assistant_message,
  //         },
  //         timestamp: Date.now(),
  //       })}\n\n`,
  //     );

  //     res.end();
  //   } catch (error) {
  //     // Send error message
  //     res.write(
  //       `data: ${JSON.stringify({
  //         type: 'error',
  //         error: error instanceof Error ? error.message : 'Unknown error',
  //         timestamp: Date.now(),
  //       })}\n\n`,
  //     );
  //     res.end();
  //   }
  // }
}
