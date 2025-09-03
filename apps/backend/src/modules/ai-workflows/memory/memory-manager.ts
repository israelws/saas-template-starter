import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface IMemory {
  type: string;
  sessionKey: string;
  
  // Core memory operations
  save(data: any): Promise<void>;
  load(): Promise<any>;
  clear(): Promise<void>;
  
  // Conversation memory specific
  addMessage?(role: string, content: string): Promise<void>;
  getMessages?(): Promise<any[]>;
  getContext?(): Promise<string>;
  
  // Vector memory specific
  addDocument?(document: any): Promise<void>;
  search?(query: string, k?: number): Promise<any[]>;
}

export interface MemoryConfig {
  type: 'conversation' | 'buffer' | 'summary' | 'vector' | 'none';
  sessionKey: string;
  k?: number;  // Number of messages/documents to keep
  vectorStore?: string;
  summarizer?: any;
  [key: string]: any;
}

/**
 * Conversation Memory - Stores full conversation history
 */
class ConversationMemory implements IMemory {
  type = 'conversation';
  private messages: Array<{ role: string; content: string; timestamp: Date }> = [];
  
  constructor(
    public sessionKey: string,
    private config: MemoryConfig,
    private repo?: Repository<any>
  ) {
    this.loadFromDatabase();
  }

  private async loadFromDatabase(): Promise<void> {
    if (!this.repo) return;
    
    try {
      const stored = await this.repo.findOne({
        where: { sessionKey: this.sessionKey },
      });
      
      if (stored && stored.messages) {
        this.messages = stored.messages;
      }
    } catch (error) {
      // Ignore errors, start with empty memory
    }
  }

  async save(data: any): Promise<void> {
    if (!this.repo) return;
    
    try {
      const existing = await this.repo.findOne({
        where: { sessionKey: this.sessionKey },
      });
      
      if (existing) {
        existing.messages = this.messages;
        existing.updatedAt = new Date();
        await this.repo.save(existing);
      } else {
        await this.repo.save({
          sessionKey: this.sessionKey,
          messages: this.messages,
          createdAt: new Date(),
        });
      }
    } catch (error) {
      // Log error but don't throw
      console.error('Failed to save conversation memory:', error);
    }
  }

  async load(): Promise<any> {
    return this.messages;
  }

  async clear(): Promise<void> {
    this.messages = [];
    await this.save(null);
  }

  async addMessage(role: string, content: string): Promise<void> {
    this.messages.push({
      role,
      content,
      timestamp: new Date(),
    });
    
    // Keep only last k messages if configured
    if (this.config.k && this.messages.length > this.config.k) {
      this.messages = this.messages.slice(-this.config.k);
    }
    
    await this.save(null);
  }

  async getMessages(): Promise<any[]> {
    return this.messages;
  }

  async getContext(): Promise<string> {
    if (this.messages.length === 0) {
      return '';
    }
    
    return 'Previous conversation:\n' + 
      this.messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');
  }
}

/**
 * Buffer Memory - Stores last k interactions
 */
class BufferMemory implements IMemory {
  type = 'buffer';
  private buffer: any[] = [];
  
  constructor(
    public sessionKey: string,
    private config: MemoryConfig,
    private repo?: Repository<any>
  ) {
    this.loadFromDatabase();
  }

  private async loadFromDatabase(): Promise<void> {
    if (!this.repo) return;
    
    try {
      const stored = await this.repo.findOne({
        where: { sessionKey: this.sessionKey },
      });
      
      if (stored && stored.buffer) {
        this.buffer = stored.buffer;
      }
    } catch (error) {
      // Ignore errors
    }
  }

  async save(data: any): Promise<void> {
    this.buffer.push(data);
    
    // Keep only last k items
    const k = this.config.k || 10;
    if (this.buffer.length > k) {
      this.buffer = this.buffer.slice(-k);
    }
    
    if (!this.repo) return;
    
    try {
      const existing = await this.repo.findOne({
        where: { sessionKey: this.sessionKey },
      });
      
      if (existing) {
        existing.buffer = this.buffer;
        existing.updatedAt = new Date();
        await this.repo.save(existing);
      } else {
        await this.repo.save({
          sessionKey: this.sessionKey,
          buffer: this.buffer,
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Failed to save buffer memory:', error);
    }
  }

  async load(): Promise<any> {
    return this.buffer;
  }

  async clear(): Promise<void> {
    this.buffer = [];
    await this.save(null);
  }

  async getContext(): Promise<string> {
    if (this.buffer.length === 0) {
      return '';
    }
    
    return 'Recent context:\n' + 
      this.buffer.map(item => JSON.stringify(item)).join('\n');
  }
}

/**
 * Summary Memory - Stores summarized conversation
 */
class SummaryMemory implements IMemory {
  type = 'summary';
  private summary: string = '';
  private recentMessages: any[] = [];
  
  constructor(
    public sessionKey: string,
    private config: MemoryConfig,
    private repo?: Repository<any>
  ) {
    this.loadFromDatabase();
  }

  private async loadFromDatabase(): Promise<void> {
    if (!this.repo) return;
    
    try {
      const stored = await this.repo.findOne({
        where: { sessionKey: this.sessionKey },
      });
      
      if (stored) {
        this.summary = stored.summary || '';
        this.recentMessages = stored.recentMessages || [];
      }
    } catch (error) {
      // Ignore errors
    }
  }

  async save(data: any): Promise<void> {
    this.recentMessages.push(data);
    
    // Summarize when we have enough messages
    if (this.recentMessages.length >= (this.config.k || 5)) {
      await this.summarize();
    }
    
    if (!this.repo) return;
    
    try {
      const existing = await this.repo.findOne({
        where: { sessionKey: this.sessionKey },
      });
      
      if (existing) {
        existing.summary = this.summary;
        existing.recentMessages = this.recentMessages;
        existing.updatedAt = new Date();
        await this.repo.save(existing);
      } else {
        await this.repo.save({
          sessionKey: this.sessionKey,
          summary: this.summary,
          recentMessages: this.recentMessages,
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Failed to save summary memory:', error);
    }
  }

  async load(): Promise<any> {
    return {
      summary: this.summary,
      recentMessages: this.recentMessages,
    };
  }

  async clear(): Promise<void> {
    this.summary = '';
    this.recentMessages = [];
    await this.save(null);
  }

  async getContext(): Promise<string> {
    let context = '';
    
    if (this.summary) {
      context += `Summary of previous conversation:\n${this.summary}\n\n`;
    }
    
    if (this.recentMessages.length > 0) {
      context += `Recent messages:\n${this.recentMessages.map(m => JSON.stringify(m)).join('\n')}`;
    }
    
    return context;
  }

  private async summarize(): Promise<void> {
    // This should use an LLM to summarize the messages
    // For now, just concatenate them
    const messagesToSummarize = this.recentMessages.slice(0, -2); // Keep last 2 as recent
    
    if (this.config.summarizer) {
      // Use provided summarizer function
      this.summary = await this.config.summarizer(this.summary, messagesToSummarize);
    } else {
      // Simple concatenation
      this.summary += '\n' + messagesToSummarize.map(m => JSON.stringify(m)).join(' ');
    }
    
    // Keep only recent messages
    this.recentMessages = this.recentMessages.slice(-2);
  }
}

/**
 * Vector Memory - Stores documents in vector database
 */
class VectorMemory implements IMemory {
  type = 'vector';
  private documents: any[] = [];
  
  constructor(
    public sessionKey: string,
    private config: MemoryConfig,
    private repo?: Repository<any>
  ) {}

  async save(data: any): Promise<void> {
    // Save document to vector store
    await this.addDocument(data);
  }

  async load(): Promise<any> {
    return this.documents;
  }

  async clear(): Promise<void> {
    this.documents = [];
    // Clear from vector store
  }

  async addDocument(document: any): Promise<void> {
    this.documents.push(document);
    
    // Here you would actually add to a vector database
    // like Pinecone, Weaviate, or pgvector
  }

  async search(query: string, k: number = 5): Promise<any[]> {
    // Perform similarity search in vector store
    // For now, return recent documents
    return this.documents.slice(-k);
  }

  async getContext(): Promise<string> {
    if (this.documents.length === 0) {
      return '';
    }
    
    // In real implementation, this would do semantic search
    return 'Relevant documents:\n' + 
      this.documents.slice(-3).map(d => JSON.stringify(d)).join('\n');
  }
}

/**
 * Memory Manager - Factory for creating and managing memory instances
 */
@Injectable()
export class MemoryManager {
  private readonly logger = new Logger(MemoryManager.name);
  private memoryInstances: Map<string, IMemory> = new Map();

  constructor(
    @InjectRepository('WorkflowMemory')
    private memoryRepo: Repository<any>,
  ) {}

  /**
   * Get or create a memory instance
   */
  async getMemory(
    type: string,
    sessionKey: string,
    config?: any
  ): Promise<IMemory> {
    const key = `${type}-${sessionKey}`;
    
    // Check if we already have this memory instance
    if (this.memoryInstances.has(key)) {
      return this.memoryInstances.get(key)!;
    }
    
    // Create new memory instance
    const memoryConfig: MemoryConfig = {
      type: type as any,
      sessionKey,
      ...config,
    };
    
    let memory: IMemory;
    
    switch (type) {
      case 'conversation':
        memory = new ConversationMemory(sessionKey, memoryConfig, this.memoryRepo);
        break;
      case 'buffer':
        memory = new BufferMemory(sessionKey, memoryConfig, this.memoryRepo);
        break;
      case 'summary':
        memory = new SummaryMemory(sessionKey, memoryConfig, this.memoryRepo);
        break;
      case 'vector':
        memory = new VectorMemory(sessionKey, memoryConfig, this.memoryRepo);
        break;
      default:
        throw new Error(`Unknown memory type: ${type}`);
    }
    
    this.memoryInstances.set(key, memory);
    this.logger.log(`Created ${type} memory for session ${sessionKey}`);
    
    return memory;
  }

  /**
   * Clear memory for a session
   */
  async clearMemory(sessionKey: string): Promise<void> {
    // Clear all memory types for this session
    for (const [key, memory] of this.memoryInstances) {
      if (key.includes(sessionKey)) {
        await memory.clear();
        this.memoryInstances.delete(key);
      }
    }
    
    // Also clear from database
    try {
      await this.memoryRepo.delete({ sessionKey });
    } catch (error) {
      this.logger.error(`Failed to clear memory from database: ${error.message}`);
    }
  }

  /**
   * Get all memories for a session
   */
  async getAllMemories(sessionKey: string): Promise<Map<string, any>> {
    const memories = new Map<string, any>();
    
    for (const [key, memory] of this.memoryInstances) {
      if (key.includes(sessionKey)) {
        memories.set(memory.type, await memory.load());
      }
    }
    
    return memories;
  }

  /**
   * Clean up old memories
   */
  async cleanupOldMemories(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    try {
      const result = await this.memoryRepo
        .createQueryBuilder()
        .delete()
        .where('updatedAt < :cutoffDate', { cutoffDate })
        .execute();
      
      this.logger.log(`Cleaned up ${result.affected} old memory records`);
    } catch (error) {
      this.logger.error(`Failed to cleanup old memories: ${error.message}`);
    }
    
    // Also clear from cache
    for (const [key, memory] of this.memoryInstances) {
      // You might want to check last access time here
      this.memoryInstances.delete(key);
    }
  }

  /**
   * Export memory for a session
   */
  async exportMemory(sessionKey: string): Promise<any> {
    const memories = await this.getAllMemories(sessionKey);
    
    return {
      sessionKey,
      exportedAt: new Date(),
      memories: Object.fromEntries(memories),
    };
  }

  /**
   * Import memory for a session
   */
  async importMemory(sessionKey: string, data: any): Promise<void> {
    if (!data.memories) {
      throw new Error('Invalid memory import data');
    }
    
    for (const [type, memoryData] of Object.entries(data.memories)) {
      const memory = await this.getMemory(type, sessionKey);
      
      // Restore memory data
      if (memory.type === 'conversation' && (memory as ConversationMemory).addMessage) {
        for (const msg of memoryData as any[]) {
          await (memory as ConversationMemory).addMessage(msg.role, msg.content);
        }
      } else {
        await memory.save(memoryData);
      }
    }
    
    this.logger.log(`Imported memory for session ${sessionKey}`);
  }
}

export default MemoryManager;