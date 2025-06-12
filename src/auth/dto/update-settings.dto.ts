import { IsString, IsNotEmpty, IsObject } from 'class-validator';
import { User } from '../entities/user.entity';

export class UpdateSettingsDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsObject()
  @IsNotEmpty()
  settings: User['settings'];
}
