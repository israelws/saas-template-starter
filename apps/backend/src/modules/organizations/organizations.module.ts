import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { OrganizationHierarchyController } from './controllers/organization-hierarchy.controller';
import {
  OrganizationMembersController,
  OrganizationInvitationsController,
} from './controllers/organization-members.controller';
import { Organization } from './entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { UserOrganizationMembership } from '../users/entities/user-organization-membership.entity';
import { OrganizationRepository } from './repositories/organization.repository';
import { OrganizationHierarchyService } from './services/organization-hierarchy.service';
import { OrganizationMembersService } from './services/organization-members.service';
import { WebSocketsModule } from '../../common/websockets/websockets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, User, UserOrganizationMembership]),
    ScheduleModule.forRoot(),
    forwardRef(() => WebSocketsModule),
  ],
  controllers: [
    OrganizationsController,
    OrganizationHierarchyController,
    OrganizationMembersController,
    OrganizationInvitationsController,
  ],
  providers: [
    OrganizationsService,
    OrganizationRepository,
    OrganizationHierarchyService,
    OrganizationMembersService,
  ],
  exports: [
    OrganizationsService,
    OrganizationRepository,
    OrganizationHierarchyService,
    OrganizationMembersService,
  ],
})
export class OrganizationsModule {}
