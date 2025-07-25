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
import { InsuranceBranchService } from '../services/insurance-branch.service';
import {
  CreateInsuranceBranchDto,
  UpdateInsuranceBranchDto,
  PaginationParams,
} from '@saas-template/shared';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CaslAbacGuard } from '../../abac/guards/casl-abac.guard';
import { RequirePermission } from '../../abac/decorators/require-permission.decorator';

@ApiTags('Insurance Branches')
@Controller('insurance/branches')
@UseGuards(JwtAuthGuard, CaslAbacGuard)
@ApiBearerAuth()
export class InsuranceBranchController {
  constructor(private readonly branchService: InsuranceBranchService) {}

  @Post()
  @RequirePermission('insurance_branch', 'create')
  @ApiOperation({ summary: 'Create a new insurance branch' })
  @ApiResponse({ status: 201, description: 'Branch created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createDto: CreateInsuranceBranchDto) {
    return this.branchService.create(createDto);
  }

  @Get()
  @RequirePermission('insurance_branch', 'list')
  @ApiOperation({ summary: 'Get all insurance branches' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'organizationId', required: false, type: String })
  @ApiQuery({ name: 'managerId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(
    @Query() params: PaginationParams,
    @Query('organizationId') organizationId?: string,
    @Query('managerId') managerId?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.branchService.findAll(params, {
      organizationId,
      managerId,
      isActive,
    });
  }

  @Get(':id')
  @RequirePermission('insurance_branch', 'read')
  @ApiOperation({ summary: 'Get insurance branch by ID' })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.branchService.findOne(id);
  }

  @Get('code/:branchCode')
  @RequirePermission('insurance_branch', 'read')
  @ApiOperation({ summary: 'Get insurance branch by code' })
  @ApiParam({ name: 'branchCode', type: String })
  findByCode(@Param('branchCode') branchCode: string) {
    return this.branchService.findByCode(branchCode);
  }

  @Patch(':id')
  @RequirePermission('insurance_branch', 'update')
  @ApiOperation({ summary: 'Update insurance branch' })
  @ApiParam({ name: 'id', type: String })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateInsuranceBranchDto,
  ) {
    return this.branchService.update(id, updateDto);
  }

  @Patch(':id/manager')
  @RequirePermission('insurance_branch', 'update')
  @ApiOperation({ summary: 'Assign manager to branch' })
  @ApiParam({ name: 'id', type: String })
  assignManager(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('managerId') managerId: string,
  ) {
    return this.branchService.assignManager(id, managerId);
  }

  @Patch(':id/territories')
  @RequirePermission('insurance_branch', 'update')
  @ApiOperation({ summary: 'Update branch territories' })
  @ApiParam({ name: 'id', type: String })
  updateTerritories(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('territoryIds') territoryIds: string[],
  ) {
    return this.branchService.updateTerritories(id, territoryIds);
  }

  @Delete(':id')
  @RequirePermission('insurance_branch', 'delete')
  @ApiOperation({ summary: 'Deactivate insurance branch' })
  @ApiParam({ name: 'id', type: String })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.branchService.remove(id);
  }

  @Get('agency/:agencyId')
  @RequirePermission('insurance_branch', 'list')
  @ApiOperation({ summary: 'Get branches by agency' })
  @ApiParam({ name: 'agencyId', type: String })
  findByAgency(@Param('agencyId', ParseUUIDPipe) agencyId: string) {
    return this.branchService.findByAgency(agencyId);
  }

  @Get(':id/statistics')
  @RequirePermission('insurance_branch', 'read')
  @ApiOperation({ summary: 'Get branch statistics' })
  @ApiParam({ name: 'id', type: String })
  getBranchStatistics(@Param('id', ParseUUIDPipe) id: string) {
    return this.branchService.getBranchStatistics(id);
  }
}