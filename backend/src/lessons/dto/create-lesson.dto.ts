import { IsDateString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateLessonDto {
  @IsNotEmpty()
  topic: string;

  @IsOptional()
  description?: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsUUID()
  studentId?: string;
}
