import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from './lesson.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    private readonly usersService: UsersService,
  ) {}

  async createLesson(dto: CreateLessonDto, teacher: User) {
    if (teacher.role !== 'teacher') {
      throw new ForbiddenException('Only teachers can create lessons');
    }

    const lesson = this.lessonRepository.create({
      topic: dto.topic,
      description: dto.description,
      scheduledAt: new Date(dto.scheduledAt),
      teacher,
    });

    if (dto.studentId) {
      lesson.student = await this.usersService.findById(dto.studentId);
    }

    return this.lessonRepository.save(lesson);
  }

  findAll() {
    return this.lessonRepository.find({
      order: { scheduledAt: 'ASC' },
    });
  }

  async findById(id: string) {
    const lesson = await this.lessonRepository.findOne({ where: { id } });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    return lesson;
  }

  async joinLesson(id: string, student: User) {
    const lesson = await this.findById(id);
    if (lesson.student && lesson.student.id !== student.id) {
      throw new ForbiddenException('Lesson already has a student');
    }
    lesson.student = student;
    await this.lessonRepository.save(lesson);
    return lesson;
  }

  async updateStatus(id: string, dto: UpdateLessonDto, user: User) {
    const lesson = await this.findById(id);
    if (lesson.teacher.id !== user.id) {
      throw new ForbiddenException('Only the teacher can update the lesson');
    }
    lesson.status = dto.status ?? lesson.status;
    return this.lessonRepository.save(lesson);
  }
}
