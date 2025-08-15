import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('user_attributes')
@Unique(['userId', 'organizationId', 'key'])
@Index(['userId', 'organizationId'])
@Index(['organizationId', 'key'])
@Index(['key', 'value'])
export class UserAttribute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  organizationId: string;

  @Column({ length: 100 })
  key: string;

  @Column('jsonb')
  value: any;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'string',
    comment: 'Data type: string, number, boolean, array, object',
  })
  dataType: string;

  @Column({
    default: true,
    comment: 'Whether this attribute is visible to other users in the organization',
  })
  isPublic: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    name: 'valid_from',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  validFrom: Date;

  @Column({
    name: 'valid_to',
    type: 'timestamp',
    nullable: true,
  })
  validTo: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.userAttributes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;
}
