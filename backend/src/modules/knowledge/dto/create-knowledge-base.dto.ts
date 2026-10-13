import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateKnowledgeBaseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name: string | undefined;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
