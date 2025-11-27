import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../common/auth-user.decorator';
import { User } from './user.entity';
import type { UserRole } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Query('role') role?: UserRole) {
    return this.usersService.list(role);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@AuthUser() user: User) {
    return this.usersService.toPublic(user);
  }
}
