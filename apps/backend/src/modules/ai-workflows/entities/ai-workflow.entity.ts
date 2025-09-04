import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('ai_workflows')
export class AiWorkflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ 
    type: 'varchar', 
    length: 50,
    default: 'manual',
  })
  triggerType: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  entityType: string;

  @Column({ type: 'jsonb', nullable: true })
  flowDefinition: any;

  @Column({ type: 'jsonb', nullable: true })
  inputSchema: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  outputSchema: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isTemplate: boolean;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}