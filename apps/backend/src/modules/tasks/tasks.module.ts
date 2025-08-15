import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TaskType } from './entities/task-type.entity';
import { TaskLifecycleEvent } from './entities/task-lifecycle-event.entity';
import { TaskHistory } from './entities/task-history.entity';
import { TaskService } from './services/task.service';
import { TaskTypeService } from './services/task-type.service';
import { TaskController } from './controllers/task.controller';
import { TaskTypeController } from './controllers/task-type.controller';
import { UsersModule } from '../users/users.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      TaskType,
      TaskLifecycleEvent,
      TaskHistory,
    ]),
    UsersModule,
    OrganizationsModule,
  ],
  controllers: [TaskController, TaskTypeController],
  providers: [TaskService, TaskTypeService],
  exports: [TaskService, TaskTypeService],
})
export class TasksModule {}