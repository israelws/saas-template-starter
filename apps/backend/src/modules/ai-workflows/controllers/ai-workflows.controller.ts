import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AiWorkflowsService } from '../services/ai-workflows.service';
import { AiWorkflow } from '../entities/ai-workflow.entity';

@ApiTags('AI Workflows')
@Controller('ai-workflows')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiWorkflowsController {
  constructor(private readonly workflowsService: AiWorkflowsService) {}

  @Get()
  @ApiOperation({ summary: 'Get workflows by organization' })
  async getOrganizationWorkflows(
    @Query('organizationId') organizationId: string,
  ): Promise<AiWorkflow[]> {
    return await this.workflowsService.findByOrganization(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workflow by ID' })
  async getWorkflow(@Param('id') id: string): Promise<AiWorkflow> {
    return await this.workflowsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new workflow' })
  async createWorkflow(@Body() data: Partial<AiWorkflow>): Promise<AiWorkflow> {
    return await this.workflowsService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a workflow' })
  async updateWorkflow(
    @Param('id') id: string,
    @Body() data: Partial<AiWorkflow>,
  ): Promise<AiWorkflow> {
    return await this.workflowsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a workflow' })
  async deleteWorkflow(@Param('id') id: string): Promise<void> {
    return await this.workflowsService.delete(id);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute a workflow' })
  async executeWorkflow(
    @Param('id') id: string,
    @Body() inputData: Record<string, any>,
  ): Promise<any> {
    // TODO: Implement workflow execution
    return {
      success: true,
      message: 'Workflow execution not yet implemented',
      workflowId: id,
      inputData,
    };
  }
}