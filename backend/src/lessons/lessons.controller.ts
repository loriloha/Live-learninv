import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { AuthUser } from '../common/auth-user.decorator';
import { User } from '../users/user.entity';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { UpdateLessonAssignmentDto } from './dto/update-lesson-assignment.dto';
import { RespondRequestDto } from './dto/respond-request.dto';

@Controller('lessons')
@UseGuards(JwtAuthGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  findAll() {
    return this.lessonsService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.lessonsService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateLessonDto, @AuthUser() teacher: User) {
    return this.lessonsService.createLesson(dto, teacher);
  }

  @Post(':id/join')
  join(@Param('id') id: string, @AuthUser() student: User) {
    return this.lessonsService.createJoinRequest(id, student);
  }

  @Post(':id/requests')
  requestToJoin(@Param('id') id: string, @AuthUser() student: User) {
    return this.lessonsService.createJoinRequest(id, student);
  }

  @Get(':id/requests')
  listRequests(
    @Param('id') id: string,
    @AuthUser() user: User,
    @Query('scope') scope?: string,
  ) {
    if (scope === 'mine') {
      return this.lessonsService.listRequestsForStudent(id, user);
    }
    return this.lessonsService.listRequestsForTeacher(id, user);
  }

  @Patch(':lessonId/requests/:requestId')
  respondToRequest(
    @Param('lessonId') lessonId: string,
    @Param('requestId') requestId: string,
    @Body() dto: RespondRequestDto,
    @AuthUser() teacher: User,
  ) {
    return this.lessonsService.respondToRequest(
      lessonId,
      requestId,
      dto.status,
      teacher,
    );
  }

  @Patch(':id/assignment')
  updateAssignment(
    @Param('id') id: string,
    @Body() dto: UpdateLessonAssignmentDto,
    @AuthUser() teacher: User,
  ) {
    return this.lessonsService.updateAssignment(id, dto, teacher);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
    @AuthUser() teacher: User,
  ) {
    return this.lessonsService.updateStatus(id, dto, teacher);
  }
}
