import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiWorkflowsController } from './controllers/ai-workflows.controller';
import { WorkflowsController } from './controllers/workflows.controller';
import { AiWorkflowsService } from './services/ai-workflows.service';
import { AiWorkflow } from './entities/ai-workflow.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AiWorkflow])],
  controllers: [AiWorkflowsController, WorkflowsController],
  providers: [AiWorkflowsService],
  exports: [AiWorkflowsService],
})
export class AiWorkflowsModule {}