import { Repository } from 'typeorm';
import { Lesson } from './lesson.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { UpdateLessonDto } from './dto/update-lesson.dto';
export declare class LessonsService {
    private readonly lessonRepository;
    private readonly usersService;
    constructor(lessonRepository: Repository<Lesson>, usersService: UsersService);
    createLesson(dto: CreateLessonDto, teacher: User): Promise<Lesson>;
    findAll(): Promise<Lesson[]>;
    findById(id: string): Promise<Lesson>;
    joinLesson(id: string, student: User): Promise<Lesson>;
    updateStatus(id: string, dto: UpdateLessonDto, user: User): Promise<Lesson>;
}
