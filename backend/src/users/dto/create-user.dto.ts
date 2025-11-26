import { IsEmail, IsIn, IsNotEmpty, MinLength } from 'class-validator';
import type { UserRole } from '../user.entity';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(4)
  password: string;

  @IsNotEmpty()
  displayName: string;

  @IsIn(['teacher', 'student'])
  role: UserRole;
}
