import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Task } from './entities/task.entity';
import { TaskType } from './entities/task-type.entity';
import { TaskLifecycleEvent } from './entities/task-lifecycle-event.entity';
import { TaskHistory } from './entities/task-history.entity';
import { LifecycleWebhook } from './entities/lifecycle-webhook.entity';
import { WebhookLog } from './entities/webhook-log.entity';
import { TaskService } from './services/task.service';
import { TaskTypeService } from './services/task-type.service';
import { WebhookService } from './services/webhook.service';
import { TaskController } from './controllers/task.controller';
import { TaskTypeController } from './controllers/task-type.controller';
import { WebhookController } from './controllers/webhook.controller';
import { UsersModule } from '../users/users.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      TaskType,
      TaskLifecycleEvent,
      TaskHistory,
      LifecycleWebhook,
      WebhookLog,
    ]),
    HttpModule,
    UsersModule,
    OrganizationsModule,
  ],
  controllers: [TaskController, TaskTypeController, WebhookController],
  providers: [TaskService, TaskTypeService, WebhookService],
  exports: [TaskService, TaskTypeService, WebhookService],
})
export class TasksModule {}