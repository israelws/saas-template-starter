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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  PaginationParams,
  CustomerType,
  CustomerStatus,
} from '@saas-template/shared';
import { RequirePermission } from '../abac/decorators/require-permission.decorator';

@ApiTags('Customers')
@Controller('customers')
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @RequirePermission('customer', 'create')
  @ApiOperation({ summary: 'Create a new customer' })
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @RequirePermission('customer', 'list')
  @ApiOperation({ summary: 'Get all customers for organization' })
  findAll(
    @Query('organizationId', ParseUUIDPipe) organizationId: string,
    @Query() params: PaginationParams & {
      type?: CustomerType;
      status?: CustomerStatus;
      search?: string;
    },
  ) {
    return this.customersService.findAll(organizationId, params);
  }

  @Get('top')
  @RequirePermission('customer', 'list')
  @ApiOperation({ summary: 'Get top customers by spending' })
  getTopCustomers(
    @Query('organizationId', ParseUUIDPipe) organizationId: string,
    @Query('limit') limit?: number,
  ) {
    return this.customersService.getTopCustomers(organizationId, limit);
  }

  @Get('credit-issues')
  @RequirePermission('customer', 'list')
  @ApiOperation({ summary: 'Get customers exceeding credit limit' })
  getCreditIssues(@Query('organizationId', ParseUUIDPipe) organizationId: string) {
    return this.customersService.getCustomersWithCreditIssues(organizationId);
  }

  @Get(':id')
  @RequirePermission('customer', 'read')
  @ApiOperation({ summary: 'Get customer by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findOne(id);
  }

  @Get('email/:email')
  @RequirePermission('customer', 'read')
  @ApiOperation({ summary: 'Get customer by email' })
  findByEmail(
    @Param('email') email: string,
    @Query('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.customersService.findByEmail(email, organizationId);
  }

  @Patch(':id')
  @RequirePermission('customer', 'update')
  @ApiOperation({ summary: 'Update customer' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Post(':id/balance')
  @RequirePermission('customer', 'update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update customer balance' })
  updateBalance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { amount: number; operation?: 'set' | 'add' | 'subtract' },
  ) {
    return this.customersService.updateBalance(
      id,
      body.amount,
      body.operation || 'add',
    );
  }

  @Post(':id/check-credit')
  @RequirePermission('customer', 'read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if amount is within credit limit' })
  async checkCreditLimit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('amount') amount: number,
  ) {
    const allowed = await this.customersService.checkCreditLimit(id, amount);
    return { allowed, amount };
  }

  @Delete(':id')
  @RequirePermission('customer', 'delete')
  @ApiOperation({ summary: 'Deactivate customer' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.remove(id);
  }

  @Post('merge')
  @RequirePermission('customer', 'manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Merge duplicate customers' })
  mergeDuplicates(
    @Body() body: {
      primaryId: string;
      duplicateIds: string[];
    },
  ) {
    return this.customersService.mergeDuplicates(
      body.primaryId,
      body.duplicateIds,
    );
  }
}