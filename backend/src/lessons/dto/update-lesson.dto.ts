import { IsIn, IsOptional } from 'class-validator';
import type { LessonStatus } from '../lesson.entity';

export class UpdateLessonDto {
  @IsOptional()
  @IsIn(['scheduled', 'live', 'completed'])
  status?: LessonStatus;
}
