import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateChatTitleDto {
  @IsNotEmpty()
  @IsString()
  title: string;
}
