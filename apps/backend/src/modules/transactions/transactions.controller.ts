import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  PaginationParams,
  TransactionType,
  TransactionStatus,
} from '@saas-template/shared';
import { RequirePermission } from '../abac/decorators/require-permission.decorator';

@ApiTags('Transactions')
@Controller('transactions')
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @RequirePermission('transaction', 'create')
  @ApiOperation({ summary: 'Create a new transaction' })
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(createTransactionDto);
  }

  @Get()
  @RequirePermission('transaction', 'list')
  @ApiOperation({ summary: 'Get all transactions for organization' })
  findAll(
    @Query('organizationId', ParseUUIDPipe) organizationId: string,
    @Query() params: PaginationParams & {
      type?: TransactionType;
      status?: TransactionStatus;
      customerId?: string;
      orderId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    return this.transactionsService.findAll(organizationId, params);
  }

  @Get('summary')
  @RequirePermission('transaction', 'read')
  @ApiOperation({ summary: 'Get transaction summary statistics' })
  getSummary(
    @Query('organizationId', ParseUUIDPipe) organizationId: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.transactionsService.getSummary(organizationId, startDate, endDate);
  }

  @Get(':id')
  @RequirePermission('transaction', 'read')
  @ApiOperation({ summary: 'Get transaction by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('transaction', 'update')
  @ApiOperation({ summary: 'Update transaction' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, updateTransactionDto);
  }

  @Post(':id/process')
  @RequirePermission('transaction', 'process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process a pending transaction' })
  process(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('gatewayResponse') gatewayResponse?: Record<string, any>,
  ) {
    return this.transactionsService.process(id, gatewayResponse);
  }

  @Post(':id/reverse')
  @RequirePermission('transaction', 'reverse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reverse a completed transaction' })
  reverse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    return this.transactionsService.reverse(id, reason);
  }
}