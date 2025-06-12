import { Transform, Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class AskDto {
  @IsString()
  @IsOptional()
  content: string;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  containsSpeech: boolean;

  @IsOptional()
  @Type(() => Object)
  voiceFile?: Express.Multer.File;

  @IsString()
  @IsNotEmpty()
  language: string;

  @IsString()
  @IsNotEmpty()
  voice: string;

  @IsString()
  @IsNotEmpty()
  autoPlay: string;
}
