import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/ChatMessage.entity';
import { ChatSession } from './entities/ChatSession.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SpeechService } from 'src/speech/speech.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { AskDto } from './dto/ask.dto';
import { llmQuery, llmResponse } from './llm.types';
import { ObdService } from 'src/obd/obd.service';
import { UpdateChatTitleDto } from './dto/update-chat-title.dto';
import type { SupportedLanguage } from 'src/speech/speech.service';

@Injectable()
export class LlmService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    private readonly speechService: SpeechService,
    private readonly obdService: ObdService,
  ) {}

  async getChats(): Promise<ChatSession[]> {
    return await this.chatSessionRepository.find({
      where: {},
      order: { lastMessageDate: 'DESC' },
    });
  }

  async getChat(id: string): Promise<ChatSession> {
    const chat = await this.chatSessionRepository.findOne({ where: { id } });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    return chat;
  }

  async updateChatTitle(
    id: string,
    updateChatTitleDto: UpdateChatTitleDto,
  ): Promise<ChatSession> {
    const chat = await this.chatSessionRepository.findOne({ where: { id } });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    chat.title = updateChatTitleDto.title;
    return this.chatSessionRepository.save(chat);
  }

  async createChat(createChatDto: CreateChatDto): Promise<ChatSession> {
    const chat = this.chatSessionRepository.create({
      ...createChatDto,
      lastMessage: 'New chat',
    });
    return this.chatSessionRepository.save(chat);
  }

  async createMessage(
    chatId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<ChatMessage> {
    const chat = await this.chatSessionRepository.findOne({
      where: { id: chatId },
    });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    const message = this.chatMessageRepository.create({
      session: { id: chatId },
      content: createMessageDto.content,
      role: 'user',
    });
    await this.chatMessageRepository.save(message);
    await this.chatSessionRepository.update(chatId, {
      lastMessageDate: message.timestamp,
      lastMessage: message.content,
    });
    return message;
  }

  async deleteChat(id: string): Promise<ChatSession> {
    const chat = await this.chatSessionRepository.findOne({ where: { id } });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    await this.chatSessionRepository.delete(id);
    return chat;
  }

  async getMessages(chatId: string): Promise<ChatMessage[]> {
    const messages = await this.chatMessageRepository.find({
      where: { session: { id: chatId } },
      order: { timestamp: 'ASC' },
    });
    if (!messages) {
      throw new NotFoundException('Messages not found');
    }
    return messages;
  }

  async getMessage(chatId: string, messageId: string): Promise<ChatMessage> {
    const message = await this.chatMessageRepository.findOne({
      where: { id: messageId, session: { id: chatId } },
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    return message;
  }

  async ask(
    chatId: string,
    askDto: AskDto,
    voiceFile?: string,
  ): Promise<
    llmResponse & { user_message: ChatMessage; assistant_message: ChatMessage }
  > {
    const chat = await this.chatSessionRepository.findOne({
      where: { id: chatId },
    });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const llmQuery: llmQuery = {};
    const { content, containsSpeech, language, voice, autoPlay } = askDto;

    if (!content && !voiceFile) {
      throw new BadRequestException('Content or voice file is required');
    }

    if (containsSpeech && !voiceFile) {
      throw new BadRequestException('Voice file is required');
    }

    const messageHistory = await this.chatMessageRepository.find({
      where: { session: { id: chatId } },
      order: { timestamp: 'ASC' },
    });

    const qaPairs: { question: string; answer: string }[] = [];

    for (let i = 0; i < messageHistory.length - 1; i++) {
      const msg = messageHistory[i];
      const nextMsg = messageHistory[i + 1];

      if (msg.role === 'user' && nextMsg.role === 'assistant') {
        qaPairs.push({ question: msg.content, answer: nextMsg.content });
        i++;
      }
    }

    llmQuery.chat_history = qaPairs;
    llmQuery.query = content;
    llmQuery.sensor_data = this.obdService.getCurrentData();

    if (containsSpeech && voiceFile) {
      const result = await this.speechService.transcribeVoiceFile(voiceFile);
      if (result.success) {
        llmQuery.voice_text = result.text;
      } else {
        throw new Error('Failed to transcribe voice file');
      }
    }

    const llmResponse = await this.queryLlm(llmQuery);

    const userMessage = this.chatMessageRepository.create({
      session: { id: chatId },
      content: `${content}, voice: ${llmQuery.voice_text}`,
      role: 'user',
    });
    await this.chatMessageRepository.save(userMessage);

    const assistantMessage = this.chatMessageRepository.create({
      session: { id: chatId },
      content: llmResponse.response,
      role: 'assistant',
    });
    await this.chatMessageRepository.save(assistantMessage);
    await this.chatSessionRepository.update(chatId, {
      lastMessageDate: assistantMessage.timestamp,
      lastMessage: assistantMessage.content,
    });

    if (
      autoPlay === 'always' ||
      (autoPlay === 'long' && llmResponse.response.length > 200)
    ) {
      const ttsResult = await this.speechService.synthesizeSpeech(
        llmResponse.response,
        language as SupportedLanguage,
        { playDirectly: true, voice },
      );
      console.log(ttsResult);
    }

    return {
      response: llmResponse.response,
      sensor_data_used: false,
      user_message: userMessage,
      assistant_message: assistantMessage,
    };
  }

  async queryLlm(llmQuery: llmQuery): Promise<llmResponse> {
    console.log(llmQuery);
    const response = await fetch('http://localhost:5000/diagnose', {
      method: 'POST',
      body: JSON.stringify(llmQuery),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = (await response.json()) as llmResponse;
    return data;
  }
}
