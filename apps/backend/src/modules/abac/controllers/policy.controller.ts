import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PolicyService } from '../services/policy.service';
import { PolicyEvaluatorService } from '../services/policy-evaluator.service';
import { HierarchicalAbacService } from '../services/hierarchical-abac.service';
import {
  CreatePolicyDto,
  UpdatePolicyDto,
  PaginationParams,
  PolicyEvaluationContext,
} from '@saas-template/shared';
import { RequirePermission } from '../decorators/require-permission.decorator';

@ApiTags('Policies')
@Controller('policies')
@ApiBearerAuth()
export class PolicyController {
  constructor(
    private readonly policyService: PolicyService,
    private readonly policyEvaluator: PolicyEvaluatorService,
    private readonly hierarchicalAbac: HierarchicalAbacService,
  ) {}

  @Post()
  @RequirePermission('policy', 'create')
  @ApiOperation({ summary: 'Create a new policy' })
  create(@Body() createPolicyDto: CreatePolicyDto) {
    return this.policyService.create(createPolicyDto);
  }

  @Get()
  @RequirePermission('policy', 'list')
  @ApiOperation({ summary: 'Get all policies for organization' })
  findAll(
    @Query('organizationId', ParseUUIDPipe) organizationId: string,
    @Query() params: PaginationParams,
  ) {
    return this.policyService.findAll(organizationId, params);
  }

  @Get(':id')
  @RequirePermission('policy', 'read')
  @ApiOperation({ summary: 'Get policy by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.policyService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('policy', 'update')
  @ApiOperation({ summary: 'Update policy' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePolicyDto: UpdatePolicyDto,
  ) {
    return this.policyService.update(id, updatePolicyDto);
  }

  @Delete(':id')
  @RequirePermission('policy', 'delete')
  @ApiOperation({ summary: 'Deactivate policy' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.policyService.remove(id);
  }

  @Post(':id/clone')
  @RequirePermission('policy', 'create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Clone a policy' })
  clone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('name') name: string,
  ) {
    return this.policyService.clone(id, name);
  }

  @Post(':id/test')
  @RequirePermission('policy', 'read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test a policy against a context' })
  testPolicy(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() context: PolicyEvaluationContext,
  ) {
    return this.policyService.testPolicy(id, context);
  }

  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Evaluate policies for a given context' })
  async evaluate(@Body() context: PolicyEvaluationContext, @Request() req) {
    // Add current user information to context if not provided
    if (!context.subject.id) {
      context.subject.id = req.user.id;
    }

    return this.hierarchicalAbac.evaluateWithHierarchy(context);
  }

  @Post('evaluate/cross-organization')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Evaluate cross-organization access' })
  async evaluateCrossOrganization(
    @Body() body: {
      context: PolicyEvaluationContext;
      targetOrganizationId: string;
    },
    @Request() req,
  ) {
    // Add current user information to context if not provided
    if (!body.context.subject.id) {
      body.context.subject.id = req.user.id;
    }

    return this.hierarchicalAbac.evaluateCrossOrganization(
      body.context,
      body.targetOrganizationId,
    );
  }

  @Get('effective/:userId')
  @RequirePermission('policy', 'read')
  @ApiOperation({ summary: 'Get effective policies for a user' })
  getEffectivePolicies(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('organizationId', ParseUUIDPipe) organizationId: string,
    @Query('resourceType') resourceType?: string,
  ) {
    return this.hierarchicalAbac.getEffectivePolicies(
      userId,
      organizationId,
      resourceType,
    );
  }

  @Post('cache/clear')
  @RequirePermission('policy', 'manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear policy evaluation cache' })
  async clearCache(@Query('organizationId') organizationId?: string) {
    if (organizationId) {
      await this.policyEvaluator.clearCacheForOrganization(organizationId);
    } else {
      await this.policyEvaluator.clearCache();
    }

    return { message: 'Cache cleared successfully' };
  }

  // PolicySet endpoints
  @Post('sets')
  @RequirePermission('policy', 'create')
  @ApiOperation({ summary: 'Create a new policy set' })
  createPolicySet(
    @Body() body: {
      name: string;
      description: string;
      organizationId: string;
    },
  ) {
    return this.policyService.createPolicySet(
      body.name,
      body.description,
      body.organizationId,
    );
  }

  @Get('sets')
  @RequirePermission('policy', 'list')
  @ApiOperation({ summary: 'Get all policy sets for organization' })
  findPolicySets(@Query('organizationId', ParseUUIDPipe) organizationId: string) {
    return this.policyService.findPolicySets(organizationId);
  }

  @Post(':policyId/add-to-set/:setId')
  @RequirePermission('policy', 'update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add policy to a set' })
  addToSet(
    @Param('policyId', ParseUUIDPipe) policyId: string,
    @Param('setId', ParseUUIDPipe) setId: string,
  ) {
    return this.policyService.addPolicyToSet(policyId, setId);
  }

  @Post(':policyId/remove-from-set')
  @RequirePermission('policy', 'update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove policy from its set' })
  removeFromSet(@Param('policyId', ParseUUIDPipe) policyId: string) {
    return this.policyService.removePolicyFromSet(policyId);
  }
}