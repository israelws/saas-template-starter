import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import {
  UserStatus,
  ContactInfo,
  UserAttributes,
  UserPreferences,
} from '@saas-template/shared';
import { UserOrganizationMembership } from './user-organization-membership.entity';
import { UserAttribute } from './user-attribute.entity';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['cognitoId'], { unique: true })
@Index(['status'])
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  cognitoId: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  displayName?: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @Column({ type: 'jsonb', nullable: true })
  contactInfo?: ContactInfo;

  @Column({ type: 'jsonb', nullable: true })
  attributes?: UserAttributes;

  @Column({ type: 'jsonb', nullable: true })
  preferences?: UserPreferences;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Relations
  @OneToMany(() => UserOrganizationMembership, (membership) => membership.user)
  memberships: UserOrganizationMembership[];

  @OneToMany(() => UserAttribute, (attribute) => attribute.user)
  userAttributes: UserAttribute[];

  // Helper methods
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  isSuperAdmin(): boolean {
    return this.metadata?.isSuperAdmin === true;
  }

  hasSuperAdminAccess(): boolean {
    return this.isSuperAdmin() && this.status === UserStatus.ACTIVE;
  }
}