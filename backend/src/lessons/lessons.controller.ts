import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { AuthUser } from '../common/auth-user.decorator';
import { User } from '../users/user.entity';
import { UpdateLessonDto } from './dto/update-lesson.dto';

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
    return this.lessonsService.joinLesson(id, student);
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
