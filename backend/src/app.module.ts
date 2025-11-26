import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';
import { LessonsModule } from './lessons/lessons.module';
import { Lesson } from './lessons/lesson.entity';
import { AuthModule } from './auth/auth.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');

        // If DATABASE_URL is provided, use PostgreSQL (for production/hosted DBs)
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [User, Lesson],
            synchronize: true, // Set to false in production and use migrations
            ssl:
              configService.get('DATABASE_SSL') === 'true'
                ? { rejectUnauthorized: false }
                : false,
          };
        }

        // Otherwise, use SQLite (for local development)
        return {
          type: 'sqlite',
          database:
            configService.get('DATABASE_PATH') ?? 'data/learning.sqlite',
          entities: [User, Lesson],
          synchronize: true,
        };
      },
    }),
    UsersModule,
    AuthModule,
    LessonsModule,
    RealtimeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
