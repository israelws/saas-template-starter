import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';

export enum DocumentType {
  MARKDOWN = 'markdown',
  PDF = 'pdf',
  TEXT = 'text',
  JSON = 'json',
  CSV = 'csv',
}

export enum DocumentSource {
  UPLOAD = 'upload',
  GENERATED = 'generated',
  EXTERNAL = 'external',
  SCRAPED = 'scraped',
}

@Entity('workflow_documents')
export class WorkflowDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workflowId: string;

  @ManyToOne(() => Workflow, workflow => workflow.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  documentType: DocumentType;

  @Column({
    type: 'enum',
    enum: DocumentSource,
  })
  source: DocumentSource;

  @Column({ nullable: true })
  sourceUrl: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ nullable: true })
  filePath: string;

  @Column({ type: 'int', nullable: true })
  fileSize: number;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  embedding: number[];

  @Column({ nullable: true })
  embeddingModel: string;

  @Column({ type: 'jsonb', nullable: true })
  chunks: Array<{
    id: string;
    content: string;
    embedding?: number[];
    metadata?: Record<string, any>;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  processingResult: {
    success: boolean;
    error?: string;
    extractedData?: Record<string, any>;
    tokenCount?: number;
  };

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}