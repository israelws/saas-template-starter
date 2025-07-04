import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UserOrganizationMembership } from './entities/user-organization-membership.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserOrganizationMembership]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}