import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebhookService } from '../services/webhook.service';
import { CreateWebhookDto } from '../dto/create-webhook.dto';
import { UpdateWebhookDto } from '../dto/update-webhook.dto';
import { LifecycleWebhook } from '../entities/lifecycle-webhook.entity';
import { WebhookLog } from '../entities/webhook-log.entity';

@ApiTags('Task Webhooks')
@Controller('task-lifecycle-events/:eventId/webhooks')
// Note: Global auth is disabled in development
// Individual controllers handle their own auth
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new webhook for a lifecycle event' })
  @ApiResponse({ status: 201, description: 'Webhook created successfully' })
  async create(
    @Param('eventId') eventId: string,
    @Body() createWebhookDto: CreateWebhookDto,
  ): Promise<LifecycleWebhook> {
    return this.webhookService.create(eventId, createWebhookDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all webhooks for a lifecycle event' })
  @ApiResponse({ status: 200, description: 'List of webhooks' })
  async findAll(
    @Param('eventId') eventId: string,
  ): Promise<LifecycleWebhook[]> {
    return this.webhookService.findAll(eventId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific webhook' })
  @ApiResponse({ status: 200, description: 'Webhook details' })
  async findOne(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
  ): Promise<LifecycleWebhook> {
    return this.webhookService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a webhook' })
  @ApiResponse({ status: 200, description: 'Webhook updated successfully' })
  async update(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
  ): Promise<LifecycleWebhook> {
    return this.webhookService.update(id, updateWebhookDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a webhook' })
  @ApiResponse({ status: 204, description: 'Webhook deleted successfully' })
  async remove(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.webhookService.remove(id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get webhook execution logs' })
  @ApiResponse({ status: 200, description: 'List of webhook logs' })
  async getLogs(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ): Promise<WebhookLog[]> {
    return this.webhookService.getWebhookLogs(id, limit || 100);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test a webhook' })
  @ApiResponse({ status: 200, description: 'Test result' })
  async test(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @Body() testPayload?: Record<string, any>,
  ): Promise<{ success: boolean; response?: any; error?: string }> {
    return this.webhookService.testWebhook(id, testPayload);
  }
}