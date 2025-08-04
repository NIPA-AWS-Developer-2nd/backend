import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class FileInfoDto {
  @IsString()
  fileName: string;

  @IsString()
  contentType: string;
}

export class GeneratePresignedUrlDto {
  @IsString()
  fileName: string;

  @IsString()
  contentType: string;

  @IsOptional()
  @IsString()
  folder?: string;
}

export class GenerateMultiplePresignedUrlsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileInfoDto)
  files: FileInfoDto[];

  @IsOptional()
  @IsString()
  folder?: string;
}
