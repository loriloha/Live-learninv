import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private readonly usersRepository;
    constructor(usersRepository: Repository<User>);
    createUser(dto: CreateUserDto): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User>;
    list(): Promise<User[]>;
    toPublic(user: User): {
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
