import type { UserRole } from '../user.entity';
export declare class CreateUserDto {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
}
