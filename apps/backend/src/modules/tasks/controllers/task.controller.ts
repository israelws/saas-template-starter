import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { TaskService } from '../services/task.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { TaskStatus } from '../entities/task.entity';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: User) {
    return this.taskService.create(createTaskDto, user);
  }

  @Get()
  findAll(
    @Query('organizationId') organizationId?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('status') status?: TaskStatus,
    @Query('taskTypeId') taskTypeId?: string,
  ) {
    return this.taskService.findAll({
      organizationId,
      assigneeId,
      status,
      taskTypeId,
    });
  }

  @Get('my-tasks')
  findMyTasks(
    @CurrentUser() user: User,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.taskService.findMyTasks(user.id, organizationId);
  }

  @Get('stats/:organizationId')
  getStats(@Param('organizationId') organizationId: string) {
    return this.taskService.getTaskStats(organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskService.findOne(id);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.taskService.getTaskHistory(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.taskService.update(id, updateTaskDto, user);
  }

  @Post(':id/assign')
  assignTask(
    @Param('id') id: string,
    @Body('assigneeId') assigneeId: string,
    @CurrentUser() user: User,
  ) {
    return this.taskService.assignTask(id, assigneeId, user);
  }

  @Post(':id/lifecycle')
  updateLifecycle(
    @Param('id') id: string,
    @Body('lifecycleEventId') lifecycleEventId: string,
    @CurrentUser() user: User,
  ) {
    return this.taskService.updateLifecycleEvent(id, lifecycleEventId, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskService.remove(id);
  }
}