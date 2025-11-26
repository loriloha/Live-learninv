import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/user.entity';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
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
    validateUser(email: string, password: string): Promise<User>;
    login(user: User): Promise<{
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
    private generateToken;
}
