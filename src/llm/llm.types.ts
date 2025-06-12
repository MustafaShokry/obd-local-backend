import { ObdCurrentData } from 'src/obd/types/obd.types';

export interface llmQuery {
  voice_text?: string;
  query?: string;
  chat_history?: { question: string; answer: string }[];
  sensor_data?: ObdCurrentData;
}

export interface llmResponse {
  response: string;
  sensor_data_used: boolean;
}
