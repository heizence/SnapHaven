import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BackgroundTasksService } from './background-tasks.service';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([User])],
  providers: [BackgroundTasksService],
  exports: [BackgroundTasksService],
})
export class BackgroundTaskModules {}
