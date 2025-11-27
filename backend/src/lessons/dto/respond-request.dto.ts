import { IsIn } from 'class-validator';
import { LessonRequestStatus } from '../lesson-request.entity';

export class RespondRequestDto {
  @IsIn(['accepted', 'rejected'])
  status: Exclude<LessonRequestStatus, 'pending'>;
}

