import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Lesson } from '../lessons/lesson.entity';

export type UserRole = 'teacher' | 'student';
export type PublicUser = Omit<User, 'passwordHash'>;

@Entity({ name: 'users' })
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  displayName: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({
    type: 'text',
    default: 'student',
  })
  role: UserRole;

  @OneToMany(() => Lesson, (lesson) => lesson.teacher)
  lessonsTeaching: Lesson[];

  @OneToMany(() => Lesson, (lesson) => lesson.student)
  lessonsAttending: Lesson[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
