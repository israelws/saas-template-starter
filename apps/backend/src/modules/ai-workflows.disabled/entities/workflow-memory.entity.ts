import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Workflow } from './workflow.entity';

export enum MemoryType {
  BUFFER = 'buffer',
  SUMMARY = 'summary',
  ENTITY = 'entity',
  VECTOR = 'vector',
  CONVERSATION_BUFFER = 'conversation_buffer',
  CONVERSATION_SUMMARY = 'conversation_summary',
  CONVERSATION_BUFFER_WINDOW = 'conversation_buffer_window',
  TOKEN_BUFFER = 'token_buffer',
}

export interface MemoryData {
  // Buffer memory
  messages?: Array<{
    role: string;
    content: string;
    timestamp?: Date;
  }>;
  
  // Summary memory
  summary?: string;
  summaryTokenCount?: number;
  
  // Entity memory
  entities?: Record<string, any>;
  
  // Vector memory
  vectorIds?: string[];
  
  // Window memory
  windowSize?: number;
  maxTokens?: number;
  
  // Additional metadata
  [key: string]: any;
}

@Entity('workflow_memory')
@Index(['sessionId'])
export class WorkflowMemory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  sessionId: string;

  @Column()
  workflowId: string;

  @ManyToOne(() => Workflow, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column({
    type: 'varchar',
    length: 50,
    enum: MemoryType,
  })
  memoryType: MemoryType;

  @Column({ type: 'jsonb' })
  memoryData: MemoryData;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}