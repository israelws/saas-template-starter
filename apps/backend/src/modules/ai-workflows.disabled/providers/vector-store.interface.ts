/**
 * Universal interface for all vector store providers
 * Supports cloud, self-hosted, and embedded databases
 */

export interface IVectorStore {
  name: string;
  type: 'cloud' | 'self-hosted' | 'embedded';
  features: VectorStoreFeatures;
  
  /**
   * Initialize the vector store
   */
  initialize(config: VectorStoreConfig): Promise<void>;
  
  /**
   * Add documents with embeddings
   */
  addDocuments(documents: VectorDocument[]): Promise<string[]>;
  
  /**
   * Perform similarity search
   */
  similaritySearch(
    query: number[],
    k?: number,
    filter?: Record<string, any>
  ): Promise<VectorSearchResult[]>;
  
  /**
   * Perform hybrid search (vector + keyword)
   */
  hybridSearch?(
    query: string,
    embedding: number[],
    k?: number,
    filter?: Record<string, any>
  ): Promise<VectorSearchResult[]>;
  
  /**
   * Search with score threshold
   */
  similaritySearchWithScore?(
    query: number[],
    k?: number,
    scoreThreshold?: number,
    filter?: Record<string, any>
  ): Promise<VectorSearchResult[]>;
  
  /**
   * Delete documents by IDs
   */
  deleteDocuments(ids: string[]): Promise<void>;
  
  /**
   * Delete documents by filter
   */
  deleteByFilter?(filter: Record<string, any>): Promise<number>;
  
  /**
   * Update document metadata
   */
  updateMetadata?(id: string, metadata: Record<string, any>): Promise<void>;
  
  /**
   * Get document by ID
   */
  getDocument?(id: string): Promise<VectorDocument | null>;
  
  /**
   * Create collection/index
   */
  createCollection?(name: string, dimension: number, config?: any): Promise<void>;
  
  /**
   * Delete collection/index
   */
  deleteCollection?(name: string): Promise<void>;
  
  /**
   * List collections/indexes
   */
  listCollections?(): Promise<string[]>;
  
  /**
   * Get statistics
   */
  getStats?(): Promise<VectorStoreStats>;
  
  /**
   * Validate connection
   */
  validateConnection(): Promise<boolean>;
}

export interface VectorStoreConfig {
  // Connection settings
  url?: string;
  apiKey?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  
  // Database/collection settings
  database?: string;
  collection?: string;
  indexName?: string;
  namespace?: string;
  
  // Vector settings
  dimension?: number;
  metric?: 'cosine' | 'euclidean' | 'dotproduct' | 'manhattan';
  
  // Cloud-specific settings
  environment?: string;
  projectId?: string;
  region?: string;
  cloudProvider?: string;
  
  // Performance settings
  connectionPoolSize?: number;
  timeout?: number;
  maxRetries?: number;
  batchSize?: number;
  
  // Features
  hybridSearch?: boolean;
  autoIndex?: boolean;
  compression?: boolean;
}

export interface VectorStoreFeatures {
  // Search capabilities
  hybridSearch: boolean;
  metadataFiltering: boolean;
  scoreThreshold: boolean;
  maxMarginalRelevance: boolean;
  semanticCache: boolean;
  
  // Data management
  multiTenancy: boolean;
  namespaces: boolean;
  collections: boolean;
  backup: boolean;
  versioning: boolean;
  
  // Performance
  streaming: boolean;
  batching: boolean;
  compression: boolean;
  sharding: boolean;
  replication: boolean;
  
  // Advanced features
  sparseVectors: boolean;
  multiVector: boolean;
  geoSearch: boolean;
  timeSeriesSearch: boolean;
}

export interface VectorDocument {
  id?: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, any>;
  namespace?: string;
  score?: number;
}

export interface VectorSearchResult {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  score: number;
  embedding?: number[];
}

export interface VectorStoreStats {
  documentCount: number;
  indexSize: number;
  dimensions: number;
  collections?: string[];
  performance?: {
    averageQueryTime: number;
    indexingRate: number;
  };
}

/**
 * Factory for creating vector store instances
 */
export interface IVectorStoreFactory {
  /**
   * Create a vector store instance
   */
  create(
    type: VectorStoreType,
    embeddings: IEmbeddingProvider,
    config: VectorStoreConfig
  ): Promise<IVectorStore>;
  
  /**
   * Auto-select best vector store based on requirements
   */
  autoSelect(requirements: VectorStoreRequirements): Promise<VectorStoreType>;
  
  /**
   * List available vector stores
   */
  listAvailable(): VectorStoreInfo[];
  
  /**
   * Validate vector store configuration
   */
  validateConfig(type: VectorStoreType, config: VectorStoreConfig): boolean;
}

export interface VectorStoreRequirements {
  scale: 'small' | 'medium' | 'large' | 'enterprise';
  deployment: 'cloud' | 'on-premise' | 'embedded';
  features: Partial<VectorStoreFeatures>;
  budget?: 'low' | 'medium' | 'high';
  region?: string;
  compliance?: string[];
}

export interface VectorStoreInfo {
  type: VectorStoreType;
  name: string;
  description: string;
  deployment: 'cloud' | 'self-hosted' | 'embedded';
  pricing: 'free' | 'freemium' | 'paid';
  features: VectorStoreFeatures;
  pros: string[];
  cons: string[];
  bestFor: string[];
}

export type VectorStoreType = 
  // Cloud-native
  | 'pinecone'
  | 'weaviate'
  | 'qdrant'
  | 'milvus'
  | 'zilliz'
  | 'mongodb-atlas'
  | 'supabase'
  | 'upstash'
  | 'astra-db'
  | 'vectara'
  // Self-hosted
  | 'chroma'
  | 'pgvector'
  | 'elasticsearch'
  | 'opensearch'
  | 'redis'
  | 'typesense'
  | 'clickhouse'
  | 'singlestore'
  // Embedded
  | 'faiss'
  | 'lancedb'
  | 'duckdb'
  | 'sqlite-vss';

/**
 * Embedding provider interface
 */
export interface IEmbeddingProvider {
  /**
   * Generate embeddings for text
   */
  embed(text: string | string[]): Promise<number[][]>;
  
  /**
   * Get embedding dimension
   */
  getDimension(): number;
  
  /**
   * Get model name
   */
  getModel(): string;
}