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
} from '@nestjs/common';
import { TaskTypeService } from '../services/task-type.service';
import { CreateTaskTypeDto } from '../dto/create-task-type.dto';
import { UpdateTaskTypeDto } from '../dto/update-task-type.dto';
import { CreateLifecycleEventDto } from '../dto/create-lifecycle-event.dto';
import { UpdateLifecycleEventDto } from '../dto/update-lifecycle-event.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('task-types')
@UseGuards(JwtAuthGuard)
export class TaskTypeController {
  constructor(private readonly taskTypeService: TaskTypeService) {}

  @Post()
  create(@Body() createTaskTypeDto: CreateTaskTypeDto) {
    return this.taskTypeService.create(createTaskTypeDto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId?: string) {
    return this.taskTypeService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskTypeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskTypeDto: UpdateTaskTypeDto) {
    return this.taskTypeService.update(id, updateTaskTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskTypeService.remove(id);
  }

  @Post(':id/duplicate')
  duplicate(
    @Param('id') id: string,
    @Body('organizationId') organizationId: string,
    @Body('name') name: string,
  ) {
    return this.taskTypeService.duplicateTaskType(id, organizationId, name);
  }

  // Lifecycle Event endpoints
  @Get(':taskTypeId/lifecycle-events')
  getLifecycleEvents(@Param('taskTypeId') taskTypeId: string) {
    return this.taskTypeService.getLifecycleEvents(taskTypeId);
  }

  @Post(':taskTypeId/lifecycle-events')
  createLifecycleEvent(
    @Param('taskTypeId') taskTypeId: string,
    @Body() createLifecycleEventDto: CreateLifecycleEventDto,
  ) {
    return this.taskTypeService.createLifecycleEvent(taskTypeId, createLifecycleEventDto);
  }

  @Patch('lifecycle-events/:id')
  updateLifecycleEvent(
    @Param('id') id: string,
    @Body() updateLifecycleEventDto: UpdateLifecycleEventDto,
  ) {
    return this.taskTypeService.updateLifecycleEvent(id, updateLifecycleEventDto);
  }

  @Delete('lifecycle-events/:id')
  removeLifecycleEvent(@Param('id') id: string) {
    return this.taskTypeService.removeLifecycleEvent(id);
  }

  @Post(':taskTypeId/lifecycle-events/reorder')
  reorderLifecycleEvents(
    @Param('taskTypeId') taskTypeId: string,
    @Body('eventIds') eventIds: string[],
  ) {
    return this.taskTypeService.reorderLifecycleEvents(taskTypeId, eventIds);
  }
}