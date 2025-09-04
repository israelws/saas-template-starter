import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from '../entities/workflow.entity';
import { WorkflowBinding } from '../entities/workflow-binding.entity';
import { CreateWorkflowDto } from '../dto/create-workflow.dto';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowBinding)
    private bindingRepository: Repository<WorkflowBinding>,
  ) {}

  async create(createWorkflowDto: CreateWorkflowDto, userId: string): Promise<Workflow> {
    const workflow = this.workflowRepository.create({
      ...createWorkflowDto,
      createdById: userId,
    });

    return await this.workflowRepository.save(workflow);
  }

  async findAll(organizationId: string): Promise<Workflow[]> {
    return await this.workflowRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Workflow> {
    const workflow = await this.workflowRepository.findOne({
      where: { id, organizationId },
      relations: ['executions', 'bindings'],
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return workflow;
  }

  async update(
    id: string,
    organizationId: string,
    updateData: Partial<CreateWorkflowDto>,
  ): Promise<Workflow> {
    const workflow = await this.findOne(id, organizationId);

    // Increment version if flow definition changes
    if (updateData.flowDefinition) {
      workflow.version = workflow.version + 1;
    }

    Object.assign(workflow, updateData);
    return await this.workflowRepository.save(workflow);
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const workflow = await this.findOne(id, organizationId);
    await this.workflowRepository.remove(workflow);
  }

  async toggleActive(id: string, organizationId: string): Promise<Workflow> {
    const workflow = await this.findOne(id, organizationId);
    workflow.isActive = !workflow.isActive;
    return await this.workflowRepository.save(workflow);
  }

  async findByTrigger(
    entityType: string,
    eventName: string,
    organizationId: string,
  ): Promise<Workflow[]> {
    const bindings = await this.bindingRepository.find({
      where: {
        entityType,
        eventName,
        isActive: true,
      },
      relations: ['workflow'],
    });

    return bindings
      .filter(b => b.workflow.organizationId === organizationId && b.workflow.isActive)
      .sort((a, b) => b.priority - a.priority)
      .map(b => b.workflow);
  }

  async createBinding(
    workflowId: string,
    entityType: string,
    eventName: string,
    entityId?: string,
    condition?: Record<string, any>,
  ): Promise<WorkflowBinding> {
    const binding = this.bindingRepository.create({
      workflowId,
      entityType,
      eventName,
      entityId,
      condition,
    });

    return await this.bindingRepository.save(binding);
  }

  async getTemplates(): Promise<Workflow[]> {
    return await this.workflowRepository.find({
      where: { isTemplate: true },
      order: { name: 'ASC' },
    });
  }

  async cloneFromTemplate(templateId: string, organizationId: string, userId: string): Promise<Workflow> {
    const template = await this.workflowRepository.findOne({
      where: { id: templateId, isTemplate: true },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    const workflow = this.workflowRepository.create({
      name: `${template.name} (Copy)`,
      description: template.description,
      triggerType: template.triggerType,
      entityType: template.entityType,
      flowDefinition: template.flowDefinition,
      inputSchema: template.inputSchema,
      outputSchema: template.outputSchema,
      organizationId,
      createdById: userId,
      isTemplate: false,
      isActive: false, // Start as inactive
    });

    return await this.workflowRepository.save(workflow);
  }
}