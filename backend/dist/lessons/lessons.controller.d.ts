import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { User } from '../users/user.entity';
import { UpdateLessonDto } from './dto/update-lesson.dto';
export declare class LessonsController {
    private readonly lessonsService;
    constructor(lessonsService: LessonsService);
    findAll(): Promise<import("./lesson.entity").Lesson[]>;
    findById(id: string): Promise<import("./lesson.entity").Lesson>;
    create(dto: CreateLessonDto, teacher: User): Promise<import("./lesson.entity").Lesson>;
    join(id: string, student: User): Promise<import("./lesson.entity").Lesson>;
    updateStatus(id: string, dto: UpdateLessonDto, teacher: User): Promise<import("./lesson.entity").Lesson>;
}
