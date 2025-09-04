import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AiWorkflowsService } from '../services/ai-workflows.service';
import { AiWorkflow } from '../entities/ai-workflow.entity';

@ApiTags('Workflows')
@Controller('workflows')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkflowsController {
  constructor(private readonly workflowsService: AiWorkflowsService) {}

  @ApiOperation({ summary: 'Get workflows for organization' })
  @Get()
  async getWorkflows(@Query('organizationId') organizationId: string): Promise<AiWorkflow[]> {
    return await this.workflowsService.findByOrganization(organizationId);
  }

  @ApiOperation({ summary: 'Get workflow by ID' })
  @Get(':id')
  async getWorkflow(@Param('id') id: string): Promise<AiWorkflow> {
    return await this.workflowsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create new workflow' })
  @Post()
  async createWorkflow(@Body() data: Partial<AiWorkflow>): Promise<AiWorkflow> {
    return await this.workflowsService.create(data);
  }

  @ApiOperation({ summary: 'Update workflow' })
  @Patch(':id')
  async updateWorkflow(
    @Param('id') id: string,
    @Body() data: Partial<AiWorkflow>,
  ): Promise<AiWorkflow> {
    return await this.workflowsService.update(id, data);
  }

  @ApiOperation({ summary: 'Update workflow (PUT)' })
  @Put(':id')
  async updateWorkflowPut(
    @Param('id') id: string,
    @Body() data: Partial<AiWorkflow>,
  ): Promise<AiWorkflow> {
    return await this.workflowsService.update(id, data);
  }

  @ApiOperation({ summary: 'Delete workflow' })
  @Delete(':id')
  async deleteWorkflow(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.workflowsService.delete(id);
    return { success: true };
  }

  @ApiOperation({ summary: 'Execute workflow' })
  @Post(':id/execute')
  async executeWorkflow(
    @Param('id') id: string,
    @Body() data: { inputData?: Record<string, any> },
  ): Promise<any> {
    // Placeholder for workflow execution
    return {
      id: Math.random().toString(36).substr(2, 9),
      workflowId: id,
      status: 'running',
      inputData: data.inputData || {},
      createdAt: new Date(),
    };
  }

  @ApiOperation({ summary: 'Get workflow executions' })
  @Get(':id/executions')
  async getWorkflowExecutions(@Param('id') workflowId: string): Promise<any[]> {
    // Return mock executions for now
    return [];
  }

  @ApiOperation({ summary: 'Toggle workflow active status' })
  @Post(':id/toggle-active')
  async toggleWorkflowActive(@Param('id') id: string): Promise<AiWorkflow> {
    const workflow = await this.workflowsService.findOne(id);
    return await this.workflowsService.update(id, { isActive: !workflow.isActive });
  }

  @ApiOperation({ summary: 'Get workflow templates' })
  @Get('templates')
  async getWorkflowTemplates(): Promise<AiWorkflow[]> {
    // Return mock templates for now
    return [
      {
        id: 'template-1',
        organizationId: 'templates',
        name: 'Customer Onboarding Template',
        description: 'Template for automated customer onboarding',
        triggerType: 'manual',
        entityType: 'customer',
        flowDefinition: {},
        inputSchema: {},
        outputSchema: {},
        isActive: true,
        isTemplate: true,
        version: 1,
        category: 'Templates',
        tags: ['template', 'onboarding'],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    ];
  }

  @ApiOperation({ summary: 'Create workflow from template' })
  @Post('templates/:templateId/create')
  async createFromTemplate(
    @Param('templateId') templateId: string,
    @Body() data: { organizationId: string; name: string },
  ): Promise<AiWorkflow> {
    // Mock implementation for now
    return {
      id: Math.random().toString(36).substr(2, 9),
      organizationId: data.organizationId,
      name: data.name,
      description: `Created from template ${templateId}`,
      triggerType: 'manual',
      entityType: 'task',
      flowDefinition: {},
      inputSchema: {},
      outputSchema: {},
      isActive: true,
      isTemplate: false,
      version: 1,
      category: 'Custom',
      tags: ['from-template'],
      metadata: { templateId },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
  }

  @ApiOperation({ summary: 'Get workflow execution by ID' })
  @Get('executions/:executionId')
  async getWorkflowExecution(@Param('executionId') executionId: string): Promise<any> {
    // Mock implementation for now
    return {
      id: executionId,
      workflowId: 'workflow-1',
      status: 'completed',
      inputData: {},
      outputData: {},
      startedAt: new Date(),
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  @ApiOperation({ summary: 'Cancel workflow execution' })
  @Post('executions/:executionId/cancel')
  async cancelWorkflowExecution(@Param('executionId') executionId: string): Promise<any> {
    return {
      id: executionId,
      status: 'cancelled',
      message: 'Workflow execution cancelled',
    };
  }
}