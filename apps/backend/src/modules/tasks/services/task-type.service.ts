import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { TaskType, TaskTypeScope } from '../entities/task-type.entity';
import { TaskLifecycleEvent } from '../entities/task-lifecycle-event.entity';
import { CreateTaskTypeDto } from '../dto/create-task-type.dto';
import { UpdateTaskTypeDto } from '../dto/update-task-type.dto';
import { CreateLifecycleEventDto } from '../dto/create-lifecycle-event.dto';
import { UpdateLifecycleEventDto } from '../dto/update-lifecycle-event.dto';

@Injectable()
export class TaskTypeService {
  constructor(
    @InjectRepository(TaskType)
    private taskTypeRepository: Repository<TaskType>,
    @InjectRepository(TaskLifecycleEvent)
    private lifecycleEventRepository: Repository<TaskLifecycleEvent>,
  ) {}

  async create(createTaskTypeDto: CreateTaskTypeDto): Promise<TaskType> {
    const taskType = this.taskTypeRepository.create(createTaskTypeDto);
    return this.taskTypeRepository.save(taskType);
  }

  async findAll(organizationId?: string): Promise<TaskType[]> {
    const where: FindOptionsWhere<TaskType>[] = [
      { scope: TaskTypeScope.SYSTEM },
    ];

    if (organizationId) {
      where.push({ 
        scope: TaskTypeScope.ORGANIZATION,
        organizationId,
      });
    }

    return this.taskTypeRepository.find({
      where,
      relations: ['lifecycleEvents', 'organization'],
      order: { 
        scope: 'ASC',
        name: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<TaskType> {
    const taskType = await this.taskTypeRepository.findOne({
      where: { id },
      relations: ['lifecycleEvents', 'organization'],
    });

    if (!taskType) {
      throw new NotFoundException(`Task type with ID ${id} not found`);
    }

    return taskType;
  }

  async update(id: string, updateTaskTypeDto: UpdateTaskTypeDto): Promise<TaskType> {
    const taskType = await this.findOne(id);

    if (taskType.scope === TaskTypeScope.SYSTEM) {
      throw new BadRequestException('System task types cannot be modified');
    }

    Object.assign(taskType, updateTaskTypeDto);
    return this.taskTypeRepository.save(taskType);
  }

  async remove(id: string): Promise<void> {
    const taskType = await this.findOne(id);

    if (taskType.scope === TaskTypeScope.SYSTEM) {
      throw new BadRequestException('System task types cannot be deleted');
    }

    await this.taskTypeRepository.remove(taskType);
  }

  // Lifecycle Event Management
  async createLifecycleEvent(
    taskTypeId: string,
    createLifecycleEventDto: CreateLifecycleEventDto,
  ): Promise<TaskLifecycleEvent> {
    const taskType = await this.findOne(taskTypeId);

    if (taskType.scope === TaskTypeScope.SYSTEM) {
      throw new BadRequestException('Cannot modify lifecycle events for system task types');
    }

    // Get the next order number
    const maxOrder = await this.lifecycleEventRepository
      .createQueryBuilder('event')
      .where('event.taskTypeId = :taskTypeId', { taskTypeId })
      .select('MAX(event.order)', 'maxOrder')
      .getRawOne();

    const lifecycleEvent = this.lifecycleEventRepository.create({
      ...createLifecycleEventDto,
      taskTypeId,
      order: (maxOrder?.maxOrder || 0) + 1,
    });

    return this.lifecycleEventRepository.save(lifecycleEvent);
  }

  async updateLifecycleEvent(
    id: string,
    updateLifecycleEventDto: UpdateLifecycleEventDto,
  ): Promise<TaskLifecycleEvent> {
    const lifecycleEvent = await this.lifecycleEventRepository.findOne({
      where: { id },
      relations: ['taskType'],
    });

    if (!lifecycleEvent) {
      throw new NotFoundException(`Lifecycle event with ID ${id} not found`);
    }

    if (lifecycleEvent.taskType.scope === TaskTypeScope.SYSTEM) {
      throw new BadRequestException('Cannot modify lifecycle events for system task types');
    }

    Object.assign(lifecycleEvent, updateLifecycleEventDto);
    return this.lifecycleEventRepository.save(lifecycleEvent);
  }

  async removeLifecycleEvent(id: string): Promise<void> {
    const lifecycleEvent = await this.lifecycleEventRepository.findOne({
      where: { id },
      relations: ['taskType'],
    });

    if (!lifecycleEvent) {
      throw new NotFoundException(`Lifecycle event with ID ${id} not found`);
    }

    if (lifecycleEvent.taskType.scope === TaskTypeScope.SYSTEM) {
      throw new BadRequestException('Cannot delete lifecycle events for system task types');
    }

    await this.lifecycleEventRepository.remove(lifecycleEvent);
  }

  async reorderLifecycleEvents(
    taskTypeId: string,
    eventIds: string[],
  ): Promise<TaskLifecycleEvent[]> {
    const taskType = await this.findOne(taskTypeId);

    if (taskType.scope === TaskTypeScope.SYSTEM) {
      throw new BadRequestException('Cannot reorder lifecycle events for system task types');
    }

    const events = await this.lifecycleEventRepository.find({
      where: { taskTypeId },
    });

    // Validate all event IDs belong to this task type
    const existingEventIds = events.map(e => e.id);
    const invalidIds = eventIds.filter(id => !existingEventIds.includes(id));
    
    if (invalidIds.length > 0) {
      throw new BadRequestException(`Invalid event IDs: ${invalidIds.join(', ')}`);
    }

    // Update order
    const updates = eventIds.map((id, index) => {
      const event = events.find(e => e.id === id);
      if (event) {
        event.order = index + 1;
      }
      return event;
    }).filter(Boolean);

    return this.lifecycleEventRepository.save(updates);
  }

  async getLifecycleEvents(taskTypeId: string): Promise<TaskLifecycleEvent[]> {
    return this.lifecycleEventRepository.find({
      where: { taskTypeId },
      order: { order: 'ASC' },
    });
  }

  async duplicateTaskType(
    taskTypeId: string,
    organizationId: string,
    newName: string,
  ): Promise<TaskType> {
    const sourceTaskType = await this.findOne(taskTypeId);

    // Create new task type
    const newTaskType = this.taskTypeRepository.create({
      name: newName,
      description: sourceTaskType.description,
      scope: TaskTypeScope.ORGANIZATION,
      organizationId,
      metadata: sourceTaskType.metadata,
      icon: sourceTaskType.icon,
      color: sourceTaskType.color,
      isActive: true,
    });

    const savedTaskType = await this.taskTypeRepository.save(newTaskType);

    // Duplicate lifecycle events
    const sourceEvents = await this.lifecycleEventRepository.find({
      where: { taskTypeId },
      order: { order: 'ASC' },
    });

    const newEvents = sourceEvents.map(event => 
      this.lifecycleEventRepository.create({
        name: event.name,
        description: event.description,
        taskTypeId: savedTaskType.id,
        order: event.order,
        color: event.color,
        icon: event.icon,
        isFinal: event.isFinal,
        isInitial: event.isInitial,
        allowedTransitions: event.allowedTransitions,
        metadata: event.metadata,
      })
    );

    await this.lifecycleEventRepository.save(newEvents);

    return this.findOne(savedTaskType.id);
  }
}