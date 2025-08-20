import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LifecycleWebhook, WebhookAuthType } from '../entities/lifecycle-webhook.entity';
import { WebhookLog } from '../entities/webhook-log.entity';
import { CreateWebhookDto } from '../dto/create-webhook.dto';
import { UpdateWebhookDto } from '../dto/update-webhook.dto';
import { Task } from '../entities/task.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(LifecycleWebhook)
    private webhookRepository: Repository<LifecycleWebhook>,
    @InjectRepository(WebhookLog)
    private webhookLogRepository: Repository<WebhookLog>,
    private httpService: HttpService,
  ) {}

  async create(lifecycleEventId: string, createWebhookDto: CreateWebhookDto): Promise<LifecycleWebhook> {
    const webhook = this.webhookRepository.create({
      ...createWebhookDto,
      lifecycleEventId,
    });
    return this.webhookRepository.save(webhook);
  }

  async findAll(lifecycleEventId: string): Promise<LifecycleWebhook[]> {
    return this.webhookRepository.find({
      where: { lifecycleEventId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<LifecycleWebhook> {
    const webhook = await this.webhookRepository.findOne({ where: { id } });
    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }
    return webhook;
  }

  async update(id: string, updateWebhookDto: UpdateWebhookDto): Promise<LifecycleWebhook> {
    const webhook = await this.findOne(id);
    Object.assign(webhook, updateWebhookDto);
    return this.webhookRepository.save(webhook);
  }

  async remove(id: string): Promise<void> {
    const webhook = await this.findOne(id);
    await this.webhookRepository.remove(webhook);
  }

  async triggerWebhooks(
    lifecycleEventId: string,
    task: Task,
    user: User,
    eventType: string,
    context?: Record<string, any>,
  ): Promise<void> {
    const webhooks = await this.webhookRepository.find({
      where: {
        lifecycleEventId,
        isActive: true,
      },
    });

    for (const webhook of webhooks) {
      try {
        await this.executeWebhook(webhook, task, user, eventType, context);
      } catch (error) {
        this.logger.error(`Failed to execute webhook ${webhook.id}:`, error);
      }
    }
  }

  private async executeWebhook(
    webhook: LifecycleWebhook,
    task: Task,
    user: User,
    eventType: string,
    context?: Record<string, any>,
  ): Promise<void> {
    const startTime = Date.now();
    let retryCount = 0;
    let lastError: Error | null = null;

    const maxRetries = webhook.retryConfig?.maxRetries || 3;
    const retryDelay = webhook.retryConfig?.retryDelay || 1000;
    const backoffMultiplier = webhook.retryConfig?.backoffMultiplier || 2;

    while (retryCount <= maxRetries) {
      try {
        const payload = this.buildPayload(webhook, task, user, eventType, context);
        const headers = this.buildHeaders(webhook);

        const response = await firstValueFrom(
          this.httpService.request<any>({
            method: webhook.method,
            url: webhook.url,
            headers,
            data: payload,
            timeout: 30000,
          }),
        );

        const duration = Date.now() - startTime;

        // Log successful webhook execution
        await this.webhookLogRepository.save({
          webhookId: webhook.id,
          taskId: task.id,
          eventType,
          url: webhook.url,
          method: webhook.method,
          requestHeaders: headers,
          requestBody: payload,
          responseStatus: response.status,
          responseHeaders: response.headers,
          responseBody: response.data,
          duration,
          retryCount,
          success: true,
        });

        // Update webhook status
        webhook.lastTriggeredAt = new Date();
        webhook.lastStatus = 'success';
        webhook.lastError = null;
        await this.webhookRepository.save(webhook);

        return;
      } catch (error) {
        lastError = error;
        retryCount++;

        if (retryCount <= maxRetries) {
          const delay = retryDelay * Math.pow(backoffMultiplier, retryCount - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Log failed webhook execution
    const duration = Date.now() - startTime;
    await this.webhookLogRepository.save({
      webhookId: webhook.id,
      taskId: task.id,
      eventType,
      url: webhook.url,
      method: webhook.method,
      requestHeaders: this.buildHeaders(webhook),
      requestBody: this.buildPayload(webhook, task, user, eventType, context),
      error: lastError?.message || 'Unknown error',
      duration,
      retryCount: retryCount - 1,
      success: false,
    });

    // Update webhook status
    webhook.lastTriggeredAt = new Date();
    webhook.lastStatus = 'failed';
    webhook.lastError = lastError?.message || 'Unknown error';
    await this.webhookRepository.save(webhook);
  }

  private buildPayload(
    webhook: LifecycleWebhook,
    task: Task,
    user: User,
    eventType: string,
    context?: Record<string, any>,
  ): Record<string, any> {
    const basePayload: Record<string, any> = {
      event: eventType,
      timestamp: new Date().toISOString(),
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        taskTypeId: task.taskTypeId,
        organizationId: task.organizationId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      },
    };

    if (webhook.includeContext && context) {
      basePayload.context = context;
    }

    if (webhook.includeAuth) {
      basePayload.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    }

    if (webhook.customPayload) {
      return { ...basePayload, ...webhook.customPayload };
    }

    return basePayload;
  }

  private buildHeaders(webhook: LifecycleWebhook): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'SAAS-Platform-Webhook/1.0',
      ...webhook.headers,
    };

    if (webhook.authType && webhook.authConfig) {
      switch (webhook.authType) {
        case WebhookAuthType.BEARER:
          if (webhook.authConfig.token) {
            headers['Authorization'] = `Bearer ${webhook.authConfig.token}`;
          }
          break;
        case WebhookAuthType.BASIC:
          if (webhook.authConfig.username && webhook.authConfig.password) {
            const credentials = Buffer.from(
              `${webhook.authConfig.username}:${webhook.authConfig.password}`
            ).toString('base64');
            headers['Authorization'] = `Basic ${credentials}`;
          }
          break;
        case WebhookAuthType.API_KEY:
          if (webhook.authConfig.apiKey && webhook.authConfig.apiKeyHeader) {
            headers[webhook.authConfig.apiKeyHeader] = webhook.authConfig.apiKey;
          }
          break;
        case WebhookAuthType.CUSTOM:
          if (webhook.authConfig.customHeaders) {
            Object.assign(headers, webhook.authConfig.customHeaders);
          }
          break;
      }
    }

    return headers;
  }

  async getWebhookLogs(webhookId: string, limit = 100): Promise<WebhookLog[]> {
    return this.webhookLogRepository.find({
      where: { webhookId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['task'],
    });
  }

  async testWebhook(
    id: string,
    testPayload?: Record<string, any>,
  ): Promise<{ success: boolean; response?: any; error?: string }> {
    const webhook = await this.findOne(id);
    
    try {
      const headers = this.buildHeaders(webhook);
      const payload = testPayload || {
        event: 'test',
        timestamp: new Date().toISOString(),
        message: 'This is a test webhook',
      };

      const response = await firstValueFrom(
        this.httpService.request<any>({
          method: webhook.method,
          url: webhook.url,
          headers,
          data: payload,
          timeout: 10000,
        }),
      );

      return {
        success: true,
        response: {
          status: response.status,
          data: response.data,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}