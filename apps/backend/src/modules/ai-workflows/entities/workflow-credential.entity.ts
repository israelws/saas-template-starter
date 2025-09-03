import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';

export enum CredentialType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE_AI = 'google_ai',
  AZURE_OPENAI = 'azure_openai',
  HUGGINGFACE = 'huggingface',
  COHERE = 'cohere',
  PINECONE = 'pinecone',
  WEAVIATE = 'weaviate',
  QDRANT = 'qdrant',
  CHROMA = 'chroma',
  MILVUS = 'milvus',
  POSTGRES_VECTOR = 'postgres_vector',
  REDIS = 'redis',
  ELASTICSEARCH = 'elasticsearch',
  MONGODB = 'mongodb',
  MYSQL = 'mysql',
  POSTGRESQL = 'postgresql',
  AWS = 'aws',
  GOOGLE_CLOUD = 'google_cloud',
  AZURE = 'azure',
  SMTP = 'smtp',
  SLACK = 'slack',
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
  WEBHOOK = 'webhook',
  API_KEY = 'api_key',
  OAUTH2 = 'oauth2',
  CUSTOM = 'custom',
}

export interface CredentialData {
  [key: string]: any;
  // Common fields
  apiKey?: string;
  apiUrl?: string;
  secretKey?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  // Provider-specific fields
  organizationId?: string; // For OpenAI
  projectId?: string; // For Google Cloud
  region?: string; // For AWS, Azure
  model?: string;
  temperature?: number;
}

@Entity('workflow_credentials')
export class WorkflowCredential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'varchar',
    length: 100,
    enum: CredentialType,
  })
  credentialType: CredentialType;

  @Column({ type: 'text' })
  encryptedData: string; // Encrypted JSON string of CredentialData

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}