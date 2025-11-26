import { User } from '../users/user.entity';
export type LessonStatus = 'scheduled' | 'live' | 'completed';
export declare class Lesson {
    id: string;
    topic: string;
    description?: string;
    scheduledAt: Date;
    status: LessonStatus;
    teacher: User;
    student?: User | null;
    createdAt: Date;
    updatedAt: Date;
}
