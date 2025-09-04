import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiWorkflow } from '../entities/ai-workflow.entity';

@Injectable()
export class AiWorkflowsService {
  constructor(
    @InjectRepository(AiWorkflow)
    private readonly workflowRepository: Repository<AiWorkflow>,
  ) {}

  async findByOrganization(organizationId: string): Promise<AiWorkflow[]> {
    // Return empty array if no organizationId
    if (!organizationId || organizationId === 'undefined') {
      return [];
    }
    
    // Query real workflows from database
    return await this.workflowRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<AiWorkflow> {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new NotFoundException(`Invalid workflow ID format: ${id}`);
    }
    
    const workflow = await this.workflowRepository.findOne({ where: { id } });
    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }
    return workflow;
  }

  async create(data: Partial<AiWorkflow>): Promise<AiWorkflow> {
    const workflow = this.workflowRepository.create(data);
    return await this.workflowRepository.save(workflow);
  }

  async update(id: string, data: Partial<AiWorkflow>): Promise<AiWorkflow> {
    await this.findOne(id);
    await this.workflowRepository.update(id, data);
    return await this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.findOne(id);
    await this.workflowRepository.delete(id);
  }

  async executeWorkflow(workflowId: string, inputData: Record<string, any>): Promise<{
    id: string;
    outputData: Record<string, any>;
  }> {
    const workflow = await this.findOne(workflowId);
    
    // TODO: Implement actual workflow execution with AI agents
    // For now, return simulated execution
    const executionId = `exec-${Date.now()}`;
    
    // Simulate workflow execution based on workflow type
    const outputData: Record<string, any> = {
      success: true,
      message: `Workflow "${workflow.name}" executed successfully`,
      workflowId,
      workflowName: workflow.name,
      triggerType: workflow.triggerType,
      entityType: workflow.entityType,
      timestamp: new Date().toISOString(),
      inputReceived: inputData,
    };

    // Add specific outputs based on workflow type
    if (workflow.name.includes('Assignment')) {
      outputData.assignedTo = 'auto-selected-user';
      outputData.assignmentReason = 'Based on availability and skill match';
    } else if (workflow.name.includes('Onboarding')) {
      outputData.stepsCompleted = ['Welcome Email', 'Account Setup', 'Tutorial Scheduled'];
      outputData.nextSteps = ['Complete Profile', 'Team Introduction'];
    } else if (workflow.name.includes('Analysis')) {
      outputData.insights = [
        'Task completion rate improved by 15%',
        'Average resolution time decreased',
        'High priority tasks are being addressed first',
      ];
      outputData.recommendations = [
        'Optimize task assignment algorithm',
        'Review overdue tasks',
        'Increase automation for routine tasks',
      ];
    }

    return {
      id: executionId,
      outputData,
    };
  }
}