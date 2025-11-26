import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export type LessonStatus = 'scheduled' | 'live' | 'completed';

@Entity({ name: 'lessons' })
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  topic: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'datetime' })
  scheduledAt: Date;

  @Column({
    type: 'text',
    default: 'scheduled',
  })
  status: LessonStatus;

  @ManyToOne(() => User, (user) => user.lessonsTeaching, { eager: true })
  teacher: User;

  @ManyToOne(() => User, (user) => user.lessonsAttending, {
    eager: true,
    nullable: true,
  })
  student?: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
