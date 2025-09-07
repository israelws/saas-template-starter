import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER, APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Entity Registry removed - entities are loaded directly

// Core modules that are always loaded
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { AbacModule } from './modules/abac/abac.module';

// Business modules
import { ProductsModule } from './modules/products/products.module';
import { CustomersModule } from './modules/customers/customers.module';
import { OrdersModule } from './modules/orders/orders.module';
import { TransactionsModule } from './modules/transactions/transactions.module';

// Feature modules
import { InsuranceModule } from './modules/insurance/insurance.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { EmailModule } from './modules/email/email.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AiWorkflowsModule } from './modules/ai-workflows/ai-workflows.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';

// Common modules and providers
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { LoggerModule } from './common/logger/logger.module';
import { CacheModule } from './common/cache/cache.module';
import { WebSocketsModule } from './common/websockets/websockets.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
import { OrganizationContextInterceptor } from './common/interceptors/organization-context.interceptor';
import { TypeOrmLogger } from './common/logger/typeorm-logger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { DatabaseExceptionFilter } from './common/filters/database-exception.filter';
import { AbacExceptionFilter } from './common/filters/abac-exception.filter';
import { CustomValidationPipe } from './common/pipes/validation.pipe';

// Import core entities directly for initial setup
import { User } from './modules/users/entities/user.entity';
import { UserOrganizationMembership } from './modules/users/entities/user-organization-membership.entity';
import { UserAttribute } from './modules/users/entities/user-attribute.entity';
import { UserRole } from './modules/users/entities/user-role.entity';
import { Organization } from './modules/organizations/entities/organization.entity';
import { RefreshToken } from './modules/auth/entities/refresh-token.entity';
import { Policy } from './modules/abac/entities/policy.entity';
import { PolicySet } from './modules/abac/entities/policy-set.entity';
import { AttributeDefinition } from './modules/abac/entities/attribute-definition.entity';
import { PolicyFieldRule } from './modules/abac/entities/policy-field-rule.entity';
import { Product } from './modules/products/entities/product.entity';
import { Customer } from './modules/customers/entities/customer.entity';
import { Order } from './modules/orders/entities/order.entity';
import { OrderItem } from './modules/orders/entities/order-item.entity';
import { Transaction } from './modules/transactions/entities/transaction.entity';
import { Task } from './modules/tasks/entities/task.entity';
import { TaskType } from './modules/tasks/entities/task-type.entity';
import { TaskLifecycleEvent } from './modules/tasks/entities/task-lifecycle-event.entity';
import { TaskHistory } from './modules/tasks/entities/task-history.entity';
import { LifecycleWebhook } from './modules/tasks/entities/lifecycle-webhook.entity';
import { WebhookLog } from './modules/tasks/entities/webhook-log.entity';
import { LifecycleWorkflow } from './modules/tasks/entities/lifecycle-workflow.entity';
import { WorkflowExecutionLog } from './modules/tasks/entities/workflow-execution-log.entity';
import { Invitation } from './modules/invitations/entities/invitation.entity';
import { EmailServiceConfig } from './modules/email/entities/email-service-config.entity';
import { EmailTemplate } from './modules/email/entities/email-template.entity';
import { EmailLog } from './modules/email/entities/email-log.entity';
import { AIWorkflow } from './modules/ai-workflows/entities/ai-workflow.entity';
import { OnboardingChecklistItem } from './modules/onboarding/entities/onboarding-checklist-item.entity';
import { OnboardingChecklist } from './modules/onboarding/entities/onboarding-checklist.entity';

// Function to get modules based on environment
function getModulesForEnvironment() {
  const env = process.env.NODE_ENV || 'development';
  const modules: any[] = [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${env}`,
    }),
    EventEmitterModule.forRoot(),
    LoggerModule,
    CacheModule,
    WebSocketsModule,
    AuthModule,
    UsersModule,
  ];

  // In development, progressively enable modules
  if (env === 'development' || env === 'production') {
    modules.push(
      OrganizationsModule,
      AbacModule,
      EmailModule,
      InvitationsModule,
      ProductsModule,
      CustomersModule,
      OrdersModule,
      TransactionsModule,
      TasksModule,
      AiWorkflowsModule,
      OnboardingModule
    );
  }

  // Production-only modules
  if (env === 'production') {
    modules.push(InsuranceModule);
  }

  return modules;
}

// Function to get entities based on environment
function getEntitiesForEnvironment() {
  const env = process.env.NODE_ENV || 'development';
  
  // Core entities always loaded
  const entities: any[] = [
    User,
    UserOrganizationMembership,
    UserAttribute,
    UserRole,
    Organization,
    RefreshToken,
  ];

  // Additional entities for development and production
  if (env === 'development' || env === 'production') {
    entities.push(
      Policy,
      PolicySet,
      AttributeDefinition,
      PolicyFieldRule,
      Product,
      Customer,
      Order,
      OrderItem,
      Transaction,
      // Task entities
      Task,
      TaskType,
      TaskLifecycleEvent,
      TaskHistory,
      LifecycleWebhook,
      WebhookLog,
      LifecycleWorkflow,
      WorkflowExecutionLog,
      // Email entities
      EmailServiceConfig,
      EmailTemplate,
      EmailLog,
      // Invitation entities
      Invitation,
      // AI Workflow entities
      AIWorkflow,
      // Onboarding entities
      OnboardingChecklist,
      OnboardingChecklistItem
    );
  }

  return entities;
}

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'saas_template'),
        entities: getEntitiesForEnvironment(),
        autoLoadEntities: true, // Auto-load entities from modules
        synchronize: false, // Always use migrations in production
        logging: configService.get('NODE_ENV') === 'development',
        logger: configService.get('NODE_ENV') === 'development' ? new TypeOrmLogger() : undefined,
        maxQueryExecutionTime: 1000, // Log slow queries over 1 second
        migrationsRun: false, // Run migrations manually
        // Connection pool configuration
        extra: {
          max: 20, // Maximum number of clients in the pool
          min: 5,  // Minimum number of clients in the pool
          connectionTimeoutMillis: 30000, // Connection timeout
          idleTimeoutMillis: 30000, // Idle timeout
          statementTimeout: 60000, // Statement timeout
        },
        keepConnectionAlive: true, // Keep connection alive during app reload
        retryAttempts: 3, // Number of connection retry attempts
        retryDelay: 3000, // Delay between retries in ms
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          reconnectOnError: (err) => {
            const targetError = 'READONLY';
            if (err.message.includes(targetError)) {
              // Only reconnect when the error contains "READONLY"
              return true;
            }
            return false;
          },
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
      inject: [ConfigService],
    }),
    ...getModulesForEnvironment(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global auth guard - disabled for development
    // Re-enable for production with proper configuration
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
    
    // Global interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
    // Note: OrganizationContextInterceptor disabled until proper dependency injection is set up
    // TODO: Enable after setting up proper repository injection
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: OrganizationContextInterceptor,
    // },
    
    // Exception Filters (order matters - most specific first)
    {
      provide: APP_FILTER,
      useClass: AbacExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DatabaseExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    
    // Global Validation Pipe
    {
      provide: APP_PIPE,
      useClass: CustomValidationPipe,
    },
  ],
})
export class AppModule {
  constructor() {
    const env = process.env.NODE_ENV || 'development';
    const moduleCount = getModulesForEnvironment().length;
    const entityCount = getEntitiesForEnvironment().length;
    
    console.log(`
    ========================================
    🚀 Application Starting
    ========================================
    Environment: ${env}
    Modules Loaded: ${moduleCount}
    Entities Registered: ${entityCount}
    Database: ${process.env.DB_DATABASE || 'saas_template'}
    Port: ${process.env.PORT || 3000}
    ========================================
    `);
  }
}