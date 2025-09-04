import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Workflow } from './workflow.entity';
import { WorkflowDocument } from './workflow-document.entity';

export interface EmbeddingMetadata {
  source?: string;
  fileName?: string;
  pageNumber?: number;
  section?: string;
  title?: string;
  author?: string;
  createdDate?: Date;
  tags?: string[];
  [key: string]: any;
}

@Entity('vector_embeddings')
@Index(['organizationId', 'workflowId'])
export class VectorEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ nullable: true })
  workflowId: string;

  @ManyToOne(() => Workflow, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column({ nullable: true })
  documentId: string;

  @ManyToOne(() => WorkflowDocument, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document: WorkflowDocument;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Vector embedding stored as JSON array for compatibility'
  })
  embedding: number[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: EmbeddingMetadata;

  @Column({ type: 'int', nullable: true })
  chunkIndex: number;

  @Column({ type: 'int', nullable: true })
  totalChunks: number;

  @CreateDateColumn()
  createdAt: Date;
}