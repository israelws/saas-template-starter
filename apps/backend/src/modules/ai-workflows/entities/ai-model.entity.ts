import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

export enum ModelProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  AZURE = 'azure',
  CUSTOM = 'custom',
}

export enum ModelType {
  LLM = 'llm',
  EMBEDDING = 'embedding',
  IMAGE = 'image',
  AUDIO = 'audio',
  CODE = 'code',
}

@Entity('ai_models')
export class AIModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ModelProvider,
  })
  provider: ModelProvider;

  @Column({
    type: 'enum',
    enum: ModelType,
    default: ModelType.LLM,
  })
  modelType: ModelType;

  @Column()
  modelId: string;

  @Column({ type: 'jsonb', nullable: true })
  configuration: Record<string, any>;

  @Column({ nullable: true })
  apiEndpoint: string;

  @Column({ nullable: true })
  apiKeyName: string;

  @Column({ type: 'jsonb', nullable: true })
  capabilities: {
    maxTokens?: number;
    supportsFunctions?: boolean;
    supportsStreaming?: boolean;
    supportedLanguages?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  pricing: {
    inputTokenCost?: number;
    outputTokenCost?: number;
    currency?: string;
  };

  @Column({ type: 'uuid', nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}