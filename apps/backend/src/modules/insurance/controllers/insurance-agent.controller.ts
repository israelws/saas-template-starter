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
  UseGuards,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { InsuranceAgentService } from '../services/insurance-agent.service';
import {
  CreateInsuranceAgentDto,
  UpdateInsuranceAgentDto,
  PaginationParams,
  LicenseStatus,
} from '@saas-template/shared';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CaslAbacGuard } from '../../abac/guards/casl-abac.guard';
import { RequirePermission } from '../../abac/decorators/require-permission.decorator';

@ApiTags('Insurance Agents')
@Controller('insurance/agents')
@UseGuards(JwtAuthGuard, CaslAbacGuard)
@ApiBearerAuth()
export class InsuranceAgentController {
  constructor(private readonly agentService: InsuranceAgentService) {}

  @Post()
  @RequirePermission('insurance_agent', 'create')
  @ApiOperation({ summary: 'Create a new insurance agent' })
  @ApiResponse({ status: 201, description: 'Agent created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createDto: CreateInsuranceAgentDto) {
    return this.agentService.create(createDto);
  }

  @Get()
  @RequirePermission('insurance_agent', 'list')
  @ApiOperation({ summary: 'Get all insurance agents' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'licenseStatus', required: false, enum: LicenseStatus })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(
    @Query() params: PaginationParams,
    @Query('branchId') branchId?: string,
    @Query('licenseStatus') licenseStatus?: LicenseStatus,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.agentService.findAll(params, {
      branchId,
      licenseStatus,
      isActive,
    });
  }

  @Get(':id')
  @RequirePermission('insurance_agent', 'read')
  @ApiOperation({ summary: 'Get insurance agent by ID' })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.agentService.findOne(id);
  }

  @Get('user/:userId')
  @RequirePermission('insurance_agent', 'read')
  @ApiOperation({ summary: 'Get insurance agent by user ID' })
  @ApiParam({ name: 'userId', type: String })
  findByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.agentService.findByUserId(userId);
  }

  @Patch(':id')
  @RequirePermission('insurance_agent', 'update')
  @ApiOperation({ summary: 'Update insurance agent' })
  @ApiParam({ name: 'id', type: String })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateInsuranceAgentDto,
  ) {
    return this.agentService.update(id, updateDto);
  }

  @Patch(':id/license-status')
  @RequirePermission('insurance_agent', 'update')
  @ApiOperation({ summary: 'Update agent license status' })
  @ApiParam({ name: 'id', type: String })
  updateLicenseStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: LicenseStatus,
  ) {
    return this.agentService.updateLicenseStatus(id, status);
  }

  @Patch(':id/performance-metrics')
  @RequirePermission('insurance_agent', 'update')
  @ApiOperation({ summary: 'Update agent performance metrics' })
  @ApiParam({ name: 'id', type: String })
  updatePerformanceMetrics(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() metrics: any,
  ) {
    return this.agentService.updatePerformanceMetrics(id, metrics);
  }

  @Post(':id/territories')
  @RequirePermission('insurance_agent', 'update')
  @ApiOperation({ summary: 'Assign territories to agent' })
  @ApiParam({ name: 'id', type: String })
  assignTerritories(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('territoryIds') territoryIds: string[],
  ) {
    return this.agentService.assignTerritories(id, territoryIds);
  }

  @Delete(':id')
  @RequirePermission('insurance_agent', 'delete')
  @ApiOperation({ summary: 'Deactivate insurance agent' })
  @ApiParam({ name: 'id', type: String })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.agentService.remove(id);
  }

  @Get('branch/:branchId')
  @RequirePermission('insurance_agent', 'list')
  @ApiOperation({ summary: 'Get agents by branch' })
  @ApiParam({ name: 'branchId', type: String })
  findByBranch(@Param('branchId', ParseUUIDPipe) branchId: string) {
    return this.agentService.findByBranch(branchId);
  }

  @Get('license/expiring')
  @RequirePermission('insurance_agent', 'list')
  @ApiOperation({ summary: 'Get agents with expiring licenses' })
  checkLicenseExpiry() {
    return this.agentService.checkLicenseExpiry();
  }
}