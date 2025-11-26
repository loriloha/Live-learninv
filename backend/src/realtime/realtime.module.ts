import { Module } from '@nestjs/common';
import { LiveGateway } from './live.gateway';
import { LessonsModule } from '../lessons/lessons.module';

@Module({
  imports: [LessonsModule],
  providers: [LiveGateway],
})
export class RealtimeModule {}
