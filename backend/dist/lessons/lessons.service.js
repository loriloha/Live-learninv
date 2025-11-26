"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessonsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const lesson_entity_1 = require("./lesson.entity");
const users_service_1 = require("../users/users.service");
let LessonsService = class LessonsService {
    lessonRepository;
    usersService;
    constructor(lessonRepository, usersService) {
        this.lessonRepository = lessonRepository;
        this.usersService = usersService;
    }
    async createLesson(dto, teacher) {
        if (teacher.role !== 'teacher') {
            throw new common_1.ForbiddenException('Only teachers can create lessons');
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
    async findById(id) {
        const lesson = await this.lessonRepository.findOne({ where: { id } });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        return lesson;
    }
    async joinLesson(id, student) {
        const lesson = await this.findById(id);
        if (lesson.student && lesson.student.id !== student.id) {
            throw new common_1.ForbiddenException('Lesson already has a student');
        }
        lesson.student = student;
        await this.lessonRepository.save(lesson);
        return lesson;
    }
    async updateStatus(id, dto, user) {
        const lesson = await this.findById(id);
        if (lesson.teacher.id !== user.id) {
            throw new common_1.ForbiddenException('Only the teacher can update the lesson');
        }
        lesson.status = dto.status ?? lesson.status;
        return this.lessonRepository.save(lesson);
    }
};
exports.LessonsService = LessonsService;
exports.LessonsService = LessonsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(lesson_entity_1.Lesson)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService])
], LessonsService);
//# sourceMappingURL=lessons.service.js.map