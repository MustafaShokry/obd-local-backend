import { IsString, IsArray } from 'class-validator';

export class MarkSyncedDto {
  @IsArray()
  @IsString({ each: true })
  readingIds: string[];

  @IsArray()
  @IsString({ each: true })
  diagnosticIds: string[];

  @IsArray()
  @IsString({ each: true })
  eventIds: string[];
}
