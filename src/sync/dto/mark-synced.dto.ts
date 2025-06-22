import { IsString, IsArray, IsOptional } from 'class-validator';

export class MarkSyncedDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readingIds: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  diagnosticIds: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  eventIds: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  summaryIds: string[];
}
