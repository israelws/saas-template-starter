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
import { WorkflowTemplate } from './entities/workflow-template.entity';
import { WorkflowCredential } from './entities/workflow-credential.entity';
import { VectorEmbedding } from './entities/vector-embedding.entity';
import { ConversationHistory } from './entities/conversation-history.entity';
import { WorkflowMemory } from './entities/workflow-memory.entity';

// Services
import { WorkflowService } from './services/workflow.service';
import { WorkflowExecutionService } from './services/workflow-execution.service';
import { LangGraphService } from './services/langgraph.service';
import { ExecutionEngineService } from './services/execution-engine.service';
import { NodeExecutorService } from './services/node-executor.service';
import { StreamingService } from './services/streaming.service';
import { StateManagerService } from './services/state-manager.service';

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
      WorkflowTemplate,
      WorkflowCredential,
      VectorEmbedding,
      ConversationHistory,
      WorkflowMemory,
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
    LangGraphService,
    ExecutionEngineService,
    NodeExecutorService,
    StreamingService,
    StateManagerService,
  ],
  exports: [
    WorkflowService,
    WorkflowExecutionService,
    ExecutionEngineService,
    LangGraphService,
  ],
})
export class AIWorkflowsModule {}