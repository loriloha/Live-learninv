import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Lesson } from './lesson.entity';
import { User } from '../users/user.entity';

export type LessonRequestStatus = 'pending' | 'accepted' | 'rejected';

@Entity({ name: 'lesson_requests' })
@Unique(['lesson', 'student'])
export class LessonRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Lesson, { eager: true, onDelete: 'CASCADE' })
  lesson: Lesson;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  student: User;

  @Column({ type: 'text', default: 'pending' })
  status: LessonRequestStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

