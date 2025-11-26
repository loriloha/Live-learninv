import { Lesson } from '../lessons/lesson.entity';
export type UserRole = 'teacher' | 'student';
export type PublicUser = Omit<User, 'passwordHash'>;
export declare class User {
    id: string;
    email: string;
    displayName: string;
    passwordHash: string;
    role: UserRole;
    lessonsTeaching: Lesson[];
    lessonsAttending: Lesson[];
    createdAt: Date;
    updatedAt: Date;
}
