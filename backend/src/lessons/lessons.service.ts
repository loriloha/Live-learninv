import {
  BadRequestException,
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
import {
  LessonRequest,
  LessonRequestStatus,
} from './lesson-request.entity';
import { UpdateLessonAssignmentDto } from './dto/update-lesson-assignment.dto';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(LessonRequest)
    private readonly lessonRequestRepository: Repository<LessonRequest>,
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
      const student = await this.ensureStudentUser(dto.studentId);
      lesson.student = student;
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

  async updateStatus(id: string, dto: UpdateLessonDto, user: User) {
    const lesson = await this.findById(id);
    if (lesson.teacher.id !== user.id) {
      throw new ForbiddenException('Only the teacher can update the lesson');
    }
    lesson.status = dto.status ?? lesson.status;
    return this.lessonRepository.save(lesson);
  }

  async updateAssignment(
    id: string,
    dto: UpdateLessonAssignmentDto,
    teacher: User,
  ) {
    const lesson = await this.findById(id);
    this.ensureTeacher(lesson, teacher);

    if (dto.unassign) {
      lesson.student = null;
      await this.lessonRepository.save(lesson);
      return lesson;
    }

    if (dto.studentId) {
      const student = await this.ensureStudentUser(dto.studentId);
      if (student.id === lesson.teacher.id) {
        throw new BadRequestException('Teacher cannot be the student');
      }
      lesson.student = student;
      await this.lessonRepository.save(lesson);
      await this.markRequestStatusesAfterAssignment(id, student.id);
      return lesson;
    }

    return lesson;
  }

  async createJoinRequest(id: string, student: User) {
    const lesson = await this.findById(id);
    if (lesson.teacher.id === student.id) {
      throw new ForbiddenException('Teacher cannot request their own lesson');
    }
    if (lesson.student && lesson.student.id !== student.id) {
      throw new ForbiddenException('Lesson already has a student');
    }

    let request = await this.lessonRequestRepository.findOne({
      where: { lesson: { id }, student: { id: student.id } },
    });

    if (lesson.student && lesson.student.id === student.id) {
      if (request) {
        request.status = 'accepted';
        return this.lessonRequestRepository.save(request);
      }
      request = this.lessonRequestRepository.create({
        lesson,
        student,
        status: 'accepted',
      });
      return this.lessonRequestRepository.save(request);
    }

    if (request) {
      if (request.status === 'accepted') {
        return request;
      }
      request.status = 'pending';
      return this.lessonRequestRepository.save(request);
    }

    request = this.lessonRequestRepository.create({
      lesson,
      student,
      status: 'pending',
    });
    return this.lessonRequestRepository.save(request);
  }

  async listRequestsForTeacher(lessonId: string, teacher: User) {
    const lesson = await this.findById(lessonId);
    this.ensureTeacher(lesson, teacher);
    return this.lessonRequestRepository.find({
      where: { lesson: { id: lessonId } },
      order: { createdAt: 'ASC' },
    });
  }

  async listRequestsForStudent(lessonId: string, student: User) {
    await this.findById(lessonId);
    return this.lessonRequestRepository.find({
      where: { lesson: { id: lessonId }, student: { id: student.id } },
      order: { createdAt: 'DESC' },
    });
  }

  async respondToRequest(
    lessonId: string,
    requestId: string,
    status: Exclude<LessonRequestStatus, 'pending'>,
    teacher: User,
  ) {
    const lesson = await this.findById(lessonId);
    this.ensureTeacher(lesson, teacher);

    const request = await this.lessonRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!request || request.lesson.id !== lessonId) {
      throw new NotFoundException('Request not found');
    }

    if (status === 'accepted') {
      if (lesson.student && lesson.student.id !== request.student.id) {
        throw new ForbiddenException('Lesson already has a student');
      }
      lesson.student = request.student;
      await this.lessonRepository.save(lesson);
      request.status = 'accepted';
      await this.lessonRequestRepository.save(request);
      await this.rejectOtherPendingRequests(lessonId, request.id);
      return request;
    }

    request.status = 'rejected';
    return this.lessonRequestRepository.save(request);
  }

  private async ensureStudentUser(studentId: string) {
    const student = await this.usersService.findById(studentId);
    if (student.role !== 'student') {
      throw new BadRequestException('Only students can be assigned');
    }
    return student;
  }

  private ensureTeacher(lesson: Lesson, user: User) {
    if (lesson.teacher.id !== user.id) {
      throw new ForbiddenException('Only the teacher can manage this lesson');
    }
  }

  private async markRequestStatusesAfterAssignment(
    lessonId: string,
    acceptedStudentId: string,
  ) {
    await this.lessonRequestRepository.update(
      {
        lesson: { id: lessonId },
        student: { id: acceptedStudentId },
      },
      { status: 'accepted' },
    );

    await this.lessonRequestRepository
      .createQueryBuilder()
      .update()
      .set({ status: 'rejected' })
      .where('lessonId = :lessonId', { lessonId })
      .andWhere('studentId != :studentId', { studentId: acceptedStudentId })
      .andWhere('status = :pending', { pending: 'pending' })
      .execute();
  }

  private async rejectOtherPendingRequests(
    lessonId: string,
    acceptedRequestId: string,
  ) {
    await this.lessonRequestRepository
      .createQueryBuilder()
      .update()
      .set({ status: 'rejected' })
      .where('lessonId = :lessonId', { lessonId })
      .andWhere('id != :requestId', { requestId: acceptedRequestId })
      .andWhere('status = :pending', { pending: 'pending' })
      .execute();
  }
}
