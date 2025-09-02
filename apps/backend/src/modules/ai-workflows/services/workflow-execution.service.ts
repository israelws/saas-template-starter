import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowExecution, WorkflowExecutionStatus } from '../entities/workflow-execution.entity';
import { Workflow } from '../entities/workflow.entity';
import { ExecuteWorkflowDto } from '../dto/execute-workflow.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class WorkflowExecutionService {
  constructor(
    @InjectRepository(WorkflowExecution)
    private executionRepository: Repository<WorkflowExecution>,
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    @InjectQueue('workflow-execution')
    private workflowQueue: Queue,
    private eventEmitter: EventEmitter2,
  ) {}

  async execute(workflowId: string, dto: ExecuteWorkflowDto): Promise<WorkflowExecution> {
    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId, isActive: true },
    });

    if (!workflow) {
      throw new BadRequestException('Workflow not found or is inactive');
    }

    // Create execution record
    const execution = this.executionRepository.create({
      workflowId,
      triggerEntityType: dto.triggerEntityType,
      triggerEntityId: dto.triggerEntityId,
      triggerEvent: dto.triggerEvent,
      inputData: dto.inputData || {},
      status: WorkflowExecutionStatus.PENDING,
      executionLog: [],
    });

    const savedExecution = await this.executionRepository.save(execution);

    // Queue the execution
    await this.workflowQueue.add('execute', {
      executionId: savedExecution.id,
      workflow,
      inputData: dto.inputData || {},
    });

    // Emit event
    this.eventEmitter.emit('workflow.execution.started', {
      executionId: savedExecution.id,
      workflowId,
      organizationId: workflow.organizationId,
    });

    return savedExecution;
  }

  async updateStatus(
    executionId: string,
    status: WorkflowExecutionStatus,
    data?: {
      outputData?: Record<string, any>;
      errorMessage?: string;
      logEntry?: any;
    },
  ): Promise<WorkflowExecution> {
    const execution = await this.executionRepository.findOne({
      where: { id: executionId },
    });

    if (!execution) {
      throw new BadRequestException('Execution not found');
    }

    execution.status = status;

    if (status === WorkflowExecutionStatus.RUNNING && !execution.startedAt) {
      execution.startedAt = new Date();
    }

    if (
      status === WorkflowExecutionStatus.COMPLETED ||
      status === WorkflowExecutionStatus.FAILED ||
      status === WorkflowExecutionStatus.CANCELLED
    ) {
      execution.completedAt = new Date();
    }

    if (data?.outputData) {
      execution.outputData = data.outputData;
    }

    if (data?.errorMessage) {
      execution.errorMessage = data.errorMessage;
    }

    if (data?.logEntry) {
      execution.executionLog = [
        ...(execution.executionLog || []),
        {
          timestamp: new Date(),
          ...data.logEntry,
        },
      ];
    }

    const updated = await this.executionRepository.save(execution);

    // Emit status change event
    this.eventEmitter.emit('workflow.execution.statusChanged', {
      executionId,
      status,
      workflowId: execution.workflowId,
    });

    return updated;
  }

  async findByWorkflow(workflowId: string, limit = 20): Promise<WorkflowExecution[]> {
    return await this.executionRepository.find({
      where: { workflowId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findOne(id: string): Promise<WorkflowExecution> {
    const execution = await this.executionRepository.findOne({
      where: { id },
      relations: ['workflow'],
    });

    if (!execution) {
      throw new BadRequestException('Execution not found');
    }

    return execution;
  }

  async cancel(executionId: string): Promise<WorkflowExecution> {
    const execution = await this.findOne(executionId);

    if (execution.status !== WorkflowExecutionStatus.PENDING && 
        execution.status !== WorkflowExecutionStatus.RUNNING) {
      throw new BadRequestException('Cannot cancel execution in current status');
    }

    return await this.updateStatus(executionId, WorkflowExecutionStatus.CANCELLED);
  }

  async getStatistics(workflowId: string): Promise<any> {
    const executions = await this.executionRepository.find({
      where: { workflowId },
    });

    const stats = {
      total: executions.length,
      completed: executions.filter(e => e.status === WorkflowExecutionStatus.COMPLETED).length,
      failed: executions.filter(e => e.status === WorkflowExecutionStatus.FAILED).length,
      running: executions.filter(e => e.status === WorkflowExecutionStatus.RUNNING).length,
      pending: executions.filter(e => e.status === WorkflowExecutionStatus.PENDING).length,
      averageDuration: 0,
    };

    const completedExecutions = executions.filter(
      e => e.status === WorkflowExecutionStatus.COMPLETED && e.startedAt && e.completedAt,
    );

    if (completedExecutions.length > 0) {
      const totalDuration = completedExecutions.reduce((sum, e) => {
        return sum + (e.completedAt.getTime() - e.startedAt.getTime());
      }, 0);
      stats.averageDuration = totalDuration / completedExecutions.length;
    }

    return stats;
  }
}