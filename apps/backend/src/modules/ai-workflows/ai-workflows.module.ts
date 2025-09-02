import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';

// Entities
import { Workflow } from './entities/workflow.entity';
import { WorkflowExecution } from './entities/workflow-execution.entity';
import { WorkflowBinding } from './entities/workflow-binding.entity';
import { AIModel } from './entities/ai-model.entity';
import { WorkflowDocument } from './entities/workflow-document.entity';

// Services
import { WorkflowService } from './services/workflow.service';
import { WorkflowExecutionService } from './services/workflow-execution.service';

// Controllers
import { WorkflowController } from './controllers/workflow.controller';

// Processors
import { WorkflowProcessor } from './processors/workflow.processor';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Workflow,
      WorkflowExecution,
      WorkflowBinding,
      AIModel,
      WorkflowDocument,
    ]),
    BullModule.registerQueue({
      name: 'workflow-execution',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
  ],
  controllers: [WorkflowController],
  providers: [
    WorkflowService,
    WorkflowExecutionService,
    WorkflowProcessor,
  ],
  exports: [
    WorkflowService,
    WorkflowExecutionService,
  ],
})
export class AIWorkflowsModule {}