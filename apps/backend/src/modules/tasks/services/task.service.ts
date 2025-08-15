import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { Task, TaskStatus } from '../entities/task.entity';
import { TaskHistory } from '../entities/task-history.entity';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(TaskHistory)
    private taskHistoryRepository: Repository<TaskHistory>,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      createdById: user.id,
      organizationId: createTaskDto.organizationId,
    });

    const savedTask = await this.taskRepository.save(task);

    // Create initial history entry
    await this.createHistoryEntry(savedTask, user, 'created', 'Task created');

    return this.findOne(savedTask.id);
  }

  async findAll(filters: {
    organizationId?: string;
    assigneeId?: string;
    status?: TaskStatus;
    taskTypeId?: string;
  }): Promise<Task[]> {
    const where: FindOptionsWhere<Task> = {};

    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }
    if (filters.assigneeId) {
      where.assigneeId = filters.assigneeId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.taskTypeId) {
      where.taskTypeId = filters.taskTypeId;
    }

    return this.taskRepository.find({
      where,
      relations: ['taskType', 'assignee', 'createdBy', 'organization', 'subTasks'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['taskType', 'assignee', 'createdBy', 'organization', 'subTasks', 'history'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async findMyTasks(userId: string, organizationId?: string): Promise<Task[]> {
    const where: FindOptionsWhere<Task> = {
      assigneeId: userId,
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    return this.taskRepository.find({
      where,
      relations: ['taskType', 'assignee', 'createdBy', 'organization'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: User): Promise<Task> {
    const task = await this.findOne(id);
    const oldStatus = task.status;
    const oldLifecycleEventId = task.currentLifecycleEventId;

    // Update task
    Object.assign(task, updateTaskDto);

    if (updateTaskDto.status === TaskStatus.COMPLETED && !task.completedAt) {
      task.completedAt = new Date();
    }

    const updatedTask = await this.taskRepository.save(task);

    // Create history entry if status or lifecycle changed
    if (updateTaskDto.status && updateTaskDto.status !== oldStatus) {
      await this.createHistoryEntry(
        updatedTask,
        user,
        'status_changed',
        `Status changed from ${oldStatus} to ${updateTaskDto.status}`,
        oldStatus,
        updateTaskDto.status,
      );
    }

    if (updateTaskDto.currentLifecycleEventId && updateTaskDto.currentLifecycleEventId !== oldLifecycleEventId) {
      await this.createHistoryEntry(
        updatedTask,
        user,
        'lifecycle_changed',
        'Lifecycle event changed',
        null,
        null,
        oldLifecycleEventId,
        updateTaskDto.currentLifecycleEventId,
      );
    }

    return this.findOne(id);
  }

  async assignTask(taskId: string, assigneeId: string, user: User): Promise<Task> {
    const task = await this.findOne(taskId);
    const oldAssigneeId = task.assigneeId;

    task.assigneeId = assigneeId;
    const updatedTask = await this.taskRepository.save(task);

    await this.createHistoryEntry(
      updatedTask,
      user,
      'assigned',
      `Task assigned to user ${assigneeId}`,
    );

    return this.findOne(taskId);
  }

  async updateLifecycleEvent(
    taskId: string,
    lifecycleEventId: string,
    user: User,
  ): Promise<Task> {
    const task = await this.findOne(taskId);
    const oldLifecycleEventId = task.currentLifecycleEventId;

    task.currentLifecycleEventId = lifecycleEventId;
    const updatedTask = await this.taskRepository.save(task);

    await this.createHistoryEntry(
      updatedTask,
      user,
      'lifecycle_changed',
      'Lifecycle event changed',
      null,
      null,
      oldLifecycleEventId,
      lifecycleEventId,
    );

    return this.findOne(taskId);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.remove(task);
  }

  async getTaskHistory(taskId: string): Promise<TaskHistory[]> {
    return this.taskHistoryRepository.find({
      where: { taskId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  private async createHistoryEntry(
    task: Task,
    user: User,
    action: string,
    description: string,
    fromStatus?: string,
    toStatus?: string,
    fromLifecycleEventId?: string,
    toLifecycleEventId?: string,
  ): Promise<TaskHistory> {
    const history = this.taskHistoryRepository.create({
      taskId: task.id,
      userId: user.id,
      action,
      description,
      fromStatus,
      toStatus,
      fromLifecycleEventId,
      toLifecycleEventId,
    });

    return this.taskHistoryRepository.save(history);
  }

  async getTaskStats(organizationId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
  }> {
    const tasks = await this.taskRepository.find({
      where: { organizationId },
    });

    const now = new Date();
    const stats = {
      total: tasks.length,
      byStatus: {},
      byPriority: {},
      overdue: 0,
    };

    tasks.forEach((task) => {
      // Count by status
      stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;

      // Count by priority
      stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;

      // Count overdue
      if (
        task.dueDate &&
        new Date(task.dueDate) < now &&
        task.status !== TaskStatus.COMPLETED &&
        task.status !== TaskStatus.CANCELLED
      ) {
        stats.overdue++;
      }
    });

    return stats;
  }
}