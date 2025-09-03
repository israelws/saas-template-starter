import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DevJwtAuthGuard } from '../../auth/guards/dev-jwt-auth.guard';
import { OrganizationContextGuard } from '@/common/guards/organization-context.guard';
import { WorkflowService } from '../services/workflow.service';
import { WorkflowExecutionService } from '../services/workflow-execution.service';
import { CreateWorkflowDto } from '../dto/create-workflow.dto';
import { ExecuteWorkflowDto } from '../dto/execute-workflow.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('AI Workflows')
@ApiBearerAuth()
@Controller('workflows')
@UseGuards(
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev' || !process.env.NODE_ENV
    ? DevJwtAuthGuard 
    : JwtAuthGuard, 
  OrganizationContextGuard
)
export class WorkflowController {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly executionService: WorkflowExecutionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workflow' })
  async create(
    @Body() createWorkflowDto: CreateWorkflowDto,
    @CurrentUser() user: any,
    @Request() req: any,
  ) {
    // Try to get organizationId from multiple sources
    let organizationId = req.organizationId || 
                        req.headers['x-organization-id'] || 
                        createWorkflowDto.organizationId;
    
    // If still no organizationId, use the user's first membership
    if (!organizationId && user.memberships && user.memberships.length > 0) {
      // Use default organization or first available
      const defaultMembership = user.memberships.find((m: any) => m.isDefault) || user.memberships[0];
      organizationId = defaultMembership.organizationId;
    }
    
    if (!organizationId) {
      throw new Error('No organization context available');
    }
    
    return await this.workflowService.create(
      { ...createWorkflowDto, organizationId },
      user.sub,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all workflows for organization' })
  async findAll(@Request() req: any, @CurrentUser() user: any) {
    // Try to get organizationId from multiple sources
    let organizationId = req.organizationId || 
                        req.headers['x-organization-id'];
    
    // If still no organizationId, use the user's first membership
    if (!organizationId && user.memberships && user.memberships.length > 0) {
      // Use default organization or first available
      const defaultMembership = user.memberships.find((m: any) => m.isDefault) || user.memberships[0];
      organizationId = defaultMembership.organizationId;
    }
    
    if (!organizationId) {
      return []; // Return empty array if no organization context
    }
    
    return await this.workflowService.findAll(organizationId);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get workflow templates' })
  async getTemplates() {
    return await this.workflowService.getTemplates();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workflow by ID' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    return await this.workflowService.findOne(id, req.organizationId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update workflow' })
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateWorkflowDto>,
    @Request() req: any,
  ) {
    return await this.workflowService.update(id, req.organizationId, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete workflow' })
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.workflowService.delete(id, req.organizationId);
    return { success: true };
  }

  @Post(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle workflow active status' })
  async toggleActive(@Param('id') id: string, @Request() req: any) {
    return await this.workflowService.toggleActive(id, req.organizationId);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute workflow' })
  async execute(
    @Param('id') id: string,
    @Body() executeDto: ExecuteWorkflowDto,
  ) {
    return await this.executionService.execute(id, executeDto);
  }

  @Get(':id/executions')
  @ApiOperation({ summary: 'Get workflow executions' })
  async getExecutions(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    return await this.executionService.findByWorkflow(id, limit || 20);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get workflow execution statistics' })
  async getStatistics(@Param('id') id: string) {
    return await this.executionService.getStatistics(id);
  }

  @Post('executions/:executionId/cancel')
  @ApiOperation({ summary: 'Cancel workflow execution' })
  async cancelExecution(@Param('executionId') executionId: string) {
    return await this.executionService.cancel(executionId);
  }

  @Post('templates/:templateId/clone')
  @ApiOperation({ summary: 'Clone workflow from template' })
  async cloneFromTemplate(
    @Param('templateId') templateId: string,
    @CurrentUser() user: any,
    @Request() req: any,
  ) {
    return await this.workflowService.cloneFromTemplate(
      templateId,
      req.organizationId,
      user.sub,
    );
  }

  @Post(':id/bindings')
  @ApiOperation({ summary: 'Create workflow binding' })
  async createBinding(
    @Param('id') workflowId: string,
    @Body() bindingData: {
      entityType: string;
      eventName: string;
      entityId?: string;
      condition?: Record<string, any>;
    },
  ) {
    return await this.workflowService.createBinding(
      workflowId,
      bindingData.entityType,
      bindingData.eventName,
      bindingData.entityId,
      bindingData.condition,
    );
  }
}