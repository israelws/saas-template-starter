import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserMembershipsController } from './controllers/user-memberships.controller';
import { UserAttributesController } from './controllers/user-attributes.controller';
import { User } from './entities/user.entity';
import { UserOrganizationMembership } from './entities/user-organization-membership.entity';
import { UserAttribute } from './entities/user-attribute.entity';
import { UserRole } from './entities/user-role.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { AttributeDefinition } from '../abac/entities/attribute-definition.entity';
import { UserRepository } from './repositories/user.repository';
import { UserMembershipsService } from './services/user-memberships.service';
import { UserAttributesService } from './services/user-attributes.service';
// OrganizationClosure is managed automatically by TypeORM for @Tree entities

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, 
      UserOrganizationMembership,
      UserAttribute,
      UserRole,
      Organization,
      AttributeDefinition
    ]),
  ],
  controllers: [UsersController, UserMembershipsController, UserAttributesController],
  providers: [UsersService, UserRepository, UserMembershipsService, UserAttributesService],
  exports: [UsersService, UserRepository, UserMembershipsService, UserAttributesService],
})
export class UsersModule {}