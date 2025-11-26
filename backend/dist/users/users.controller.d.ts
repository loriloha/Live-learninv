import { UsersService } from './users.service';
import { User } from './user.entity';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(user: User): {
        id: string;
        email: string;
        displayName: string;
        role: import("./user.entity").UserRole;
        lessonsTeaching: import("../lessons/lesson.entity").Lesson[];
        lessonsAttending: import("../lessons/lesson.entity").Lesson[];
        createdAt: Date;
        updatedAt: Date;
    };
}
