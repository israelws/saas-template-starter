import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsuranceAgent } from './entities/insurance-agent.entity';
import { InsuranceBranch } from './entities/insurance-branch.entity';
import { Territory } from './entities/territory.entity';
import { InsuranceAgentService } from './services/insurance-agent.service';
import { InsuranceBranchService } from './services/insurance-branch.service';
import { TerritoryService } from './services/territory.service';
import { InsuranceAgentController } from './controllers/insurance-agent.controller';
import { InsuranceBranchController } from './controllers/insurance-branch.controller';
import { TerritoryController } from './controllers/territory.controller';
import { UsersModule } from '../users/users.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InsuranceAgent, InsuranceBranch, Territory]),
    UsersModule,
    OrganizationsModule,
  ],
  controllers: [
    InsuranceAgentController,
    InsuranceBranchController,
    TerritoryController,
  ],
  providers: [
    InsuranceAgentService,
    InsuranceBranchService,
    TerritoryService,
  ],
  exports: [
    InsuranceAgentService,
    InsuranceBranchService,
    TerritoryService,
  ],
})
export class InsuranceModule {}