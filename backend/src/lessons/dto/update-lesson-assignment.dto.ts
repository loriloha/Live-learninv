import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class UpdateLessonAssignmentDto {
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsBoolean()
  unassign?: boolean;
}

