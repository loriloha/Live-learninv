import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: CreateUserDto): Promise<{
        user: {
            id: string;
            email: string;
            displayName: string;
            role: import("../users/user.entity").UserRole;
            lessonsTeaching: import("../lessons/lesson.entity").Lesson[];
            lessonsAttending: import("../lessons/lesson.entity").Lesson[];
            createdAt: Date;
            updatedAt: Date;
        };
        token: string;
    }>;
    login(_dto: LoginDto, req: any): Promise<{
        user: {
            id: string;
            email: string;
            displayName: string;
            role: import("../users/user.entity").UserRole;
            lessonsTeaching: import("../lessons/lesson.entity").Lesson[];
            lessonsAttending: import("../lessons/lesson.entity").Lesson[];
            createdAt: Date;
            updatedAt: Date;
        };
        token: string;
    }>;
}
